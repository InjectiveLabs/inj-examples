import { createWalletClient, custom, publicActions } from 'viem';
import { injectiveTestnet } from 'viem/chains';

console.log(injectiveTestnet);

const stateSmartContract = await getJson('/api/smart-contract');
console.log(stateSmartContract);

const btnWallet = document.querySelector('#btnWallet');
const txtWallet = document.querySelector('#txtWallet');
let stateWallet = {
    client: undefined,
    address: undefined,
};
btnWallet.addEventListener('click', async (_event) => {
    const result = await connectEvmWallet();
    if (result.ok) {
        const { client, address } = result;
        stateWallet = { client, address };
        console.log(stateWallet);
        txtWallet.innerHTML = `Connected to wallet, with account address: ${address}`;
    } else {
        txtWallet.innerHTML = `Error: ${result.error}`;
    }
});

const btnRead = document.querySelector('#btnRead');
const txtRead = document.querySelector('#txtRead');
let stateRead = {
    n: 0,
};
btnRead.addEventListener('click', async (_event) => {
    const result = await stateWallet.client.readContract({
        address: stateSmartContract.address,
        abi: stateSmartContract.abi,
        functionName: 'value',
    });
    stateRead.n += 1;
    txtRead.innerHTML = `Result: ${result}`;
    console.log(`Read operations count: ${stateRead.n}.`);
});

const btnWrite = document.querySelector('#btnWrite');
const txtWrite = document.querySelector('#txtWrite');
let stateWrite = {
    n: 0,
};
btnWrite.addEventListener('click', async (_event) => {
    const hash = await stateWallet.client.writeContract({
        address: stateSmartContract.address,
        abi: stateSmartContract.abi,
        functionName: 'increment',
        args: [100n],
        account: stateWallet.address,
    });
    const blockExplorerUrl = `https://testnet.blockscout.injective.network/tx/${hash}`;
    const hashDisplay = `${hash.substring(0, 12)}...`;
    txtWrite.innerHTML =
        `<p><span>Transaction submitted:</span><a href="${blockExplorerUrl}">${hashDisplay}</a></p>`;
    stateWrite.n += 1;
    console.log(`Write operations count: ${stateWrite.n}.`);
});

async function getJson(url) {
    const fetchResponse = await fetch(url);
    if (!fetchResponse.ok) {
        throw new Error(`HTTP error! status: ${fetchResponse.status}`);
    }
    const data = await fetchResponse.json();
    return data;
}

async function connectEvmWallet() {
    if (typeof window?.ethereum === 'undefined') {
        return {
            ok: false,
            error: 'no injected web3 provider detected',
        };
    }

    let client;
    try {
        client = createWalletClient({
            chain: injectiveTestnet,
            transport: custom(window.ethereum),
        }).extend(publicActions);
    } catch (ex) {
        return {
            ok: false,
            error: 'unable to initialise wallet client',
        };
    }

    let address;
    try {
        [address] = await client.requestAddresses();
    } catch (ex) {
        return {
            ok: false,
            error: 'unable to obtain account details',
        };
    }

    let chainId;
    try {
        console.log(`switching network to chain ID: ${injectiveTestnet.id}`);
        await client.switchChain({
            id: injectiveTestnet.id,
        });
    } catch (error) {
        return {
            ok: false,
            error: 'unable to switch to target network',
        };
    }
    chainId = parseInt(await client.request({ method: 'eth_chainId' }), 16);
    console.log({ chainId });

    return {
        ok: true,
        address,
        client,
    };
}
