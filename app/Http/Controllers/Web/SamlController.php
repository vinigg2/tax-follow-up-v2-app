<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Infrastructure\Persistence\Models\User;
use App\Infrastructure\Persistence\Models\Group;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use OneLogin\Saml2\Auth as Saml2Auth;
use OneLogin\Saml2\Settings;
use OneLogin\Saml2\Utils;

class SamlController extends Controller
{
    /**
     * Get SAML2 Auth instance
     */
    protected function getSaml2Auth(): ?Saml2Auth
    {
        if (!config('saml2_settings.enabled')) {
            return null;
        }

        $settings = $this->getSamlSettings();
        return new Saml2Auth($settings);
    }

    /**
     * Build SAML settings array for OneLogin library
     */
    protected function getSamlSettings(): array
    {
        $config = config('saml2_settings');

        return [
            'strict' => true,
            'debug' => config('app.debug'),
            'baseurl' => config('app.url') . '/saml',

            'sp' => [
                'entityId' => $config['sp']['entityId'],
                'assertionConsumerService' => $config['sp']['assertionConsumerService'],
                'singleLogoutService' => $config['sp']['singleLogoutService'],
                'NameIDFormat' => $config['sp']['NameIDFormat'],
                'x509cert' => $config['sp']['x509cert'],
                'privateKey' => $config['sp']['privateKey'],
            ],

            'idp' => [
                'entityId' => $config['idp']['entityId'],
                'singleSignOnService' => $config['idp']['singleSignOnService'],
                'singleLogoutService' => $config['idp']['singleLogoutService'],
                'x509cert' => $config['idp']['x509cert'],
                'certFingerprint' => $config['idp']['certFingerprint'],
                'certFingerprintAlgorithm' => $config['idp']['certFingerprintAlgorithm'],
            ],

            'security' => $config['security'],
        ];
    }

    /**
     * Initiate SAML login - redirect to IdP
     */
    public function login(Request $request)
    {
        if (!config('saml2_settings.enabled')) {
            return response()->json([
                'message' => 'SAML authentication is not enabled',
            ], 501);
        }

        try {
            $saml2Auth = $this->getSaml2Auth();

            // Store return URL in session
            $returnTo = $request->input('returnTo', config('app.frontend_url', '/'));
            session(['saml_return_to' => $returnTo]);

            // Redirect to IdP
            $saml2Auth->login($returnTo);
        } catch (\Exception $e) {
            Log::error('SAML login error: ' . $e->getMessage());
            return response()->json([
                'message' => 'SAML login failed',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal error',
            ], 500);
        }
    }

    /**
     * Handle SAML assertion consumer service (ACS)
     * This is where the IdP sends the SAML response after authentication
     */
    public function acs(Request $request)
    {
        if (!config('saml2_settings.enabled')) {
            return response()->json([
                'message' => 'SAML authentication is not enabled',
            ], 501);
        }

        try {
            $saml2Auth = $this->getSaml2Auth();

            // Process the SAML response
            $saml2Auth->processResponse();

            $errors = $saml2Auth->getErrors();
            if (!empty($errors)) {
                Log::error('SAML ACS errors: ' . implode(', ', $errors));
                Log::error('SAML Last Error Reason: ' . $saml2Auth->getLastErrorReason());

                return redirect(config('app.frontend_url', '/') . '/auth/login?error=saml_failed');
            }

            if (!$saml2Auth->isAuthenticated()) {
                Log::warning('SAML user not authenticated');
                return redirect(config('app.frontend_url', '/') . '/auth/login?error=not_authenticated');
            }

            // Get user attributes from SAML response
            $attributes = $saml2Auth->getAttributes();
            $nameId = $saml2Auth->getNameId();

            // Map attributes to user fields
            $userData = $this->mapSamlAttributes($attributes, $nameId);

            // Find or create user
            $user = $this->findOrCreateSamlUser($userData);

            if (!$user) {
                Log::error('Failed to create/find SAML user');
                return redirect(config('app.frontend_url', '/') . '/auth/login?error=user_creation_failed');
            }

            // Create Sanctum token for the user
            $token = $user->createToken('saml-auth')->plainTextToken;

            // Get return URL from session
            $returnTo = session('saml_return_to', config('app.frontend_url', '/'));
            session()->forget('saml_return_to');

            // Redirect to frontend with token
            $separator = str_contains($returnTo, '?') ? '&' : '?';
            return redirect($returnTo . $separator . 'token=' . $token);

        } catch (\Exception $e) {
            Log::error('SAML ACS error: ' . $e->getMessage());
            return redirect(config('app.frontend_url', '/') . '/auth/login?error=saml_error');
        }
    }

