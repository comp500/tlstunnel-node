/*eslint-disable no-console*/

const tls = require("tls");
const net = require("net");

const options = {
	host: process.argv[2],
	servername: process.argv[2],
	port: 443,
	rejectUnauthorized: false
};

const server = net.createServer((tcpSocket) => {
	console.log("Connection received from " + tcpSocket.remoteAddress);

	var tlsSocket = tls.connect(options, () => {
		console.log("Connected to TLS server:", tlsSocket.authorized ? "authorized" : "unauthorized");

		// Sync file descriptors, for some reason
		tlsSocket.fd = tcpSocket.fd;
		// Pipe TCP -> TLS
		tcpSocket.pipe(tlsSocket);
		// Pipe TLS -> TCP
		tlsSocket.pipe(tcpSocket);
	});

	tlsSocket.on("error", (err) => {
		console.dir(err);
	});
	
	tcpSocket.on("end", () => {
		console.log("Client disconnected");
	});
});

server.on("error", (err) => {
	console.dir(err);
});

server.listen(3380, () => {
	console.log("TCP server started");
});
