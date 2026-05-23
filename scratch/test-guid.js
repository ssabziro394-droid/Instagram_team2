const axios = require('axios');

async function test() {
  const baseUrl = 'https://instagram-api.softclub.tj';
  // Let's use Ismoil's user ID if we can find it, or we can use the test user we registered.
  // The test user has:
  // userId (GUID): 'c6a28fa5-5e04-4537-8898-1002ca16a246'
  // profileId (int): 161
  
  const token = 'YOUR_TOKEN_HERE'; // We can test with a generic token if needed, but since it's anonymous/authorized:
  // Wait, let's login first to get a token.
  
  try {
    const loginRes = await axios.post(`${baseUrl}/Account/login`, {
      userName: 'testuser_j753d', // Let's register a new one to be fresh
      password: 'TestPassword123!'
    }).catch(async () => {
      // Register first if login fails
      const testUser = {
        userName: 'testuser_guid_test',
        password: 'TestPassword123!',
        confirmPassword: 'TestPassword123!',
        email: 'test_guid_test@example.com',
        phoneNumber: '+992900000001',
        firstName: 'Test',
        lastName: 'User',
        fullName: 'Test User'
      };
      await axios.post(`${baseUrl}/Account/register`, testUser);
      return axios.post(`${baseUrl}/Account/login`, {
        userName: testUser.userName,
        password: testUser.password
      });
    });
    
    const authToken = loginRes.data.data;
    const headers = { Authorization: `Bearer ${authToken}` };
    
    // Fetch profile to get real IDs
    const profileRes = await axios.get(`${baseUrl}/UserProfile/get-my-profile`, { headers });
    const profileIdInt = profileRes.data.data.id;
    const userIdGuid = profileRes.data.data.userId;
    
    console.log('Profile ID (int):', profileIdInt);
    console.log('User ID (GUID):', userIdGuid);
    
    // Query with integer ID
    const resInt = await axios.get(`${baseUrl}/Post/get-posts`, {
      params: { UserId: profileIdInt },
      headers
    });
    console.log('Query with Profile ID (int) - items length:', resInt.data.data ? resInt.data.data.items?.length : 'no data');
    
    // Query with GUID ID
    const resGuid = await axios.get(`${baseUrl}/Post/get-posts`, {
      params: { UserId: userIdGuid },
      headers
    });
    console.log('Query with User ID (GUID) - items length:', resGuid.data.data ? resGuid.data.data.items?.length : 'no data');
    
  } catch (err) {
    console.error('Error:', err.message, err.response ? err.response.data : '');
  }
}

test();
