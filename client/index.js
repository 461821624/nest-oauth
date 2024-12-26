const express = require('express');
const axios = require('axios');
const app = express();

app.use(express.json());

const config = {
  clientId: 'test-client',
  clientSecret: 'test-secret',
  redirectUri: 'http://localhost:3001/callback',
  authorizationEndpoint: 'http://localhost:3000/oauth/authorize',
  tokenEndpoint: 'http://localhost:3000/oauth/token'
};

// 授权码模式
app.get('/', (req, res) => {
  const authUrl = `${config.authorizationEndpoint}?` +
    `response_type=code&` +
    `client_id=${config.clientId}&` +
    `redirect_uri=${config.redirectUri}&` +
    `scope=read&` +
    `state=${Math.random().toString(36).substring(7)}`;

  res.send(`
    <h1>OAuth 2.0 客户端测试</h1>
    <h2>授权码模式</h2>
    <a href="${authUrl}">点击这里开始授权码模式授权</a>
    <hr/>
    <h2>其他授权模式</h2>
    <ul>
      <li><a href="/implicit">简化模式</a></li>
      <li><a href="/password">密码模式</a></li>
      <li><a href="/client">客户端模式</a></li>
    </ul>
  `);
});

// 简化模式
app.get('/implicit', (req, res) => {
  const implicitUrl = `${config.authorizationEndpoint}?` +
    `response_type=token&` +
    `client_id=${config.clientId}&` +
    `redirect_uri=${config.redirectUri}&` +
    `scope=read&` +
    `state=${Math.random().toString(36).substring(7)}`;

  res.redirect(implicitUrl);
});

// 密码模式
app.get('/password', (req, res) => {
  res.send(`
    <h1>密码模式</h1>
    <form id="passwordForm" onsubmit="handleSubmit(event)">
      <div>
        <label>用户名：</label>
        <input type="text" name="username" required>
      </div>
      <div>
        <label>密码：</label>
        <input type="password" name="password" required>
      </div>
      <button type="submit">获取令牌</button>
    </form>
    <div id="result"></div>

    <script>
      async function handleSubmit(event) {
        event.preventDefault();
        const form = event.target;
        const formData = new FormData(form);
        
        try {
          const response = await fetch('/password/token', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              username: formData.get('username'),
              password: formData.get('password')
            })
          });
          
          const result = await response.text();
          document.getElementById('result').innerHTML = result;
        } catch (error) {
          document.getElementById('result').innerHTML = '获取令牌失败: ' + error.message;
        }
      }
    </script>
  `);
});

app.post('/password/token', express.json(), async (req, res) => {
  try {
    console.log('Password token request:', {
      username: req.body.username,
      grant_type: 'password',
      client_id: config.clientId
    });

    const response = await axios.post(config.tokenEndpoint, {
      grant_type: 'password',
      client_id: config.clientId,
      client_secret: config.clientSecret,
      username: req.body.username,
      password: req.body.password,
      scope: 'read'
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log('Token response:', response.data);

    res.send(`
      <h2>获取令牌成功</h2>
      <pre>${JSON.stringify(response.data, null, 2)}</pre>
    `);
  } catch (error) {
    console.error('Token Error:', error.response?.data || error);
    res.send(`
      <h2>获取令牌失败</h2>
      <pre>${JSON.stringify(error.response?.data || error.message, null, 2)}</pre>
    `);
  }
});

// 客户端模式
app.get('/client', async (req, res) => {
  try {
    const response = await axios.post(config.tokenEndpoint, {
      grant_type: 'client_credentials',
      client_id: config.clientId,
      client_secret: config.clientSecret
    });

    res.send(`
      <h1>客户端模式</h1>
      <h2>获取令牌成功</h2>
      <pre>${JSON.stringify(response.data, null, 2)}</pre>
    `);
  } catch (error) {
    res.send(`
      <h1>客户端模式</h1>
      <h2>获取令牌失败</h2>
      <pre>${JSON.stringify(error.response?.data || error.message, null, 2)}</pre>
    `);
  }
});

// 处理授权回调
app.get('/callback', async (req, res) => {
  const { code, state, error } = req.query;

  if (error) {
    return res.send(`授权失败: ${error}`);
  }

  // 对于简化模式，返回一个页面来处理 URL 片段
  if (!code) {
    return res.send(`
      <h1>处理授权结果</h1>
      <div id="result"></div>
      <script>
        const hash = window.location.hash.substring(1);
        const params = new URLSearchParams(hash);
        const access_token = params.get('access_token');
        if (access_token) {
          document.getElementById('result').innerHTML = \`
            <h2>简化模式授权成功！</h2>
            <p>访问令牌: \${access_token}</p>
          \`;
        } else {
          document.getElementById('result').innerHTML = '没有收到访问令牌';
        }
      </script>
    `);
  }

  try {
    // 使用授权码获取访问令牌（授权码模式）
    const tokenResponse = await axios.post(config.tokenEndpoint, {
      grant_type: 'authorization_code',
      client_id: config.clientId,
      client_secret: config.clientSecret,
      code,
      redirect_uri: config.redirectUri
    });

    const { access_token, refresh_token } = tokenResponse.data;

    res.send(`
      <h1>授权码模式授权成功！</h1>
      <p>访问令牌: ${access_token}</p>
      <p>刷新令牌: ${refresh_token}</p>
    `);
  } catch (error) {
    console.error('获取令牌失败:', error.response?.data || error.message);
    res.send(`获取访问令牌失败: ${error.message}`);
  }
});

app.listen(3001, () => {
  console.log('OAuth 2.0 客户端应用运行在 http://localhost:3001');
}); 