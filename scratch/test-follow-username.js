const axios = require('axios');

async function testFollowUsername() {
  const baseUrl = 'https://instagram-api.softclub.tj';
  
  const userA = {
    userName: 'usera_' + Math.random().toString(36).substring(2, 7),
    password: 'TestPassword123!',
    confirmPassword: 'TestPassword123!',
    email: 'usera_' + Math.random().toString(36).substring(2, 7) + '@example.com',
    phoneNumber: '+992900000005',
    firstName: 'User',
    lastName: 'A',
    fullName: 'User A'
  };

  try {
    // Register & Login A
    await axios.post(`${baseUrl}/Account/register`, userA);
    const loginARes = await axios.post(`${baseUrl}/Account/login`, {
      userName: userA.userName,
      password: userA.password
    });
    const tokenA = loginARes.data.data || loginARes.data.token || loginARes.data;

    // Call get-is-follow-user-profile-by-id using a username instead of a GUID
    console.log('\n--- Checking status with username string ---');
    try {
      const checkRes = await axios.get(
        `${baseUrl}/UserProfile/get-is-follow-user-profile-by-id`,
        {
          params: { followingUserId: 'non_existent_username' },
          headers: { Authorization: `Bearer ${tokenA}` }
        }
      );
      console.log('Follow Check Status:', checkRes.status);
      console.log('Follow Check Data:', JSON.stringify(checkRes.data, null, 2));
    } catch (e) {
      if (e.response) {
        console.log('Error status:', e.response.status);
        console.log('Error data:', JSON.stringify(e.response.data, null, 2));
      } else {
        console.error('Error:', e.message);
      }
    }

  } catch (error) {
    console.error('Outer Error:', error.message);
  }
}

testFollowUsername();
