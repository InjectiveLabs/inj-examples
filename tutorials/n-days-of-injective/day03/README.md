# Day 3: Decentralised Applications (dApps)

This is part of the N days of Injective series!

## Pre-requisites
 
- Completed day 2 (smart contracts) in this series

## Clone starter repo (demo)

Welcome back to day 3!
If you followed along with Day 2, you should already have the repository cloned.
If not, pause here and complete day 2 before resuming.

Today, you simply need to `cd` into the `day03` directory.
Open up your terminal and let's navigate there.

```shell
cd day03/
```

This directory contains the starter code for the frontend dApp we will be building today.

## Web3 client libraries

To talk to the blockchain from a web browser,
we use web3 client libraries.
You might have heard of Ethers.js, which has been the standard for a long time.

Today, however, we're using `viem`.
It's a newer, more lightweight library that's gaining a lot of traction
among developers due to its performance and more intuitive DX.

These libraries are essential because they handle the complex JSON-RPC communication for us.
They act as a bridge between our JavaScript logic and the EVM wallet.

## Configure blockchain info (demo)

First things first, we need to tell our application *which* blockchain to talk to.
We're building on the Injective Testnet.

First, let's enter the directory for the front end project.

```shell
cd front/
```

In the code, we'll import the specific configuration for this chain.
This ensures that when we send requests, they go to the correct Injective nodes,
and not to some other EVM network.

This configuration includes things like the Chain ID and the RPC URL.

Copy the ABI file generated during the compilation of the smart contract from day 2 (smart contracts) into the `public` dir of within this project.

```shell
cp ../../day02/smart-contract/artifacts/contracts/Counter.sol/Counter.json ./public/counter.abi.json
```

Make a new `.env` file by copying the sample one.

```shell
cp .example.env .env
```

Edit the `.env` file, which will start off looking like this:

```text
PORT=3690
RPC_URL=https://k8s.testnet.json-rpc.injective.network/
SC_ABI=counter.abi.json
SC_ADDRESS=

```

Note that `SC_ABI` references the file that we just copied.

Copy-paste the smart contract deployed address from day 2 (smart contracts) as the `SC_ADDRESS` value.

> You should already have the smart contract's deployed address and ABI
> from day 2 for smart contracts.
> If you do not, please review the steps in the
> "Compile Solidity with solc" section, and the
> "Deploy EVM bytecode to blockchain" section.

Now the project is configured, and almost ready to run.
The last step before you can run the project is to install the dependencies:

```shell
npm install
```

Next, we'll run this command

```shell
npm start
```

You will see output that includes the following:

```text
Server running at http://localhost:3690
```

Visit this address in the browser and view our dApp.

## Inject web3 provider (demo)

Now, how do we access the user's wallet?
When you install a browser extension wallet such as MetaMask,
it *injects* a global object.
It is accessible as `window.ethereum` within the browser's Javascript environment.

We're going to take that object and pass it into `viem`'s `createWalletClient`.
This creates a `client` instance that acts as our main interface.
Through this client, we can ask the user to sign transactions and read data from the chain.
It is the handshake between our website and the user's funds.

See the implementation of `connectEvmWallet()` in `front/public/index.js`.
The relevant code using viem is:

```js
client = createWalletClient({
    chain: injectiveTestnet,
    transport: custom(window.ethereum),
}).extend(publicActions);
```

Now in the dApp, press the "Wallet" button.
If this is your first time interacting with this dApp,
MetaMask will ask you for permission to connect.

If you decline the connection request, or have not set up MetaMask properly,
you will see an error, something along the lines of:

```text
Error: unable to obtain account details
```

This is a security feature, where EVM wallets
block any interaction requests made by dApps,
unless the user first gives the go ahead.

If the wallet is set up properly

```text
Connected to wallet, with account address: 0xcaCd797be17138a9986B3FE3a5BD0598cA1b980c
```

## Connect to smart contract

We have a `client` object, which broadly allows your dApp to communicate with Injective Testnet.
Next we need to talk to our specific `Counter` smart contract that we deployed in day 2.

