<?php

namespace Tests\Feature\Api;

use Tests\TestCase;
use App\Infrastructure\Persistence\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use App\Mail\MfaCodeMail;
use App\Mail\WelcomeMail;
use App\Mail\PasswordResetMail;

class AuthTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        Mail::fake();
    }

    // ==================== LOGIN TESTS ====================

    public function test_user_can_login_with_valid_credentials(): void
    {
        $user = User::factory()->create([
            'email' => 'test@example.com',
            'password' => Hash::make('password123'),
            'is_active' => true,
        ]);

        $response = $this->postJson('/api/auth/login', [
            'email' => 'test@example.com',
            'password' => 'password123',
        ]);

        $response->assertOk()
            ->assertJsonStructure([
                'user',
                'token',
                'groups',
            ]);
    }

    public function test_user_cannot_login_with_invalid_password(): void
    {
        $user = User::factory()->create([
            'email' => 'test@example.com',
            'password' => Hash::make('password123'),
        ]);

        $response = $this->postJson('/api/auth/login', [
            'email' => 'test@example.com',
            'password' => 'wrongpassword',
        ]);

        $response->assertUnprocessable()
            ->assertJsonValidationErrors(['email']);
    }

    public function test_user_cannot_login_with_invalid_email(): void
    {
        $response = $this->postJson('/api/auth/login', [
            'email' => 'nonexistent@example.com',
            'password' => 'password123',
        ]);

        $response->assertUnprocessable()
            ->assertJsonValidationErrors(['email']);
    }

    public function test_inactive_user_cannot_login(): void
    {
        $user = User::factory()->inactive()->create([
            'email' => 'inactive@example.com',
            'password' => Hash::make('password123'),
        ]);

        $response = $this->postJson('/api/auth/login', [
            'email' => 'inactive@example.com',
            'password' => 'password123',
        ]);

        $response->assertUnprocessable()
            ->assertJsonValidationErrors(['email']);
    }

    public function test_login_requires_email_and_password(): void
    {
        $response = $this->postJson('/api/auth/login', []);

        $response->assertUnprocessable()
            ->assertJsonValidationErrors(['email', 'password']);
    }

    // ==================== MFA TESTS ====================

    public function test_login_returns_mfa_required_when_totp_enabled(): void
    {
        $user = User::factory()->withMfa('totp')->create([
            'email' => 'mfa@example.com',
            'password' => Hash::make('password123'),
        ]);

        $response = $this->postJson('/api/auth/login', [
            'email' => 'mfa@example.com',
            'password' => 'password123',
        ]);

        $response->assertOk()
            ->assertJson([
                'requires_mfa' => true,
                'mfa_method' => 'totp',
            ])
            ->assertJsonStructure(['temp_token']);
    }

    public function test_login_sends_email_otp_when_email_mfa_enabled(): void
    {
        $user = User::factory()->withMfa('email')->create([
            'email' => 'emailmfa@example.com',
            'password' => Hash::make('password123'),
        ]);

        $response = $this->postJson('/api/auth/login', [
            'email' => 'emailmfa@example.com',
            'password' => 'password123',
        ]);

        $response->assertOk()
            ->assertJson([
                'requires_mfa' => true,
                'mfa_method' => 'email',
            ]);

        Mail::assertSent(MfaCodeMail::class, function ($mail) use ($user) {
            return $mail->hasTo($user->email);
        });
    }

    // ==================== REGISTER TESTS ====================

    public function test_user_can_register(): void
    {
        $response = $this->postJson('/api/auth/register', [
            'name' => 'Test User',
            'email' => 'newuser@example.com',
            'username' => 'testuser',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ]);

        $response->assertCreated()
            ->assertJsonStructure([
                'user',
                'token',
                'message',
            ]);

        $this->assertDatabaseHas('users', [
            'email' => 'newuser@example.com',
            'username' => 'testuser',
        ]);

        Mail::assertSent(WelcomeMail::class);
    }

    public function test_register_requires_unique_email(): void
    {
        User::factory()->create(['email' => 'existing@example.com']);

        $response = $this->postJson('/api/auth/register', [
            'name' => 'Test User',
            'email' => 'existing@example.com',
            'username' => 'newuser',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ]);

        $response->assertUnprocessable()
            ->assertJsonValidationErrors(['email']);
    }

    public function test_register_requires_unique_username(): void
    {
        User::factory()->create(['username' => 'existinguser']);

        $response = $this->postJson('/api/auth/register', [
            'name' => 'Test User',
            'email' => 'new@example.com',
            'username' => 'existinguser',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ]);

        $response->assertUnprocessable()
            ->assertJsonValidationErrors(['username']);
    }

    public function test_register_requires_password_confirmation(): void
    {
        $response = $this->postJson('/api/auth/register', [
            'name' => 'Test User',
            'email' => 'new@example.com',
            'username' => 'testuser',
            'password' => 'password123',
            'password_confirmation' => 'differentpassword',
        ]);

        $response->assertUnprocessable()
            ->assertJsonValidationErrors(['password']);
    }

    public function test_username_must_be_alphanumeric_lowercase(): void
    {
        $response = $this->postJson('/api/auth/register', [
            'name' => 'Test User',
            'email' => 'new@example.com',
            'username' => 'Invalid-User!',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ]);

        $response->assertUnprocessable()
            ->assertJsonValidationErrors(['username']);
    }

    // ==================== LOGOUT TESTS ====================

    public function test_authenticated_user_can_logout(): void
    {
        $this->createUserWithGroup();
        $this->actingAsUser();

        $response = $this->postJson('/api/auth/logout');

        $response->assertOk()
            ->assertJson(['message' => 'Logout realizado com sucesso!']);
    }

    public function test_unauthenticated_user_cannot_logout(): void
    {
        $response = $this->postJson('/api/auth/logout');

        $response->assertUnauthorized();
    }

    // ==================== USER PROFILE TESTS ====================

    public function test_authenticated_user_can_get_profile(): void
    {
        $this->createUserWithGroup();
        $this->actingAsUser();

        $response = $this->getJson('/api/auth/user');

        $response->assertOk()
            ->assertJsonStructure([
                'user',
                'groups',
                'permissions',
            ]);
    }

    public function test_authenticated_user_can_update_profile(): void
    {
        $this->createUserWithGroup();
        $this->actingAsUser();

        $response = $this->putJson('/api/auth/user', [
            'name' => 'Updated Name',
            'language' => 'en',
        ]);

        $response->assertOk()
            ->assertJson(['message' => 'Perfil atualizado com sucesso!']);

        $this->assertDatabaseHas('users', [
            'id' => $this->user->id,
            'name' => 'Updated Name',
            'language' => 'en',
        ]);
    }

    // ==================== PASSWORD TESTS ====================

    public function test_user_can_change_password(): void
    {
        $this->createUserWithGroup();
        $this->user->update(['password' => Hash::make('oldpassword')]);
        $this->actingAsUser();

        $response = $this->putJson('/api/auth/user/password', [
            'current_password' => 'oldpassword',
            'password' => 'newpassword123',
            'password_confirmation' => 'newpassword123',
        ]);

        $response->assertOk()
            ->assertJson(['message' => 'Senha alterada com sucesso!']);

        $this->assertTrue(Hash::check('newpassword123', $this->user->fresh()->password));
    }

    public function test_user_cannot_change_password_with_wrong_current_password(): void
    {
        $this->createUserWithGroup();
        $this->user->update(['password' => Hash::make('oldpassword')]);
        $this->actingAsUser();

        $response = $this->putJson('/api/auth/user/password', [
            'current_password' => 'wrongpassword',
            'password' => 'newpassword123',
            'password_confirmation' => 'newpassword123',
        ]);

        $response->assertUnprocessable()
            ->assertJsonValidationErrors(['current_password']);
    }

    // ==================== FORGOT PASSWORD TESTS ====================

    public function test_user_can_request_password_reset(): void
    {
        $user = User::factory()->create(['email' => 'forgot@example.com']);

        $response = $this->postJson('/api/auth/forgot-password', [
            'email' => 'forgot@example.com',
        ]);

        $response->assertOk()
            ->assertJson(['message' => 'E-mail de recuperacao enviado!']);

        $this->assertNotNull($user->fresh()->reset_code);

        Mail::assertSent(PasswordResetMail::class, function ($mail) use ($user) {
            return $mail->hasTo($user->email);
        });
    }

    public function test_forgot_password_requires_valid_email(): void
    {
        $response = $this->postJson('/api/auth/forgot-password', [
            'email' => 'nonexistent@example.com',
        ]);

        $response->assertUnprocessable()
            ->assertJsonValidationErrors(['email']);
    }

    // ==================== RESET PASSWORD TESTS ====================

    public function test_user_can_reset_password_with_valid_code(): void
    {
        $user = User::factory()->create(['email' => 'reset@example.com']);
        $user->generateResetCode();
        $user->save();

        $response = $this->postJson('/api/auth/reset-password', [
            'email' => 'reset@example.com',
            'code' => $user->reset_code,
            'password' => 'newpassword123',
            'password_confirmation' => 'newpassword123',
        ]);

        $response->assertOk()
            ->assertJson(['message' => 'Senha redefinida com sucesso!']);

        $this->assertTrue(Hash::check('newpassword123', $user->fresh()->password));
        $this->assertNull($user->fresh()->reset_code);
    }

    public function test_reset_password_fails_with_invalid_code(): void
    {
        $user = User::factory()->create(['email' => 'reset@example.com']);
        $user->generateResetCode();
        $user->save();

        $response = $this->postJson('/api/auth/reset-password', [
            'email' => 'reset@example.com',
            'code' => 'invalid-code',
            'password' => 'newpassword123',
            'password_confirmation' => 'newpassword123',
        ]);

        $response->assertUnprocessable()
            ->assertJsonValidationErrors(['code']);
    }

    public function test_reset_password_fails_with_expired_code(): void
    {
        $user = User::factory()->create(['email' => 'reset@example.com']);
        $user->update([
            'reset_code' => 'valid-code',
            'reset_code_expiration' => now()->subHours(2),
        ]);

        $response = $this->postJson('/api/auth/reset-password', [
            'email' => 'reset@example.com',
            'code' => 'valid-code',
            'password' => 'newpassword123',
            'password_confirmation' => 'newpassword123',
        ]);

        $response->assertUnprocessable()
            ->assertJsonValidationErrors(['code']);
    }
}
