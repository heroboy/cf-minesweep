import net from 'node:net';

const socket = net.createConnection(80, 'example.com');

socket.write('GET /a HTTP/1.1\r\nHost: example.com\r\n\r\n');
socket.write('GET /b HTTP/1.1\r\nHost: example.com\r\n\r\n');

socket.on('data', chunk =>
{
	console.log(chunk.toString());
});