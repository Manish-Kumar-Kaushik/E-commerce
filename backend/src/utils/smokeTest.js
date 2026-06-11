import '../config/env.js';

const BASE_URL = process.env.SMOKE_TEST_BASE_URL || 'http://127.0.0.1:5001';
const LOGIN_EMAIL = process.env.SMOKE_TEST_EMAIL || 'admin@example.com';
const LOGIN_PASSWORD = process.env.SMOKE_TEST_PASSWORD || 'Admin@123';

const logStep = (label, data) => {
  console.log(`\n[${label}]`);
  console.log(JSON.stringify(data, null, 2));
};

const fetchJson = async (url, options = {}) => {
  const response = await fetch(url, options);
  const text = await response.text();
  let body;

  try {
    body = text ? JSON.parse(text) : null;
  } catch (error) {
    body = text;
  }

  return {
    status: response.status,
    ok: response.ok,
    body,
  };
};

const run = async () => {
  try {
    const root = await fetchJson(`${BASE_URL}/`);
    const health = await fetchJson(`${BASE_URL}/health`);
    const login = await fetchJson(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: LOGIN_EMAIL,
        password: LOGIN_PASSWORD,
      }),
    });

    logStep('ROOT', root);
    logStep('HEALTH', health);
    logStep('LOGIN', login);

    if (login.ok && login.body?.token) {
      const profile = await fetchJson(`${BASE_URL}/api/users/profile`, {
        headers: {
          Authorization: `Bearer ${login.body.token}`,
        },
      });

      logStep('PROFILE', profile);
    } else {
      console.log('\n[INFO]');
      console.log(
        'Login failed. If you have not created demo users yet, run `npm run seed` after connecting MongoDB.',
      );
    }
  } catch (error) {
    console.error('\n[SMOKE TEST FAILED]');
    console.error(error.message);
    process.exit(1);
  }
};

run();
