export const getHealthTemplate = (displayLastPing: string): string => `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Liftech - Status</title>
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background-color: #0d1117;
      color: #c9d1d9;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100vh;
      margin: 0;
    }
    .status-card {
      background: #161b22;
      border: 1px solid #30363d;
      border-radius: 8px;
      padding: 30px;
      text-align: center;
      box-shadow: 0 8px 24px rgba(0,0,0,0.2);
      max-width: 400px;
      width: 100%;
    }
    .pulse {
      display: inline-block;
      width: 16px;
      height: 16px;
      border-radius: 50%;
      background: #238636;
      box-shadow: 0 0 0 rgba(35, 134, 54, 0.4);
      animation: pulse 2s infinite;
      margin-bottom: 15px;
    }
    @keyframes pulse {
      0% { box-shadow: 0 0 0 0 rgba(35, 134, 54, 0.4); }
      70% { box-shadow: 0 0 0 10px rgba(35, 134, 54, 0); }
      100% { box-shadow: 0 0 0 0 rgba(35, 134, 54, 0); }
    }
    h1 { margin: 0 0 10px 0; font-size: 24px; color: #58a6ff; }
    p { margin: 5px 0; color: #8b949e; }
    .ping-time { font-weight: bold; color: #e6edf3; font-family: monospace; font-size: 1.1em; margin-top: 15px;}
    .easter-egg {
      margin-top: 30px;
      font-size: 12px;
      color: #161b22; /* Escondido inicialmente */
      transition: color 0.4s;
      cursor: default;
    }

    /*.status-card:hover .easter-egg {*/
    .status-card .easter-egg {
      color: #8b949e; /* Revelado no hover da div */
    }
    .heart { color: #ff7b72; }
  </style>
</head>
<body>
  <div class="status-card">
    <div class="pulse"></div>
    <h1>Liftech API Online</h1>
    <p>O servidor está ativo e operando normalmente.</p>
    <div class="ping-time">Último ping: ${displayLastPing}</div>
    
    <!-- Easter Egg do keep-alive -->
    <div class="easter-egg">
      Mantido acordado com <span class="heart">♥</span> por @rafaelhdsv! ☕
    </div>
  </div>
</body>
</html>
`;
