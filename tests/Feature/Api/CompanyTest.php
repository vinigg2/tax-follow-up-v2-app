<?php

namespace Tests\Feature\Api;

use Tests\TestCase;
use App\Infrastructure\Persistence\Models\Company;
use App\Infrastructure\Persistence\Models\Group;
use App\Infrastructure\Persistence\Models\User;

class CompanyTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        $this->createUserWithGroup();
    }

    // ==================== INDEX TESTS ====================

    public function test_can_list_companies(): void
    {
        Company::factory()->count(5)->forGroup($this->group)->create();

        $this->actingAsUser();

        $response = $this->getJson('/api/companies', $this->withTenantHeaders());

        $response->assertOk()
            ->assertJsonStructure([
                'companies',
                'meta' => ['total', 'per_page', 'current_page', 'last_page'],
            ]);

        $this->assertCount(5, $response->json('companies'));
    }

    public function test_cannot_list_companies_without_auth(): void
    {
        Company::factory()->count(3)->forGroup($this->group)->create();

        $response = $this->getJson('/api/companies');

        $response->assertUnauthorized();
    }

    public function test_list_only_companies_from_accessible_groups(): void
    {
        $otherGroup = Group::factory()->create();

        Company::factory()->count(3)->forGroup($this->group)->create();
        Company::factory()->count(2)->forGroup($otherGroup)->create();

        $this->actingAsUser();

        $response = $this->getJson('/api/companies', $this->withTenantHeaders());

        $response->assertOk();
        $this->assertCount(3, $response->json('companies'));
    }

    public function test_list_excludes_deleted_companies(): void
    {
        Company::factory()->count(3)->forGroup($this->group)->create();
        Company::factory()->forGroup($this->group)->create(['deleted' => true]);

        $this->actingAsUser();

        $response = $this->getJson('/api/companies', $this->withTenantHeaders());

        $response->assertOk();
        $this->assertCount(3, $response->json('companies'));
    }

    public function test_list_companies_sorted_by_name(): void
    {
        Company::factory()->forGroup($this->group)->create(['name' => 'Zebra Corp']);
        Company::factory()->forGroup($this->group)->create(['name' => 'Alpha Inc']);
        Company::factory()->forGroup($this->group)->create(['name' => 'Beta Ltd']);

        $this->actingAsUser();

        $response = $this->getJson('/api/companies', $this->withTenantHeaders());

        $response->assertOk();
        $companies = $response->json('companies');
        $this->assertEquals('Alpha Inc', $companies[0]['name']);
        $this->assertEquals('Beta Ltd', $companies[1]['name']);
        $this->assertEquals('Zebra Corp', $companies[2]['name']);
    }

    // ==================== SHOW TESTS ====================

    public function test_can_show_company(): void
    {
        $company = Company::factory()->forGroup($this->group)->create();

        $this->actingAsUser();

        $response = $this->getJson("/api/companies/{$company->id}", $this->withTenantHeaders());

        $response->assertOk()
            ->assertJsonStructure(['company' => ['id', 'name', 'cnpj', 'country', 'group_id']]);
    }

    public function test_cannot_show_company_from_other_group(): void
    {
        $otherGroup = Group::factory()->create();
        $company = Company::factory()->forGroup($otherGroup)->create();

        $this->actingAsUser();

        $response = $this->getJson("/api/companies/{$company->id}", $this->withTenantHeaders());

        $response->assertNotFound();
    }

    public function test_cannot_show_deleted_company(): void
    {
        $company = Company::factory()->forGroup($this->group)->create(['deleted' => true]);

        $this->actingAsUser();

        $response = $this->getJson("/api/companies/{$company->id}", $this->withTenantHeaders());

        $response->assertNotFound();
    }

    // ==================== STORE TESTS ====================

    public function test_can_create_company(): void
    {
        $this->actingAsUser();

        $response = $this->postJson('/api/companies', [
            'name' => 'Nova Empresa LTDA',
            'cnpj' => '12.345.678/0001-90',
            'country' => 'BR',
            'group_id' => $this->group->id,
        ], $this->withTenantHeaders());

        $response->assertCreated()
            ->assertJsonPath('company.name', 'Nova Empresa LTDA')
            ->assertJsonPath('message', 'Empresa criada com sucesso!');

        $this->assertDatabaseHas('companies', [
            'name' => 'Nova Empresa LTDA',
            'cnpj' => '12.345.678/0001-90',
        ]);
    }

    public function test_cannot_create_company_without_required_fields(): void
    {
        $this->actingAsUser();

        $response = $this->postJson('/api/companies', [], $this->withTenantHeaders());

        $response->assertUnprocessable()
            ->assertJsonValidationErrors(['name', 'cnpj', 'country', 'group_id']);
    }

    public function test_cannot_create_company_for_other_group(): void
    {
        $otherGroup = Group::factory()->create();

        $this->actingAsUser();

        $response = $this->postJson('/api/companies', [
            'name' => 'Empresa Inválida',
            'cnpj' => '12.345.678/0001-90',
            'country' => 'BR',
            'group_id' => $otherGroup->id,
        ], $this->withTenantHeaders());

        $response->assertUnprocessable()
            ->assertJsonValidationErrors(['group_id']);
    }

    public function test_validates_country_length(): void
    {
        $this->actingAsUser();

        $response = $this->postJson('/api/companies', [
            'name' => 'Empresa Test',
            'cnpj' => '12.345.678/0001-90',
            'country' => 'BRA', // Should be 2 chars
            'group_id' => $this->group->id,
        ], $this->withTenantHeaders());

        $response->assertUnprocessable()
            ->assertJsonValidationErrors(['country']);
    }

    // ==================== UPDATE TESTS ====================

    public function test_can_update_company(): void
    {
        $company = Company::factory()->forGroup($this->group)->create([
            'name' => 'Empresa Original',
        ]);

        $this->actingAsUser();

        $response = $this->putJson("/api/companies/{$company->id}", [
            'name' => 'Empresa Atualizada',
        ], $this->withTenantHeaders());

        $response->assertOk()
            ->assertJsonPath('company.name', 'Empresa Atualizada')
            ->assertJsonPath('message', 'Empresa atualizada com sucesso!');

        $this->assertDatabaseHas('companies', [
            'id' => $company->id,
            'name' => 'Empresa Atualizada',
        ]);
    }

    public function test_can_update_multiple_fields(): void
    {
        $company = Company::factory()->forGroup($this->group)->create();

        $this->actingAsUser();

        $response = $this->putJson("/api/companies/{$company->id}", [
            'name' => 'Updated Name',
            'cnpj' => '98.765.432/0001-10',
            'country' => 'US',
        ], $this->withTenantHeaders());

        $response->assertOk();
        $this->assertDatabaseHas('companies', [
            'id' => $company->id,
            'name' => 'Updated Name',
            'cnpj' => '98.765.432/0001-10',
            'country' => 'US',
        ]);
    }

    public function test_cannot_update_company_from_other_group(): void
    {
        $otherGroup = Group::factory()->create();
        $company = Company::factory()->forGroup($otherGroup)->create();

        $this->actingAsUser();

        $response = $this->putJson("/api/companies/{$company->id}", [
            'name' => 'Tentativa de Update',
        ], $this->withTenantHeaders());

        $response->assertNotFound();
    }

    // ==================== DELETE TESTS ====================

    public function test_can_delete_company(): void
    {
        $company = Company::factory()->forGroup($this->group)->create();

        $this->actingAsUser();

        $response = $this->deleteJson("/api/companies/{$company->id}", [], $this->withTenantHeaders());

        $response->assertOk()
            ->assertJsonPath('message', 'Empresa excluida com sucesso!');

        $this->assertDatabaseHas('companies', [
            'id' => $company->id,
            'deleted' => true,
        ]);
    }

    public function test_cannot_delete_company_from_other_group(): void
    {
        $otherGroup = Group::factory()->create();
        $company = Company::factory()->forGroup($otherGroup)->create();

        $this->actingAsUser();

        $response = $this->deleteJson("/api/companies/{$company->id}", [], $this->withTenantHeaders());

        $response->assertNotFound();
    }

    public function test_cannot_delete_already_deleted_company(): void
    {
        $company = Company::factory()->forGroup($this->group)->create(['deleted' => true]);

        $this->actingAsUser();

        $response = $this->deleteJson("/api/companies/{$company->id}", [], $this->withTenantHeaders());

        $response->assertNotFound();
    }
}
