import http from 'node:http';

function startSession() {
  return new Promise((resolve, reject) => {
    const req = http.request('http://localhost:3000/v1/sessions/start?camera=0', { method: 'GET' }, (res) => {
      res.setEncoding('utf8');
      res.on('data', (chunk) => {
        process.stdout.write(chunk);
      });
      res.on('end', resolve);
    });
    req.on('error', reject);
    req.end();
  });
}

await startSession();
