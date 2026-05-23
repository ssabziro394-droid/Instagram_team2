const axios = require('axios');

async function test() {
  try {
    const response = await axios.get('https://instagram-api.softclub.tj/Post/get-posts');
    console.log('STATUS:', response.status);
    console.log('DATA:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    if (error.response) {
      console.log('ERROR STATUS:', error.response.status);
      console.log('ERROR DATA:', error.response.data);
    } else {
      console.error('ERROR:', error.message);
    }
  }
}

test();
