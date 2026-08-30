# Day 1: Set up

This is part of the N days of Injective series!

## Pre-requisites

- Basic knowledge of: Javascript programming, and command line usage
- Software installed: Chrome browser, NodeJs

## What is JSON-RPC?

- JSON (JavaScript Object Notation) is a lightweight data interchange format. It's easy for humans to read and write, and easy for machines to parse and generate.
- RPC (Remote Procedure Call) is a protocol that allows a program (client) to cause a procedure to execute in another address space (server).
- In the context of blockchain:
  - The **Client** is your dApp, wallet (like MetaMask), or a script you write.
  - The **Server** is the blockchain node (in this case, an Injective node).
- This is the standard way to interact with EVM chains. When you want to read data (like a balance) or write data (send a transaction), you send a JSON-RPC request to the node.
- The request and response are both in JSON format, making debugging easier compared to binary protocols.

## Connect to Injective EVM Testnet over JSON-RPC (demo)

- **Step 1: Find the Docs.** Open your browser and navigate to the Injective Developer Docs. Go to the **EVM** section and look for **Network Information**.
  - URL: `https://docs.injective.network/developers-evm/network-information`
- **Step 2: Identify the Endpoint.** Point out the "JSON-RPC Endpoint" for the Testnet.
  - It should look like: `https://k8s.testnet.json-rpc.injective.network/`
- **Step 3: Explain curl.** Briefly mention that `curl` is a command-line tool used to transfer data to or from a server. We'll use it to manually send a request to the node.
- **Step 4: Construct the Request.** We will call the `eth_blockNumber` method, which returns the number of the most recent block.
  - Command:
    ```bash
    curl -X POST -H "Content-Type: application/json" --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' https://k8s.testnet.json-rpc.injective.network/
    ```
- **Step 5: Execute & Observe.** Run the command in your terminal.
  - Show the output. The result will be a hexadecimal number (e.g., `"result":"0x..."`).
- **Step 6: Verify Liveness.** Wait about 5 seconds and run the exact same command again.
  - Show that the hex value has increased. This proves the chain is active and producing new blocks.
- **Step 7: Mainnet Comparison.** Briefly mention that Mainnet works exactly the same way, just with a different URL (e.g., `https://k8s.mainnet.json-rpc.injective.network/`).

## BIP39 seed phrase → crypto key pair → account

- **The Hierarchy:**
  1.  **Entropy:** It all starts with random noise.
  2.  **Mnemonic (Seed Phrase):** That randomness is converted into 12 or 24 words from a specific list (BIP39). This is human-readable and easier to back up than a raw binary string.
  3.  **Seed:** The words are converted into a binary seed.
  4.  **Private Key:** Derived from the seed. This is the "master key" to your funds.
  5.  **Public Key:** Derived mathematically from the Private Key using Elliptic Curve Cryptography.
  6.  **Address:** The last 20 bytes of the hash of the Public Key (for EVM addresses).
- **One-Way Street:** Crucially, this process is unidirectional. You can go from Private Key -> Public Key -> Address, but you can **NEVER** go backwards. This is why you can share your address safely, but must protect your private key.
- **Signing & Verification:**
  - You use your **Private Key** to *sign* a transaction, proving you authorized it.
  - The network uses your **Public Key** to *verify* the signature is valid, without ever needing to see your private key.

## Create EVM wallet (demo)

- **Step 1: Generate Seed (Educational).**
  - Go to `https://iancoleman.io/bip39/`.
  - **Warning:** Explain that for real funds, you should never use an online generator. This is strictly for educational/testnet purposes.
  - Generate a 12-word mnemonic. Copy it.
  - Scroll down further, and in the dropdown from "Coin", select "ETH - Ethereum"
  - Scroll down much further, and you will see a heading "Derived Addresses", and a large table underneath it.
  - These are all the accounts that can be generated from your seed phrase.
  - From the 1st row, copy the **address**, **public key**, and **private key** values - these values taken together are going to be used as your account.
  - Save these values in a text file - you will need them later.
- **Step 2: Install Wallet.**
  - Ensure MetaMask is installed.
- **Step 3: Import Wallet.**
  - Open MetaMask. If it's a fresh install, choose "Import an existing wallet".
  - Paste the 12-word seed phrase you just generated.
  - Set a password and complete the setup.

> Note that this is an **extremely insecure** way of dealing with seed phrases and private keys.
> This method is **not recommended** for actual use with real wallets, real cryptocurrency, or real tokens.
> This is is **only** suitable for test wallets, test cryptocurrency, or test tokens.
> In other words, only use this method on Testnet (or similar); and use a more secure method on Mainnet.

## Connect EVM wallet to Injective Testnet

- **Step 1: Connect to Injective Testnet.**
  - Instead of typing network details manually, we'll use a shortcut.
  - Go to the Injective Testnet Explorer (Blockscout): `https://testnet.blockscout.injective.network/`
  - Scroll to the bottom of the page (or look for the "Add Injective EVM Testnet" button).
  - Click the button. MetaMask will pop up asking to approve the new network.
  - Click "Approve" and then "Switch Network".
- **Step 2: Verify.**
  - Open MetaMask again.
  - You should see "Injective EVM Testnet" selected at the top.

Now you are able to use an EVM wallet - MetaMask - on Injective Testnet!

## Claim Testnet INJ for transactions from a faucet (demo)

- **Step 1: The Faucet.**
  - Navigate to the Injective Testnet Faucet: `https://testnet.faucet.injective.network/`
- **Step 2: Connect Wallet.**
  - Click the "Connect Wallet" button and select MetaMask.
- **Step 3: The Address Duality.**
  - Once connected, point out the address display.
  - You will see an EVM address starting with `0x...` AND an Injective address starting with `inj...`.
  - **Explain:** This is Injective's Multi-VM architecture in action. These are not two different accounts; they are the *same* account represented in two different formats. They share the same private key.
- **Step 4: Request Funds.**
  - Click "Get INJ". Complete any captcha if prompted.
- **Step 5: Confirm Receipt.**
  - Wait for the success message.
  - Open MetaMask. You should now see a balance of INJ (e.g., 1 INJ).
  - Note: If you get a "transaction not found" error initially, just wait a moment and check the explorer or your wallet. It sometimes takes a few seconds to propagate.

## Perform a Transaction on Injective Testnet 

- **Step 1: Multiple Accounts.**
  - Remind the audience that their seed phrase can generate many accounts, not just one. This is a "Hierarchical Deterministic" (HD) wallet.
- **Step 2: Create Account 2.**
  - Open MetaMask. Click the circular account icon at the top right.
  - Click "Create Account" (or "Add Account"). Name it "Account 2".
- **Step 3: Copy Address.**
  - Copy the address of this new "Account 2".
- **Step 4: Send Transaction.**
  - Switch back to "Account 1" (which has the funds).
  - Click "Send".
  - Paste the address of "Account 2".
  - Enter a small amount (e.g., 0.1 INJ).
  - Click "Next" and then "Confirm".
- **Step 5: Verify on Explorer.**
  - Wait for the transaction to confirm (MetaMask will notify you).
  - Click the "View on Block Explorer" link in the notification, or copy the transaction hash and search for it on `https://testnet.blockscout.injective.network/`.
  - Show the transaction details: Status (Success), From (Account 1), To (Account 2), and the Value transferred.

## Complete!

Congratulations on completing this.
Next up is day 2, where we will start with smart contracts!
