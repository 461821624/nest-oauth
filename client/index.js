const express = require('express');
const axios = require('axios');
const session = require('express-session');
const app = express();

// 配置中间件
app.use(express.json());
app.use(session({
  secret: 'oauth2-client-secret',
  resave: true,
  saveUninitialized: true,
  cookie: {
    secure: false, // 开发环境使用 HTTP
    maxAge: 1000 * 60 * 15, // 15分钟
    httpOnly: true
  },
  name: 'oauth2.sid'
}));

// 添加调试中间件
app.use((req, res, next) => {
  console.log('Session ID:', req.sessionID);
  console.log('Session Data:', req.session);
  next();
});

const config = {
  clientId: 'testclient',
  clientSecret: 'testclientsecret',
  redirectUri: 'http://localhost:3030/callback',
  authorizationEndpoint: 'http://localhost:3000/oauth/authorize',
  tokenEndpoint: 'http://localhost:3000/oauth/token',
  resourceEndpoint: 'http://localhost:3000/api/user'
};

// 生成安全的随机state
function generateState() {
  return require('crypto').randomBytes(32).toString('hex');
}

// 授权码模式
app.get('/', (req, res) => {
  const state = generateState();
  
  // 确保 session 对象存在
  if (!req.session) {
    console.error('Session object not found');
    return res.status(500).send('Session initialization failed');
  }

  // 保存state到session中
  req.session.oauthState = state;
  
  // 立即保存session
  req.session.save((err) => {
    if (err) {
      console.error('Failed to save session:', err);
      return res.status(500).send('Failed to save session');
    }

    console.log('Session saved. ID:', req.sessionID);
    console.log('Generated state:', state);
    console.log('Session data:', req.session);
    
    const authUrl = `${config.authorizationEndpoint}?` +
      `response_type=code&` +
      `client_id=${config.clientId}&` +
      `redirect_uri=${config.redirectUri}&` +
      `scope=read write&` +
      `state=${state}`;

    res.send(`
      <h1>OAuth 2.0 客户端测试</h1>
      <h2>授权码模式</h2>
      <p>Session ID: ${req.sessionID}</p>
      <p>State: ${state}</p>
      <a href="${authUrl}">点击这里开始授权码模式授权</a>
      <hr/>
      <h2>其他授权模式</h2>
      <ul>
        <li><a href="/password">密码模式</a></li>
      </ul>
    `);
  });
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

    const params = new URLSearchParams();
    params.append('grant_type', 'password');
    params.append('client_id', config.clientId);
    params.append('client_secret', config.clientSecret);
    params.append('username', req.body.username);
    params.append('password', req.body.password);
    params.append('scope', 'read write');

    const response = await axios.post(config.tokenEndpoint, params, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    console.log('Token response:', response.data);

    res.send(`
      <h2>获取令牌成功</h2>
      <pre>${JSON.stringify(response.data, null, 2)}</pre>
      <h3>测试访问受保护资源</h3>
      <button onclick="testResource('${response.data.access_token}')">测试访问</button>
      <div id="resourceResult"></div>
      <script>
        async function testResource(token) {
          try {
            const response = await fetch('${config.resourceEndpoint}', {
              headers: {
                'Authorization': 'Bearer ' + token
              }
            });
            const data = await response.json();
            document.getElementById('resourceResult').innerHTML = 
              '<pre>' + JSON.stringify(data, null, 2) + '</pre>';
          } catch (error) {
            document.getElementById('resourceResult').innerHTML = 
              '访问资源失败: ' + error.message;
          }
        }
      </script>
    `);
  } catch (error) {
    console.error('Token Error:', error.response?.data || error);
    res.send(`
      <h2>获取令牌失败</h2>
      <pre>${JSON.stringify(error.response?.data || error.message, null, 2)}</pre>
    `);
  }
});

// 处理授权回调
app.get('/callback', async (req, res) => {
  const { code, state, error } = req.query;
  const savedState = req.session.oauthState;
  
  console.log('Callback received state:', state);
  console.log('Session saved state:', savedState);

  if (error) {
    return res.send(`
      <h2>授权失败</h2>
      <p>错误: ${error}</p>
      <a href="/">返回首页重试</a>
    `);
  }

  if (!savedState) {
    return res.send(`
      <h2>Session 已过期</h2>
      <p>没有找到保存的 state，可能是 session 已过期</p>
      <a href="/">返回首页重新开始授权流程</a>
    `);
  }

  if (state !== savedState) {
    return res.send(`
      <h2>State 验证失败</h2>
      <p>收到的 state: ${state}</p>
      <p>保存的 state: ${savedState}</p>
      <p>state 不匹配，可能存在 CSRF 攻击风险</p>
      <a href="/">返回首页重试</a>
    `);
  }

  try {
    // 使用授权码获取访问令牌
    const params = new URLSearchParams();
    params.append('grant_type', 'authorization_code');
    params.append('client_id', config.clientId);
    params.append('client_secret', config.clientSecret);
    params.append('code', code);
    params.append('redirect_uri', config.redirectUri);

    console.log('Token request params:', params.toString());

    const tokenResponse = await axios.post(config.tokenEndpoint, params, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    // 清除已使用的state
    req.session.oauthState = null;

    const { access_token, refresh_token } = tokenResponse.data;

    res.send(`
      <h1>授权码模式授权成功！</h1>
      <h2>令牌信息</h2>
      <pre>${JSON.stringify(tokenResponse.data, null, 2)}</pre>
      <h2>测试访问受保护资源</h2>
      <button onclick="testResource('${access_token}')">测试访问</button>
      <div id="resourceResult"></div>
      <script>
        async function testResource(token) {
          try {
            const response = await fetch('${config.resourceEndpoint}', {
              headers: {
                'Authorization': 'Bearer ' + token
              }
            });
            const data = await response.json();
            document.getElementById('resourceResult').innerHTML = 
              '<pre>' + JSON.stringify(data, null, 2) + '</pre>';
          } catch (error) {
            document.getElementById('resourceResult').innerHTML = 
              '访问资源失败: ' + error.message;
          }
        }
      </script>
    `);
  } catch (error) {
    console.error('获取令牌失败:', error.response?.data || error.message);
    res.send(`
      <h2>获取访问令牌失败</h2>
      <pre>${JSON.stringify(error.response?.data || error.message, null, 2)}</pre>
      <a href="/">返回首页重试</a>
    `);
  }
});

app.listen(3030, () => {
  console.log('OAuth 2.0 客户端应用运行在 http://localhost:3030');
}); 