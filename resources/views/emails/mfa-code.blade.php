<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Codigo de Verificacao</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .container {
            background-color: #ffffff;
            border-radius: 8px;
            padding: 40px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
        }
        .logo {
            font-size: 24px;
            font-weight: bold;
            color: #2563eb;
        }
        .code-box {
            background-color: #f0f9ff;
            border: 2px dashed #2563eb;
            border-radius: 8px;
            padding: 20px;
            text-align: center;
            margin: 30px 0;
        }
        .code {
            font-size: 32px;
            font-weight: bold;
            letter-spacing: 8px;
            color: #1e40af;
        }
        .warning {
            background-color: #fef3c7;
            border-left: 4px solid #f59e0b;
            padding: 12px 16px;
            margin: 20px 0;
            border-radius: 0 4px 4px 0;
        }
        .footer {
            text-align: center;
            margin-top: 30px;
            color: #6b7280;
            font-size: 12px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">Tax Follow Up</div>
        </div>

        <p>Ola, {{ $userName }}!</p>

        <p>Voce solicitou um codigo de verificacao para acessar sua conta. Use o codigo abaixo:</p>

        <div class="code-box">
            <div class="code">{{ $code }}</div>
        </div>

        <div class="warning">
            <strong>Importante:</strong> Este codigo expira em 10 minutos. Nao compartilhe este codigo com ninguem.
        </div>

        <p>Se voce nao solicitou este codigo, ignore este email ou entre em contato com o suporte.</p>

        <div class="footer">
            <p>&copy; {{ date('Y') }} Tax Follow Up. Todos os direitos reservados.</p>
            <p>Este e um email automatico, por favor nao responda.</p>
        </div>
    </div>
</body>
</html>
