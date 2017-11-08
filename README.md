# tlstunnel-node
A TLS tunneling client (like stunnel) written in node.js

## Why?
Because my Surface RT doesn't support stunnel, and the other scripts that do this are very old (node 0.10).

## How?
- Set up a server, like [stunnel](https://www.stunnel.org/index.html)
- Install node
- Clone this repo or download tarball / zip
- Change config.json to connect to the server
- `node index.js`
- Add fingerprints to fingerprintList in config.json for better security

## Roadmap?
- Client certificates
- PSK?

## Requirements?
- Node with OpenSSL
- A brain
- That's about it