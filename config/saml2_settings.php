<?php

return [
    /*
    |--------------------------------------------------------------------------
    | SAML2 Settings
    |--------------------------------------------------------------------------
    |
    | Configuration for SAML2 authentication using aacotroneo/laravel-saml2
    |
    */

    // Enable/disable SAML authentication
    'enabled' => env('SAML_ENABLED', false),

    // If you choose a custom route prefix, use routesPrefix
    'routesPrefix' => '/saml',

    // If 'useRoutes' is set to true, the package will load routes
    'useRoutes' => false, // We define our own routes

    // If 'proxyVars' is set to true, the package will trust proxy headers
    'proxyVars' => env('SAML_PROXY_VARS', false),

    // Service Provider Data
    'sp' => [
        // Entity ID of this Service Provider
        'entityId' => env('SAML_SP_ENTITY_ID', env('APP_URL') . '/saml/metadata'),

        // Assertion Consumer Service (ACS) - where IdP sends responses
        'assertionConsumerService' => [
            'url' => env('SAML_SP_ACS_URL', env('APP_URL') . '/saml/acs'),
            'binding' => 'urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST',
        ],

        // Single Logout Service
        'singleLogoutService' => [
            'url' => env('SAML_SP_SLS_URL', env('APP_URL') . '/saml/logout'),
            'binding' => 'urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect',
        ],

        // Name ID format
        'NameIDFormat' => 'urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress',

        // SP certificate and private key (optional, for signed requests)
        'x509cert' => env('SAML_SP_CERT', ''),
        'privateKey' => env('SAML_SP_PRIVATE_KEY', ''),
    ],

    // Identity Provider Data
    'idp' => [
        // IdP Entity ID
        'entityId' => env('SAML_IDP_ENTITY_ID', ''),

        // Single Sign-On Service
        'singleSignOnService' => [
            'url' => env('SAML_IDP_SSO_URL', ''),
            'binding' => 'urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect',
        ],

        // Single Logout Service
        'singleLogoutService' => [
            'url' => env('SAML_IDP_SLS_URL', ''),
            'binding' => 'urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect',
        ],

        // IdP certificate (required)
        'x509cert' => env('SAML_IDP_CERT', ''),

        // Multiple certificates for rotation
        'certFingerprint' => env('SAML_IDP_CERT_FINGERPRINT', ''),
        'certFingerprintAlgorithm' => 'sha256',
    ],

    // Security settings
    'security' => [
        // Sign AuthnRequest
        'authnRequestsSigned' => env('SAML_AUTHN_REQUESTS_SIGNED', false),

        // Want assertions signed
        'wantAssertionsSigned' => env('SAML_WANT_ASSERTIONS_SIGNED', true),

        // Want assertions encrypted
        'wantAssertionsEncrypted' => env('SAML_WANT_ASSERTIONS_ENCRYPTED', false),

        // Want NameId encrypted
        'wantNameIdEncrypted' => env('SAML_WANT_NAMEID_ENCRYPTED', false),

        // Sign metadata
        'signMetadata' => env('SAML_SIGN_METADATA', false),

        // Want XML validation
        'wantXMLValidation' => true,

        // Relax destination validation
        'relaxDestinationValidation' => env('SAML_RELAX_DESTINATION_VALIDATION', false),

        // Request signature algorithm
        'requestedAuthnContext' => false,
    ],

    // Attribute mapping - map SAML attributes to user fields
    'attributeMapping' => [
        'email' => env('SAML_ATTR_EMAIL', 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'),
        'name' => env('SAML_ATTR_NAME', 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'),
        'first_name' => env('SAML_ATTR_FIRST_NAME', 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/givenname'),
        'last_name' => env('SAML_ATTR_LAST_NAME', 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/surname'),
    ],

    // Default group for new SAML users
    'defaultGroupId' => env('SAML_DEFAULT_GROUP_ID', null),

    // Auto-create users on first login
    'autoCreateUsers' => env('SAML_AUTO_CREATE_USERS', true),

    // Default role for auto-created users
    'defaultRole' => env('SAML_DEFAULT_ROLE', 'member'),
];
