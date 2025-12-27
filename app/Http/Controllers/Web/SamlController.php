<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class SamlController extends Controller
{
    /**
     * Initiate SAML login
     */
    public function login(Request $request)
    {
        // TODO: Implement SAML login with aacotroneo/laravel-saml2
        return response()->json([
            'message' => 'SAML login not configured',
        ], 501);
    }

    /**
     * Handle SAML assertion consumer service
     */
    public function acs(Request $request)
    {
        // TODO: Implement SAML ACS
        return response()->json([
            'message' => 'SAML ACS not configured',
        ], 501);
    }

    /**
     * Handle SAML logout
     */
    public function logout(Request $request)
    {
        // TODO: Implement SAML logout
        return response()->json([
            'message' => 'SAML logout not configured',
        ], 501);
    }

    /**
     * Return SAML metadata
     */
    public function metadata(Request $request)
    {
        // TODO: Implement SAML metadata generation
        return response('SAML metadata not configured', 501)
            ->header('Content-Type', 'text/plain');
    }
}