We'll use two main methods provided by viem:
`readContract` and `writeContract`.

- `readContract` is for fetching data, like checking the current count.
- `writeContract` is for changing data, like incrementing the count.

Remember, read operations are free and instant.
Write operations change the blockchain state, costs gas.
Therefore write operations require a signed transaction,
whereas read operations do not.

## Provider, ABI, and deployed address

Let's look at what we need to pass to these functions.
You'll see `address` and `abi` everywhere.

The `address` is simple:
it is the hexadecimal location where our contract lives on-chain.
The `ABI`, or Application Binary Interface, is crucial.
It's like a translation dictionary.
It tells our dApp exactly how to format the data so the EVM understands it.
So that viem can translates function names and parameters
into the binary representation used by the EVM.
Conversely, it tells our dApp how to decode the binary response from the EVM
back into readable JavaScript types.

In our example, in `front/server.js`, we see that `GET` requests made to `/api/smart-contract`
return both the address and the ABI of the smart contract that were prepared earlier.

## Query user interface (demo)

Let's hook this up to the user interface.
We'll start with reading the counter value.

We'll add an event listener to our 'Refresh' button.
When clicked, it invokes `readContract`.

Since this is just a query, it's fast.
We get the number back and immediately display it in this text field.
Notice that no wallet popup appears.
Reading public data doesn't require user permission.

See the implementation in `front/public/index.js`.
The relevant code using viem is:

```js
const result = await stateWallet.client.readContract({
    address: stateSmartContract.address,
    abi: stateSmartContract.abi,
    functionName: 'value',
});
```

In the dApp, press the "Read" button.
After about a second, you should see text similar to this appear:

```text
Result: 300
```

This is a number that was retrieved from the smart contract query.
Next we will update the state of the smart contract using a transaction.

## Update user interface (demo)

Now for the 'Increment' button.
This is a write operation.

When the user clicks this, we invoke `writeContract`.

This time, the wallet *will* pop up asking for approval
because we are changing the blockchain state.

Once the user signs, we get a transaction hash. 

We'll display this hash as a link to the Injective Explorer
so the user can verify their transaction went through.

See the implementation in `front/public/index.js`.
The relevant code using viem is:

```js
const hash = await stateWallet.client.writeContract({
    address: stateSmartContract.address,
    abi: stateSmartContract.abi,
    functionName: 'increment',
    args: [100n],
    account: stateWallet.address,
});
```

The above invokes `Counter.increment(100)`.

In the dApp, press the "Write" button.

MetaMask will prompt us with a "Transaction request",
and ask you to select "Cancel" or "Confirm".

In the top, find the "triple slider" icon, and click that to toggle on details.
In the "Data" pane that appears, it should show the following:

- Function: increment
- Param #1: 100

That cooresponds to what we're expecting.
Press the "Confirm" button.

In MetaMask, you should see a transaction appear with a status of "Pending".
This will change to "Confirmed" in a moment.

You should also see text similar to this appear in the dApp:

```text
Transaction submitted: 0x0219a2fa12...
```

That `0x...` is the transaction hash.
Open the link of the transaction hash in a new browser tab
to view the transaction details in the block explorer.

Back in the dApp, press the "Read" button a second time.
After about a second, you should see text similar to this appear:

```text
Result: 400
```

This is the new number that was retrieved from the smart contract query.
Because of the transaction we just did, it has a new value.

## Read and write operations

To wrap up, let's solidify the difference between these two operations.

Read operations are like looking at a public bulletin board—anyone can do it,
it's free, and you don't need permission or a signature.

Write operations are different from read operations,
because you are updating the blockchain state.
You need to sign the transaction using a wallet to prove it is authorised by you.
You also pay a small fee (known as gas) to the network.
The gas fee is needed to compensate for the space and processing power
used to update the blockchain state.

## Complete!

Congratulations on completing this.
Next up is day 4, where we will go into more advanced topics.
We'll learn about precompiles, and about Injective's MultiVM token standard.
