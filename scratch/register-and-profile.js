const axios = require('axios');

async function testApi() {
  const baseUrl = 'https://instagram-api.softclub.tj';
  const testUser = {
    userName: 'testuser_' + Math.random().toString(36).substring(2, 7),
    password: 'TestPassword123!',
    confirmPassword: 'TestPassword123!',
    email: 'test_' + Math.random().toString(36).substring(2, 7) + '@example.com',
    phoneNumber: '+992900000000',
    firstName: 'Test',
    lastName: 'User',
    fullName: 'Test User'
  };

  try {
    // 1. Register
    console.log('Registering test user...');
    const regRes = await axios.post(`${baseUrl}/Account/register`, testUser);
    console.log('Register status:', regRes.status);
    console.log('Register response:', JSON.stringify(regRes.data, null, 2));

    // 2. Login
    console.log('\nLogging in...');
    const loginRes = await axios.post(`${baseUrl}/Account/login`, {
      userName: testUser.userName,
      password: testUser.password
    });
    console.log('Login status:', loginRes.status);
    console.log('Login response:', JSON.stringify(loginRes.data, null, 2));

    const token = loginRes.data.data || loginRes.data.token || loginRes.data;
    if (!token) {
      console.log('Could not find token in login response!');
      return;
    }

    const headers = { Authorization: `Bearer ${token}` };

    // 3. Get profile
    console.log('\nFetching profile...');
    const profileRes = await axios.get(`${baseUrl}/UserProfile/get-my-profile`, { headers });
    console.log('Profile status:', profileRes.status);
    console.log('Profile response:', JSON.stringify(profileRes.data, null, 2));

    const profileId = profileRes.data.data.id || profileRes.data.data.userId || profileRes.data.data.userProfileId;
    console.log('\nExtracted Profile ID / User ID:', profileId);

    // 4. Get posts for this user
    console.log('\nFetching posts...');
    const postsRes = await axios.get(`${baseUrl}/Post/get-posts`, {
      params: { UserId: profileId },
      headers
    });
    console.log('Posts status:', postsRes.status);
    console.log('Posts response:', JSON.stringify(postsRes.data, null, 2));

  } catch (error) {
    if (error.response) {
      console.log('Error status:', error.response.status);
      console.log('Error data:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error('Error message:', error.message);
    }
  }
}

testApi();
