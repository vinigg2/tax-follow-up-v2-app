<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Web\SamlController;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
*/

// SAML routes
Route::prefix('saml')->group(function () {
    Route::get('login', [SamlController::class, 'login'])->name('saml.login');
    Route::post('acs', [SamlController::class, 'acs'])->name('saml.acs');
    Route::get('logout', [SamlController::class, 'logout'])->name('saml.logout');
    Route::get('metadata', [SamlController::class, 'metadata'])->name('saml.metadata');
});

// SPA Fallback - React handles all other routes
Route::get('/{any?}', function () {
    return view('app');
})->where('any', '.*');
