/*eslint-disable no-console*/

const tls = require("tls");
const net = require('net');

const options = {
  host: "",
  servername: "",
  port: 443
};

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

var socket = tls.connect(options, () => {
	console.log('client (tls) connected', socket.authorized ? 'authorized' : 'unauthorized');
	server.listen(3380, () => {
		console.log('server bound');
	});
});

socket.on('error', (err) => {
	console.dir(err);
});
//socket.setEncoding('utf8');

const server = net.createServer((c) => {
	console.log("Connection from " + c.remoteAddress);
	console.log("Connection to " + socket.remoteAddress);
	socket.fd = c.fd;
	c.pipe(socket);
	socket.pipe(c);
	// 'connection' listener
	
	c.on('end', () => {
		console.log('client disconnected');
		socket.end();
		socket = tls.connect(options, () => {
			console.log('client (tls) connected', socket.authorized ? 'authorized' : 'unauthorized');
			server.listen(3380, () => {
				console.log('server bound');
			});
		});
		
		socket.on('error', (err) => {
			console.dir(err);
		});
		//server.close();
	});
});
server.on('error', (err) => {
	console.dir(err);
});
