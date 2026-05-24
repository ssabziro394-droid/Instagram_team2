const https = require('https');

https.get('https://instagram-api.softclub.tj/swagger/v1/swagger.json', (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    try {
      const swagger = JSON.parse(data);
      console.log("Schemas in Swagger:");
      if (swagger.components && swagger.components.schemas) {
        Object.keys(swagger.components.schemas).forEach(name => {
          console.log(name);
        });
      } else {
        console.log("No components.schemas found");
      }
    } catch (e) {
      console.error("Error parsing JSON:", e.message);
    }
  });
}).on('error', (err) => {
  console.error("Error fetching:", err.message);
});
