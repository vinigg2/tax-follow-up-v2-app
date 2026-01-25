<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Infrastructure\Persistence\Models\User;
use App\Mail\MfaCodeMail;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use PragmaRX\Google2FA\Google2FA;

class MfaController extends Controller
{
    protected Google2FA $google2fa;

    public function __construct()
    {
        $this->google2fa = new Google2FA();
    }

    /**
     * Setup MFA for the authenticated user
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function setup(Request $request): JsonResponse
    {
        $request->validate([
            'method' => 'required|in:totp,email',
        ]);

        $user = $request->user();
        $method = $request->input('method');

        if ($method === 'totp') {
            // Generate secret for TOTP
            $secret = $this->google2fa->generateSecretKey();

            // Generate QR code URL
            $qrCodeUrl = $this->google2fa->getQRCodeUrl(
                config('app.name'),
                $user->email,
                $secret
            );

            // Store secret temporarily (will be confirmed on verify)
            $user->update([
                'mfa_secret' => encrypt($secret),
                'mfa_method' => 'totp',
            ]);

            return response()->json([
                'method' => 'totp',
                'secret' => $secret,
                'qr_code_url' => $qrCodeUrl,
                'message' => 'Escaneie o QR code com seu aplicativo autenticador e confirme com o codigo.',
            ]);
        }

        // Email OTP method
        $user->update([
            'mfa_method' => 'email',
        ]);

        // Send test OTP
        $this->sendEmailOtpToUser($user);

        return response()->json([
            'method' => 'email',
            'message' => 'Um codigo foi enviado para seu email. Confirme para ativar o MFA.',
        ]);
    }

    /**
     * Verify MFA setup and enable it
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function verify(Request $request): JsonResponse
    {
        $request->validate([
            'code' => 'required|string',
        ]);

        $user = $request->user();
        $code = $request->input('code');

        if (!$user->mfa_method) {
            return response()->json([
                'message' => 'MFA nao foi configurado. Execute o setup primeiro.',
            ], 400);
        }

        $isValid = $this->validateCode($user, $code);

        if (!$isValid) {
            return response()->json([
                'message' => 'Codigo invalido ou expirado.',
            ], 422);
        }

        // Enable MFA
        $user->update([
            'mfa_enabled' => true,
            'mfa_verified_at' => now(),
            'email_otp' => null,
            'email_otp_expires_at' => null,
        ]);

        // Generate backup codes
        $backupCodes = $this->generateBackupCodesForUser($user);

        return response()->json([
            'message' => 'MFA ativado com sucesso.',
            'backup_codes' => $backupCodes,
        ]);
    }

    /**
     * Confirm MFA during login
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function confirm(Request $request): JsonResponse
    {
        $request->validate([
            'temp_token' => 'required|string',
            'code' => 'required|string',
        ]);

        try {
            $userId = decrypt($request->input('temp_token'));
            $user = User::findOrFail($userId);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Token invalido ou expirado.',
            ], 401);
        }

        $code = $request->input('code');
        $isValid = $this->validateCode($user, $code);

        // Check backup codes if primary validation fails
        if (!$isValid) {
            $isValid = $this->validateBackupCode($user, $code);
        }

        if (!$isValid) {
            return response()->json([
                'message' => 'Codigo invalido ou expirado.',
            ], 422);
        }

        // Clear email OTP if used
        if ($user->mfa_method === 'email') {
            $user->update([
                'email_otp' => null,
                'email_otp_expires_at' => null,
            ]);
        }

        // Create token
        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'token' => $token,
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'avatar' => $user->avatar,
                'language' => $user->language,
            ],
            'groups' => $user->accessibleGroups(),
            'permissions' => [
                'admin_groups' => $user->adminGroupIds(),
                'manager_groups' => $user->managerGroupIds(),
                'member_groups' => $user->memberGroupIds(),
                'owner_groups' => $user->ownerGroupIds(),
            ],
        ]);
    }

    /**
     * Disable MFA for the authenticated user
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function disable(Request $request): JsonResponse
    {
        $request->validate([
            'password' => 'required|string',
        ]);

        $user = $request->user();

        if (!Hash::check($request->input('password'), $user->password)) {
            return response()->json([
                'message' => 'Senha incorreta.',
            ], 422);
        }

        $user->update([
            'mfa_enabled' => false,
            'mfa_method' => null,
            'mfa_secret' => null,
            'mfa_backup_codes' => null,
            'mfa_verified_at' => null,
            'email_otp' => null,
            'email_otp_expires_at' => null,
        ]);

        return response()->json([
            'message' => 'MFA desativado com sucesso.',
        ]);
    }

    /**
     * Generate new backup codes
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function generateBackupCodes(Request $request): JsonResponse
    {
        $request->validate([
            'password' => 'required|string',
        ]);

        $user = $request->user();

        if (!Hash::check($request->input('password'), $user->password)) {
            return response()->json([
                'message' => 'Senha incorreta.',
            ], 422);
        }

        if (!$user->mfa_enabled) {
            return response()->json([
                'message' => 'MFA nao esta ativado.',
            ], 400);
        }

        $backupCodes = $this->generateBackupCodesForUser($user);

        return response()->json([
            'message' => 'Novos codigos de backup gerados.',
            'backup_codes' => $backupCodes,
        ]);
    }

    /**
     * Send email OTP (used during login when method is email)
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function sendEmailOtp(Request $request): JsonResponse
    {
        $request->validate([
            'temp_token' => 'required|string',
        ]);

        try {
            $userId = decrypt($request->input('temp_token'));
            $user = User::findOrFail($userId);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Token invalido ou expirado.',
            ], 401);
        }

        if ($user->mfa_method !== 'email') {
            return response()->json([
                'message' => 'Este usuario nao usa MFA por email.',
            ], 400);
        }

        $this->sendEmailOtpToUser($user);

        return response()->json([
            'message' => 'Codigo enviado para o email.',
        ]);
    }

    /**
     * Get MFA status for the authenticated user
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function status(Request $request): JsonResponse
    {
        $user = $request->user();

        return response()->json([
            'mfa_enabled' => $user->mfa_enabled,
            'mfa_method' => $user->mfa_method,
            'mfa_verified_at' => $user->mfa_verified_at,
            'has_backup_codes' => !empty($user->mfa_backup_codes),
        ]);
    }

    /**
     * Validate code based on MFA method
     */
    private function validateCode(User $user, string $code): bool
    {
        if ($user->mfa_method === 'totp') {
            try {
                $secret = decrypt($user->mfa_secret);
                return $this->google2fa->verifyKey($secret, $code);
            } catch (\Exception $e) {
                return false;
            }
        }

        // Email OTP validation
        if ($user->email_otp === $code && $user->email_otp_expires_at > now()) {
            return true;
        }

        return false;
    }

