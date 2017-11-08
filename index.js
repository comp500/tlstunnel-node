/*eslint-disable no-console*/

const tls = require("tls");
const net = require("net");
var config = require("./config.json");

const options = {
	host: config.host,
	servername: config.servername,
	port: config.tlsPort,
	rejectUnauthorized: config.strictChecking || false
};

var socketIdCounter = 0;

const server = net.createServer((tcpSocket) => {
	// Refresh config
	config = require("./config.json");
	// Save socketId then increment counter
	var socketId = socketIdCounter++;

	console.log("[" + socketId + "]", "Connection received from " + tcpSocket.remoteAddress);

	var tlsSocket = tls.connect(options, () => {
		console.log("[" + socketId + "]", "Connected to TLS server at", tlsSocket.remoteAddress, tlsSocket.authorized ? "authorized" : "unauthorized");

		var cert = tlsSocket.getPeerCertificate();

		if (config.fingerprintList && config.fingerprintList.length > 0) {
			if (config.fingerprintList.indexOf(cert.fingerprint.toUpperCase()) == -1) {
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
		} else {
			if (tlsSocket.authorized) {
				console.log("[" + socketId + "]", "Certificate not in fingerprint list, forwarding anyway as list is empty");
				console.log("[" + socketId + "]", "Certificate details:", JSON.stringify(cert.subject));
				console.log("[" + socketId + "]", "Certificate fingerprint:", cert.fingerprint);
				console.log("[" + socketId + "]", "If you trust the above certificate, copy it to the fingerprint list in config.json to ensure future security");

				// Sync file descriptors, for some reason
				tlsSocket.fd = tcpSocket.fd;
				// Pipe TCP -> TLS
				tcpSocket.pipe(tlsSocket);
				// Pipe TLS -> TCP
				tlsSocket.pipe(tcpSocket);
			} else {
				console.log("[" + socketId + "]", "Authorization error:", tlsSocket.authorizationError);
				console.log("[" + socketId + "]", "Certificate details:", JSON.stringify(cert.subject));
				console.log("[" + socketId + "]", "Certificate fingerprint:", cert.fingerprint);
				console.log("[" + socketId + "]", "If you trust the above certificate, copy it to the fingerprint list in config.json");

				tlsSocket.end();
				tcpSocket.end();
			}
		}
	});

	tlsSocket.on("error", (err) => {
		console.log("Socket error, id", socketId);
		console.dir(err);
		// Clean up
		tcpSocket.end();
	});

	tcpSocket.on("error", (err) => {
		console.log("Socket error, id", socketId);
		console.dir(err);
		// Clean up
		tlsSocket.end();
	});
	
	tcpSocket.on("end", () => {
		console.log("[" + socketId + "]", "Socket disconnected");
	});
});

server.on("error", (err) => {
	console.dir(err);
});

server.listen(config.tcpPort, () => {
	console.log("TCP server started, awaiting connections");
});