    /**
     * Handle SAML logout
     */
    public function logout(Request $request)
    {
        if (!config('saml2_settings.enabled')) {
            return response()->json([
                'message' => 'SAML authentication is not enabled',
            ], 501);
        }

        try {
            // Revoke current user's tokens
            if ($request->user()) {
                $request->user()->tokens()->delete();
            }

            $saml2Auth = $this->getSaml2Auth();

            // If IdP supports SLO, initiate logout
            $idpSloUrl = config('saml2_settings.idp.singleLogoutService.url');
            if (!empty($idpSloUrl)) {
                $returnTo = config('app.frontend_url', '/') . '/auth/login?logout=success';
                $saml2Auth->logout($returnTo);
            }

            // If no SLO, just redirect
            return redirect(config('app.frontend_url', '/') . '/auth/login?logout=success');

        } catch (\Exception $e) {
            Log::error('SAML logout error: ' . $e->getMessage());
            return redirect(config('app.frontend_url', '/') . '/auth/login');
        }
    }

    /**
     * Return SAML metadata for this Service Provider
     */
    public function metadata(Request $request)
    {
        if (!config('saml2_settings.enabled')) {
            return response('SAML authentication is not enabled', 501)
                ->header('Content-Type', 'text/plain');
        }

        try {
            $settings = new Settings($this->getSamlSettings(), true);
            $metadata = $settings->getSPMetadata();

            $errors = $settings->validateMetadata($metadata);
            if (!empty($errors)) {
                Log::error('SAML metadata validation errors: ' . implode(', ', $errors));
            }

            return response($metadata, 200, [
                'Content-Type' => 'application/xml',
            ]);
        } catch (\Exception $e) {
            Log::error('SAML metadata error: ' . $e->getMessage());
            return response('Error generating metadata', 500)
                ->header('Content-Type', 'text/plain');
        }
    }

    /**
     * Map SAML attributes to user data
     */
    protected function mapSamlAttributes(array $attributes, string $nameId): array
    {
        $mapping = config('saml2_settings.attributeMapping');

        // Get email - try mapped attribute first, then nameId
        $email = $this->getAttribute($attributes, $mapping['email']) ?? $nameId;

        // Get name - try mapped attribute, or construct from first/last name
        $name = $this->getAttribute($attributes, $mapping['name']);
        if (empty($name)) {
            $firstName = $this->getAttribute($attributes, $mapping['first_name']) ?? '';
            $lastName = $this->getAttribute($attributes, $mapping['last_name']) ?? '';
            $name = trim($firstName . ' ' . $lastName);
        }

        // Fallback name from email
        if (empty($name)) {
            $name = explode('@', $email)[0];
        }

        return [
            'email' => strtolower($email),
            'name' => $name,
            'saml_id' => $nameId,
        ];
    }

    /**
     * Get attribute value from SAML attributes array
     */
    protected function getAttribute(array $attributes, string $key): ?string
    {
        if (isset($attributes[$key])) {
            return is_array($attributes[$key]) ? $attributes[$key][0] : $attributes[$key];
        }
        return null;
    }

    /**
     * Find existing user or create new one from SAML data
     */
    protected function findOrCreateSamlUser(array $userData): ?User
    {
        // Try to find existing user by email
        $user = User::where('email', $userData['email'])->first();

        if ($user) {
            // Update SAML ID if not set
            if (empty($user->saml_id)) {
                $user->saml_id = $userData['saml_id'];
                $user->save();
            }
            return $user;
        }

        // Auto-create user if enabled
        if (!config('saml2_settings.autoCreateUsers')) {
            Log::warning('SAML auto-create disabled, user not found: ' . $userData['email']);
            return null;
        }

        // Create new user
        $user = User::create([
            'email' => $userData['email'],
            'name' => $userData['name'],
            'username' => $this->generateUsername($userData['email']),
            'password' => Hash::make(Str::random(32)), // Random password (won't be used)
            'saml_id' => $userData['saml_id'],
            'confirmed_at' => now(), // SAML users are pre-confirmed
            'language' => 'pt',
        ]);

        // Assign default role
        $defaultRole = config('saml2_settings.defaultRole', 'member');
        $user->assignRole($defaultRole);

        // Add to default group if configured
        $defaultGroupId = config('saml2_settings.defaultGroupId');
        if ($defaultGroupId) {
            $group = Group::find($defaultGroupId);
            if ($group) {
                $group->users()->attach($user->id, ['role' => 'member']);
            }
        }

        Log::info('Created SAML user: ' . $user->email);

        return $user;
    }

    /**
     * Generate unique username from email
     */
    protected function generateUsername(string $email): string
    {
        $base = explode('@', $email)[0];
        $base = preg_replace('/[^a-z0-9]/', '', strtolower($base));

        $username = $base;
        $counter = 1;

        while (User::where('username', $username)->exists()) {
            $username = $base . $counter;
            $counter++;
        }

        return $username;
    }
}
