const http = require('http');
http.get('http://localhost:3000/api/v1/customers?limit=1000&is_active=true', (res) => {
  let d = '';
  res.on('data', c => d += c);
  res.on('end', () => console.log(d));
});
