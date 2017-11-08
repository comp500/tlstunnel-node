/*eslint-disable no-console*/

const tls = require("tls");
const net = require("net");

const fingerprintList = [ "38:8C:40:F2:B9:75:E1:E6:DA:57:37:57:C8:21:92:EF:B5:0D:73:93" ];

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

		var cert = tlsSocket.getPeerCertificate();

		if (fingerprintList.indexOf(cert.fingerprint.toUpperCase()) == -1) {
			if (tlsSocket.authorized) {
				console.log("[" + socketId + "]", "Certificate not in fingerprint list");
			} else {
				console.log("[" + socketId + "]", "Authorization error:", tlsSocket.authorizationError);
			}

			console.log("[" + socketId + "]", "Certificate details:", JSON.stringify(cert.subject));
			console.log("[" + socketId + "]", "Certificate fingerprint:", cert.fingerprint);
			console.log("[" + socketId + "]", "If you trust the above certificate, copy it to the fingerprint list in config.json");

			tlsSocket.end();
			tcpSocket.end();
		} else {
			console.log("[" + socketId + "]", "Fingerprint verified:", cert.fingerprint);

			// Sync file descriptors, for some reason
			tlsSocket.fd = tcpSocket.fd;
			// Pipe TCP -> TLS
			tcpSocket.pipe(tlsSocket);
			// Pipe TLS -> TCP
			tlsSocket.pipe(tcpSocket);
		}
	});

	tlsSocket.on("error", (err) => {
		console.log("Socket error, id", socketId);
		console.dir(err);
		tcpSocket.end();
	});

	tcpSocket.on("error", (err) => {
		console.log("Socket error, id", socketId);
		console.dir(err);
		tlsSocket.end();
	});
	
	tcpSocket.on("end", () => {
		console.log("[" + socketId + "]", "Socket disconnected");
	});
});

server.on("error", (err) => {
	console.dir(err);
});

server.listen(3380, () => {
	console.log("TCP server started, awaiting connections");
});
