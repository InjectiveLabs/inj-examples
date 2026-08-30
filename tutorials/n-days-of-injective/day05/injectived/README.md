# injectived

`injectived` is the command-line interface and node daemon for Injective.
It lets you interact with the Injective blockchain for tasks like deploying smart contracts,
querying data, staking, governance, and more.

You will learn how to:

- Install `injectived`
- Query using `injectived`
- Transact using `injectived`

---

## Table of Contents

- [Installation](#installation)
- [Query](#query)
- [Transact](#transact)

---

## Installation

Before installation, make sure your system meets the following requirements:

Platform compatibility guide
Check out this table to see which platform is supported to run injectived CLI:

| Platform	      | Pre-Built Binaries |	Docker	| From Source |
|-----------------|--------------------|----------|-------------|
| macOS (M1/ARM)	| ❌	                 | ✅	     | ✅          |
| macOS (Intel)	  | ❌	                 | ✅	     | ✅          |
| Windows (x86_64)| ❌	                 | ✅	     | ❌          |
| Windows (ARM)	  | ❌	                 | ✅	     | ❌          |
| Linux (x86_64)	| ✅	                 | ✅	     | ✅          |
| Linux (ARM)	    | ❌	                 | ✅       | ✅          |
​
### With pre-built binaries

```bash
wget https://github.com/InjectiveLabs/injective-chain-releases/releases/download/v1.17.1-1764720946/linux-amd64.zip
unzip linux-amd64.zip
sudo mv injectived peggo /usr/bin
sudo mv libwasmvm.x86_64.so /usr/lib
```

### With Docker

```bash
docker run -it --rm injectivelabs/injective-core:v1.17.1 injectived version
```

If this succeeds, create alias to simplify commands

```bash
alias injectived='docker run -it --rm -v ~/.injectived:/root/.injectived injectivelabs/injective-core:v1.17.1 injectived --home /root/.injectived'
```

> Note that this alias pertain to your *current shell session* only.
>
> To make it permanent or available from other shells,
> add it to your `.bashrc`, `.zshrc`, or equivalent files.

For other installation methods (pre-built binaries or building from source), see the [official documentation](https://docs.injective.network/guides/installation/).

## Check installation

Run following commands to check if the installation is complete:

```bash
injectived version
```

You should get the output similar to the following:

```text
Version v1.17.1 (99ae041)
Compiled at 20251202-2355 using Go go1.23.9 (amd64)
```

## Create a wallet

Use the following command to mount the `~/.injective` folder and create a key named `my_key`.

```bash
injectived keys add my_key
```

This step will help you create a new account named `my_key`,
and store the key file into your `~/.injective` folder since its mounted.

You will notice a BIP39 mnemonic phrase has been output.
It will be a series of English dictionary words.
Be sure to back up a copy of this as you will need it later.

You can check the key and address using following command:

```bash
injectived keys list

Enter keyring passphrase (attempt 1/3):
- address: inj1pd6u9j4m7dy56se0mt3fxa305v7pv7r58kr7hg
  name: 1key
  pubkey: '{"@type":"/injective.crypto.v1beta1.ethsecp256k1.PubKey","key":"AoNsHwuR6/eqZE7OV6171b2Q4GMpUxilsvDO5fbYW9l5"}'
  type: local
- address: inj15e3nfrzegpajr0ezvscfqncm45ujfqq0r2u893
  name: my_key
  pubkey: '{"@type":"/injective.crypto.v1beta1.ethsecp256k1.PubKey","key":"ArUvlB5ldWpGDxuIOUksxfL79lwfxHe6Go7jQKeRi+p/"}'
  type: local
```

## Query account balance

Replace `${inj-prefix-wallet-address}` with the address of your wallet, or any other wallet.

```bash
injectived query bank balances \
  ${inj-prefix-wallet-address} \
  --node "https://testnet.sentry.tm.injective.network:443"  \
  --chain-id injective-888
```

Example command and output:

```bash
injectived query bank balances \
  inj15e3nfrzegpajr0ezvscfqncm45ujfqq0r2u893 \
  --node "https://testnet.sentry.tm.injective.network:443" \
  --chain-id injective-888

balances:
- amount: "9994720000000000000"
  denom: inj
- amount: "10000000000"
  denom: peggy0x87aB3B4C8661e07D6372361211B96ed4Dc36B1B5
pagination:
  total: "2"
```

You can verify the balance by checking the address in the [Testnet Explorer](https://testnet.explorer.injective.network/). Simply search for your address (e.g., `inj15e3nfrzegpajr0ezvscfqncm45ujfqq0r2u893`) to view the balance and transaction history in the browser.

> **Note**  
> The `--node` and `--chain-id` flags are for Injective Testnet

## Transact

The next command sends INJ to another address.
Be sure to replace the values of `${from-address}`, `${to-address}`,  `${amount}` as apropriate.

```bash
injectived tx bank send \
  ${from-address} \
  ${to-address} \
  ${amount}inj \
  --node "https://testnet.sentry.tm.injective.network:443"  \
  --chain-id injective-888 \
  --gas 4000000 \
  --gas-prices 160000000inj \
  --gas-adjustment 1.5
```

> Note that `1INJ` is 1 INJ and `1inj` is 1*10^-18 INJ for the amount parameter in `injectived`.


> Please ensure there is enough balance to send transactions.
> If you have a freshly created account, expect this transaction to be rejected.
> Visit https://testnet.faucet.injective.network/ to obtain funds,
> then retry the balance query command in the previous section, or this transaction.

Example command and output:

```bash
injectived tx bank send \
  my_key \
  inj1pd6u9j4m7dy56se0mt3fxa305v7pv7r58kr7hg \
  1000inj \
  --node "https://testnet.sentry.tm.injective.network:443"  \
  --chain-id injective-888 \
  --gas 4000000 \
  --gas-prices 160000000inj \
  --gas-adjustment 1.5

Enter keyring passphrase (attempt 1/3):
auth_info:
  fee:
    amount:
    - amount: "640000000000000"
      denom: inj
    gas_limit: "4000000"
    granter: ""
    payer: ""
  signer_infos: []
  tip: null
body:
  extension_options: []
  memo: ""
  messages:
  - '@type': /cosmos.bank.v1beta1.MsgSend
    amount:
    - amount: "1000"
      denom: inj
    from_address: inj15e3nfrzegpajr0ezvscfqncm45ujfqq0r2u893
    to_address: inj1pd6u9j4m7dy56se0mt3fxa305v7pv7r58kr7hg
  non_critical_extension_options: []
  timeout_height: "0"
signatures: []
confirm transaction before signing and broadcasting [y/N]: y
code: 0
codespace: ""
data: ""
events: []
gas_used: "0"
gas_wanted: "0"
height: "0"
info: ""
logs: []
raw_log: ""
timestamp: ""
tx: null
txhash: 0C739C58BE50F8EE80C5369EA243FE67F330866B2E32FC7735B7E0A8C7910688
```


You can visit [testnet.explorer.injective.network](https://testnet.explorer.injective.network)
to and search for the addresses of transaction hashes.
