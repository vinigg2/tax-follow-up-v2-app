<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Bem-vindo ao Tax Follow Up</title>
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
        .welcome-box {
            background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
            border-radius: 8px;
            padding: 30px;
            text-align: center;
            margin: 30px 0;
            color: white;
        }
        .welcome-title {
            font-size: 28px;
            font-weight: bold;
            margin-bottom: 10px;
        }
        .feature-list {
            background-color: #f0f9ff;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
        }
        .feature-list li {
            margin: 10px 0;
            padding-left: 10px;
        }
        .cta-button {
            display: inline-block;
            background-color: #2563eb;
            color: white;
            padding: 14px 28px;
            text-decoration: none;
            border-radius: 6px;
            font-weight: bold;
            margin: 20px 0;
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

        <div class="welcome-box">
            <div class="welcome-title">Bem-vindo!</div>
            <p>Sua conta foi criada com sucesso</p>
        </div>

        <p>Ola, {{ $userName }}!</p>

        <p>Estamos muito felizes em te-lo conosco! Sua conta no Tax Follow Up foi criada com sucesso e voce ja pode comecar a usar nossa plataforma.</p>

        <div class="feature-list">
            <p><strong>Com o Tax Follow Up voce pode:</strong></p>
            <ul>
                <li>Gerenciar suas obrigacoes fiscais</li>
                <li>Acompanhar prazos e tarefas</li>
                <li>Controlar documentos e aprovacoes</li>
                <li>Visualizar metricas e relatorios</li>
                <li>Colaborar com sua equipe</li>
            </ul>
        </div>

        <p style="text-align: center;">
            <a href="{{ config('app.url') }}" class="cta-button">Acessar Plataforma</a>
        </p>

        <p>Se tiver alguma duvida, nossa equipe de suporte esta pronta para ajudar.</p>

        <div class="footer">
            <p>&copy; {{ date('Y') }} Tax Follow Up. Todos os direitos reservados.</p>
            <p>Este e um email automatico, por favor nao responda.</p>
        </div>
    </div>
</body>
</html>
