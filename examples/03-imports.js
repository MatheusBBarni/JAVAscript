import http from 'http';
import { writeFile } from 'fs';

function main() {
    http.get('http://www.google.com', (res) => {
        let data = '';
        res.on('data', (chunk) => {
            data += chunk;
        });
        res.on('end', () => {
            writeFile('google.html', data, (err) => {
                if (err) throw err;
                console.log('Google page saved to google.html');
            });
        });
    });
}

main();