    /**
     * Validate backup code
     */
    private function validateBackupCode(User $user, string $code): bool
    {
        if (empty($user->mfa_backup_codes)) {
            return false;
        }

        try {
            $backupCodes = json_decode(decrypt($user->mfa_backup_codes), true);

            $index = array_search($code, $backupCodes);
            if ($index !== false) {
                // Remove used backup code
                unset($backupCodes[$index]);
                $user->update([
                    'mfa_backup_codes' => encrypt(json_encode(array_values($backupCodes))),
                ]);
                return true;
            }
        } catch (\Exception $e) {
            return false;
        }

        return false;
    }

    /**
     * Generate backup codes for user
     */
    private function generateBackupCodesForUser(User $user): array
    {
        $backupCodes = [];
        for ($i = 0; $i < 8; $i++) {
            $backupCodes[] = strtoupper(Str::random(4) . '-' . Str::random(4));
        }

        $user->update([
            'mfa_backup_codes' => encrypt(json_encode($backupCodes)),
        ]);

        return $backupCodes;
    }

    /**
     * Send email OTP to user
     */
    private function sendEmailOtpToUser(User $user): void
    {
        $otp = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);

        $user->update([
            'email_otp' => $otp,
            'email_otp_expires_at' => now()->addMinutes(10),
        ]);

        Mail::to($user->email)->send(new MfaCodeMail($otp, $user->name));
    }
}
