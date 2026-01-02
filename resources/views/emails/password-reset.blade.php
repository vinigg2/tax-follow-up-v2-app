<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Redefinicao de Senha</title>
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
            background-color: #fef2f2;
            border: 2px dashed #dc2626;
            border-radius: 8px;
            padding: 20px;
            text-align: center;
            margin: 30px 0;
        }
        .code {
            font-size: 28px;
            font-weight: bold;
            letter-spacing: 4px;
            color: #991b1b;
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

        <p>Recebemos uma solicitacao para redefinir a senha da sua conta. Use o codigo abaixo para criar uma nova senha:</p>

        <div class="code-box">
            <div class="code">{{ $resetCode }}</div>
        </div>

        <div class="warning">
            <strong>Importante:</strong> Este codigo expira em 24 horas. Se voce nao solicitou a redefinicao de senha, ignore este email.
        </div>

        <p>Para redefinir sua senha:</p>
        <ol>
            <li>Acesse a pagina de redefinicao de senha</li>
            <li>Insira o codigo acima</li>
            <li>Crie uma nova senha segura</li>
        </ol>

        <div class="footer">
            <p>&copy; {{ date('Y') }} Tax Follow Up. Todos os direitos reservados.</p>
            <p>Este e um email automatico, por favor nao responda.</p>
        </div>
    </div>
</body>
</html>
