<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Infrastructure\Persistence\Models\User;
use App\Mail\MfaCodeMail;
use App\Mail\WelcomeMail;
use App\Mail\PasswordResetMail;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function login(Request $request): JsonResponse
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required|string|min:6',
        ]);

        $user = User::where('email', $request->email)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['As credenciais informadas estao incorretas.'],
            ]);
        }

        // Check if user is active
        if (isset($user->is_active) && !$user->is_active) {
            throw ValidationException::withMessages([
                'email' => ['Sua conta esta desativada. Entre em contato com o suporte.'],
            ]);
        }

        // Check if MFA is enabled
        if ($user->mfa_enabled) {
            // If email MFA, send OTP code
            if ($user->mfa_method === 'email') {
                $this->sendEmailOtp($user);
            }

            return response()->json([
                'requires_mfa' => true,
                'mfa_method' => $user->mfa_method,
                'temp_token' => encrypt($user->id),
                'message' => $user->mfa_method === 'email'
                    ? 'Codigo de verificacao enviado para seu email.'
                    : 'Insira o codigo do seu aplicativo autenticador.',
            ]);
        }

        $token = $user->createToken('auth-token')->plainTextToken;

        return response()->json([
            'user' => $user,
            'token' => $token,
            'groups' => $user->accessibleGroups(),
        ]);
    }

    /**
     * Send email OTP to user
     */
    private function sendEmailOtp(User $user): void
    {
        $otp = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);

        $user->update([
            'email_otp' => $otp,
            'email_otp_expires_at' => now()->addMinutes(10),
        ]);

        Mail::to($user->email)->send(new MfaCodeMail($otp, $user->name));
    }

    public function register(Request $request): JsonResponse
    {
        $request->validate([
            'name' => 'required|string|min:2|max:50',
            'email' => 'required|email|unique:users,email',
            'username' => 'required|string|min:3|max:50|unique:users,username|regex:/^[a-z0-9_]+$/',
            'password' => 'required|string|min:6|confirmed',
        ]);

        $user = User::create([
            'name' => $request->name,
            'email' => strtolower($request->email),
            'username' => strtolower($request->username),
            'password' => Hash::make($request->password),
            'language' => $request->language ?? 'pt',
        ]);

        // Send welcome email
        try {
            Mail::to($user->email)->send(new WelcomeMail($user->name));
        } catch (\Exception $e) {
            // Log error but don't fail registration
            \Log::error('Failed to send welcome email: ' . $e->getMessage());
        }

        $token = $user->createToken('auth-token')->plainTextToken;

        return response()->json([
            'user' => $user,
            'token' => $token,
            'message' => 'Cadastro realizado com sucesso!',
        ], 201);
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'message' => 'Logout realizado com sucesso!',
        ]);
    }

    public function user(Request $request): JsonResponse
    {
        $user = $request->user();

        return response()->json([
            'user' => $user,
            'groups' => $user->accessibleGroups(),
            'permissions' => [
                'admin_groups' => $user->adminGroupIds(),
                'owner_groups' => $user->ownerGroupIds(),
            ],
        ]);
    }

    public function updateProfile(Request $request): JsonResponse
    {
        $user = $request->user();

        $request->validate([
            'name' => 'sometimes|string|min:2|max:50',
            'language' => 'sometimes|string|in:pt,en',
        ]);

        $user->update($request->only(['name', 'language']));

        return response()->json([
            'user' => $user->fresh(),
            'message' => 'Perfil atualizado com sucesso!',
        ]);
    }

    public function updatePassword(Request $request): JsonResponse
    {
        $user = $request->user();

        $request->validate([
            'current_password' => 'required|string',
            'password' => 'required|string|min:6|confirmed',
        ]);

        if (!Hash::check($request->current_password, $user->password)) {
            throw ValidationException::withMessages([
                'current_password' => ['A senha atual esta incorreta.'],
            ]);
        }

        $user->update([
            'password' => Hash::make($request->password),
            'last_change_password' => now(),
        ]);

        return response()->json([
            'message' => 'Senha alterada com sucesso!',
        ]);
    }

    public function forgotPassword(Request $request): JsonResponse
    {
        $request->validate([
            'email' => 'required|email|exists:users,email',
        ]);

        $user = User::where('email', $request->email)->first();
        $user->generateResetCode();
        $user->save();

        // Send password reset email
        try {
            Mail::to($user->email)->send(new PasswordResetMail($user->reset_code, $user->name));
        } catch (\Exception $e) {
            \Log::error('Failed to send password reset email: ' . $e->getMessage());
            return response()->json([
                'message' => 'Erro ao enviar email. Tente novamente.',
            ], 500);
        }

        return response()->json([
            'message' => 'E-mail de recuperacao enviado!',
        ]);
    }

    public function resetPassword(Request $request): JsonResponse
    {
        $request->validate([
            'email' => 'required|email',
            'code' => 'required|string',
            'password' => 'required|string|min:6|confirmed',
        ]);

        $user = User::where('email', $request->email)
            ->where('reset_code', $request->code)
            ->where('reset_code_expiration', '>', now())
            ->first();

        if (!$user) {
            throw ValidationException::withMessages([
                'code' => ['Codigo invalido ou expirado.'],
            ]);
        }

        $user->update([
            'password' => Hash::make($request->password),
            'reset_code' => null,
            'reset_code_expiration' => null,
            'last_change_password' => now(),
        ]);

        return response()->json([
            'message' => 'Senha redefinida com sucesso!',
        ]);
    }
}
