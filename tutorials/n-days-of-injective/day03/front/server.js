import url from 'node:url';
import path from 'node:path';
import fs from 'node:fs/promises';
import express from 'express';
import dotenv from 'dotenv';

// Configuration and initialisation
const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envPath = path.resolve(__dirname, './.env');
dotenv.config({ path: envPath });
const PORT = parseInt(process.env.PORT, 10) || 3000;
const RPC_URL = process.env.RPC_URL || 'https://k8s.testnet.json-rpc.injective.network/';
const SC_ADDRESS = process.env.SC_ADDRESS || '';
const SC_ABI = process.env.SC_ABI || '';
if (!SC_ADDRESS) {
    throw new Error('No smart contract address specified');
}
if (!SC_ABI) {
    throw new Error('No smart contract ABI file specified');
}
const abiFilePath = path.resolve(__dirname, 'public', SC_ABI);
let abi;
try {
    const abiJson = await fs.readFile(abiFilePath);
    abi = JSON.parse(abiJson).abi;
} catch (ex) {
    throw new Error(`Unable to parse ABI file: ${abiFilePath}`);
}

const staticPath = path.join(__dirname, 'public');
const staticPath404Page = path.join(staticPath, '404.html');

const config = {
    PORT,
    RPC_URL,
    SC_ADDRESS,
    SC_ABI,
};
console.log(config);

/* run the server */
const server = express();

server.all('/api/', (req, res) => {
    res.status(301).redirect('/');
});

server.get('/api/smart-contract', (_req, res) => {
    res.status(200).json({
        rpc: RPC_URL,
        address: SC_ADDRESS,
        abi,
    });
});

server.use(express.static(staticPath));

server.use((_req, res) => {
    res.status(404).sendFile(staticPath404Page);
});

server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});

export {
    server,
    config,
}
