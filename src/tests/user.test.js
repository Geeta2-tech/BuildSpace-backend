const request = require('supertest');
const app = require('../app'); // Import your Express app

let accessToken;
let refreshToken;

describe('User API', () => {
  // First, we need to login to get accessToken
  beforeAll(async () => {
    const loginResponse = await request(app).post('/api/auth/login').send({
      email: 'john@example.com',
      password: 'password123',
    });

    // Extract tokens from the 'set-cookie' header in the login response
    const cookies = loginResponse.headers['set-cookie'];
    accessToken = cookies
      .find((cookie) => cookie.startsWith('accessToken='))
      .split(';')[0]
      .split('=')[1];
    refreshToken = cookies
      .find((cookie) => cookie.startsWith('refreshToken='))
      .split(';')[0]
      .split('=')[1];
  });

  // Test GET /get-user-profile
  it('should return user profile when user is authenticated', async () => {
    const response = await request(app)
      .get('/api/profile/get-user-profile?')
      .set('Cookie', `accessToken=${accessToken}`); // Pass the token in cookies

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('id');
    expect(response.body).toHaveProperty('email');
    expect(response.body).toHaveProperty('name');
  });

  it('should return 404 if user not found', async () => {
    const response = await request(app)
      .get('/api/profile/get-user-profile?userId=nonexistent')
      .set('Cookie', `accessToken=${accessToken}`);

    expect(response.status).toBe(404);
    expect(response.body.message).toBe('User not found');
  });

  // Test PUT /update-username
  it('should update username successfully', async () => {
    const response = await request(app)
      .put('/api/profile/update-username')
      .set('Cookie', `accessToken=${accessToken}`)
      .send({ name: 'New Username' });

    expect(response.status).toBe(200);
    expect(response.body.message).toBe('Username updated');
    expect(response.body.data.name).toBe('New Username');
  });

  it('should return 400 if name is missing', async () => {
    const response = await request(app)
      .put('/api/profile/update-username')
      .set('Cookie', `accessToken=${accessToken}`)
      .send({}); // Send empty body

    expect(response.status).toBe(400);
    expect(response.body.message).toBe('Name is required');
  });

  it('should return 404 if user not found', async () => {
    const response = await request(app)
      .put('/api/profile/update-username')
      .set('Cookie', `accessToken=${accessToken}`)
      .send({ name: 'New Username' })
      .query({ userId: 'nonexistent' });

    expect(response.status).toBe(404);
    expect(response.body.message).toBe('User not found');
  });

  // Test POST /upload-avatar
  it('should upload avatar successfully', async () => {
    const response = await request(app)
      .post('/api/profile/upload-avatar')
      .set('Cookie', `accessToken=${accessToken}`)
      .attach('avatar', 'path_to_image/avatar.jpg'); // Attach an image file

    expect(response.status).toBe(200);
    expect(response.body.message).toBe('Profile picture updated');
    expect(response.body.data.avatar).toBeDefined(); // Avatar URL or path should be set
  });

  it('should return 400 if file is missing', async () => {
    const response = await request(app)
      .post('/api/profile/upload-avatar')
      .set('Cookie', `accessToken=${accessToken}`);

    expect(response.status).toBe(400);
    expect(response.body.message).toBe('No file uploaded');
  });

  it('should return 404 if user not found', async () => {
    const response = await request(app)
      .post('/api/profile/upload-avatar')
      .set('Cookie', `accessToken=${accessToken}`)
      .attach('avatar', 'path_to_image/avatar.jpg')
      .query({ userId: 'nonexistent' });

    expect(response.status).toBe(404);
    expect(response.body.message).toBe('User not found');
  });
});
