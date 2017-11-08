/*eslint-disable no-console*/

const tls = require("tls");
const net = require("net");

const options = {
	host: process.argv[2],
	servername: process.argv[2],
	port: 443,
	rejectUnauthorized: false
};

var socketIdCounter = 0;

const server = net.createServer((tcpSocket) => {
	var socketId = socketIdCounter++;

	console.log("[" + socketId + "]", "Connection received from " + tcpSocket.remoteAddress);

	var tlsSocket = tls.connect(options, () => {
		console.log("[" + socketId + "]", "Connected to TLS server:", tlsSocket.authorized ? "authorized" : "unauthorized");

		if (!tlsSocket.authorized) {
			console.log("[" + socketId + "]", "Authorization error:", tlsSocket.authorizationError);
			console.log("[" + socketId + "]", "Certificate details:", JSON.stringify(tlsSocket.getPeerCertificate().subject));
		}

		// Sync file descriptors, for some reason
		tlsSocket.fd = tcpSocket.fd;
		// Pipe TCP -> TLS
		tcpSocket.pipe(tlsSocket);
		// Pipe TLS -> TCP
		tlsSocket.pipe(tcpSocket);
	});

	tlsSocket.on("error", (err) => {
		console.log("Socket error, id", socketId);
		console.dir(err);
	});
	
	tcpSocket.on("end", () => {
		console.log("[" + socketId + "]", "Client / Server disconnected");
	});
});

server.on("error", (err) => {
	console.dir(err);
});

server.listen(3380, () => {
	console.log("TCP server started, awaiting connections");
});
