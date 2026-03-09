import http from 'http';
import { writeFile } from 'fs';

function main(): void {
  http.get('http://www.google.com', (res) => {
    let data: string = '';
    res.on('data', (chunk: Buffer | string) => {
      data += chunk;
    });
    res.on('end', () => {
      writeFile('google.html', data, (err: NodeJS.ErrnoException | null) => {
        if (err) throw err;
        console.log('Google page saved to google.html');
      });
    });
  });
}

main();
