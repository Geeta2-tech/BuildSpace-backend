const request = require('supertest');
const app = require('../app'); // Import your Express app

describe('Auth API', () => {
  let accessToken;
  let refreshToken;

  // Test POST /api/auth/register
  it('should register a new user successfully and extract tokens from cookies', async () => {
    const response = await request(app).post('/api/auth/register').send({
      email: 'john@example.com',
      password: 'password123',
      name: 'John Doe',
    });

    expect(response.status).toBe(201);
    expect(response.body.user).toHaveProperty('id');
    expect(response.body.user).toHaveProperty('email', 'john@example.com');
    expect(response.body.user).toHaveProperty('name', 'John Doe');

    // Extract tokens from the 'set-cookie' header
    const cookies = response.headers['set-cookie'];

    // Extract accessToken and refreshToken from cookies
    accessToken = cookies
      .find((cookie) => cookie.startsWith('accessToken='))
      .split(';')[0]
      .split('=')[1];
    refreshToken = cookies
      .find((cookie) => cookie.startsWith('refreshToken='))
      .split(';')[0]
      .split('=')[1];

    // Ensure tokens are extracted correctly
    expect(accessToken).toBeDefined();
    expect(refreshToken).toBeDefined();
  });

  // Test POST /api/auth/login
  it('should log in successfully with correct credentials using cookies', async () => {
    const response = await request(app).post('/api/auth/login').send({
      email: 'john@example.com',
      password: 'password123',
    });

    expect(response.status).toBe(200);
    expect(response.body.user).toHaveProperty('email', 'john@example.com');

    // Store tokens from response cookies for subsequent requests
    const cookies = response.headers['set-cookie'];
    accessToken = cookies
      .find((cookie) => cookie.startsWith('accessToken='))
      .split(';')[0]
      .split('=')[1];
    refreshToken = cookies
      .find((cookie) => cookie.startsWith('refreshToken='))
      .split(';')[0]
      .split('=')[1];
  });

  // Test POST /api/auth/logout
  it('should log out successfully using cookies', async () => {
    const response = await request(app)
      .post('/api/auth/logout')
      .set(
        'Cookie',
        `accessToken=${accessToken}; refreshToken=${refreshToken}`
      ); // Send both tokens in cookies

    expect(response.status).toBe(200);
    expect(response.body.message).toBe('Logged out successfully');
  });

  // Test POST /api/auth/refresh-token
  it('should refresh the access token successfully using cookies', async () => {
    const response = await request(app)
      .post('/api/auth/refresh-token')
      .set('Cookie', `refreshToken=${refreshToken}`); // Send the refresh token in cookies

    expect(response.status).toBe(200);
    expect(response.body.message).toBe('Access token refreshed');
  });

  it('should return 401 if refresh token is invalid or expired', async () => {
    const response = await request(app)
      .post('/api/auth/refresh-token')
      .set('Cookie', 'refreshToken=invalidRefreshToken'); // Simulate invalid refresh token

    expect(response.status).toBe(401);
    expect(response.body.message).toBe('Invalid or expired refresh token');
  });

  // Test POST /api/auth/forgot-password
  it('should send a password reset link', async () => {
    const response = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: 'john@example.com' });

    expect(response.status).toBe(200);
    expect(response.body.message).toBe('Password reset link sent to email');
  });

  it('should return 400 if user not found', async () => {
    const response = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: 'nonexistent@example.com' });

    expect(response.status).toBe(400);
  });

  // Test POST /api/auth/send-verification
  it('should send email verification', async () => {
    const response = await request(app)
      .post('/api/auth/send-verification')
      .set('Cookie', `accessToken=${accessToken}`); // Send access token in cookies

    expect(response.status).toBe(200);
  });

  it('should return 401 if not authenticated', async () => {
    const response = await request(app).post('/api/auth/send-verification');

    expect(response.status).toBe(401);
  });

  it('should return 400 for invalid or expired token', async () => {
    const response = await request(app)
      .get('/api/auth/verify-email')
      .query({ token: 'invalidVerificationToken' });

    expect(response.status).toBe(400);
  });
});
