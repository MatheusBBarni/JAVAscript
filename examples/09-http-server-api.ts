import http from 'http';
import { readFileSync } from 'fs';

function handler(req: any, res: any): void {
  const fileContent: string = readFileSync('examples/test-data/users.json', 'utf-8');

  if (req.url === '/all') {
    res.writeHead(200, 'OK');
    res.end(fileContent);
  } else if (req.url.startsWith('/user')) {
    const id: string = req.query('id');
    // @ts-expect-error - this function only exists in the wrapper
    const users = JSON.parseArray(fileContent);
    const user = users.find('id', id);
    if (user) {
      res.writeHead(200, 'OK');
      res.end(JSON.stringify(user));
    } else {
      res.writeHead(404, 'Not Found');
      res.end('User not found');
    }
  } else {
    res.writeHead(404, 'Not Found');
    res.end('Not Found');
  }
}

const server = http.createServer(handler);

server.listen(3001, () => {
  console.log('Users API running on port 3001');
});
