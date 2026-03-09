import http from 'http';

function handler(req: any, res: any): void {
  res.writeHead(200, 'OK');
  res.end('Hello from JAVAscript server!');
}

const server = http.createServer(handler);

server.listen(3000, () => {
  console.log('Server running on port 3000');
});
