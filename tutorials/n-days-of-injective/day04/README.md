# Day 4: Precompiles + MultiVM token standard (MTS)

This is part of the N days of Injective series!

## Pre-requisites
 
- Completed day 2 (smart contracts) in this series
- Optional: Completed day 3 (dApps) in this series

## Starter repo (demo)

Welcome back to day 4 of the 7 days of Injective series!
We will be building a token that's both EVM and Cosmos compatible today!

If you are joining us from day 2, you're all set.
If not, please check the prerequisites.
Let's get started!
Open the terminal and navigate to the `day04` directory within this repo.
This will be our workspace for exploring the MultiVM Token Standard (MTS).

```shell
cd day04/smart-contract/
```

Also, we'll need to install the dependencies.

```shell
npm install
```

We will need to set up a `.env` file here too.
The easiest way to do so would be to copy the one that we already have from the day 2 repo.

```shell
cp ../../day02/smart-contract/.env ./.env
```

## Faucet again

Deploying a smart contract is a relatively expensive transaction,
due to the large amount of gas fees incurred,
at least compared to regular smart contract interaction gas fees.
However, deploying an MTS token requires a payment of 1INJ upon initial mint.

We previously used the Injective Testnet faucet provided by Injective itself.
This was completely free of the need to authenticate,
and thus needs a lot of protection against DDOS -
which unfortunately means the amount it dispenses is relatively low.
More than enough for most operations, but insufficient to deploy an MTS token.

Fortunately we have another faucet provided by Google,
that is far more generous, dispensing 10INJ at a time.
To use that, we need to be signed in - that's their DDOS protection.
From the Injective Faucet, copy our wallet's address -
the one that starts with `inj...` -
and paste it into [Google's Injective Testnet Faucet](https://cloud.google.com/application/web3/faucet/injective/testnet).

Press then button, and wait for the transaction to come through.
Check our wallet.
We should now have more than enough for an MTS deployment.

> Note that while this faucet is more generous,
> it is still rate limited, and you may see an error message like this:
>
> ```text
> Each Google Account and wallet address gets one drip on Testnet every 1 day. Try again after Feb 2, 2026, 3:17:18 PM.
> ```

## EVM precompiles

First, we need to understand what EVM Precompiles are on Injective.
These are *not* standard smart contracts.
They are native code embedded directly into the Injective nodes themselves.
We expose this native implementation to the EVM through specific addresses and ABIs.
When we interact with these addresses within our EVM smart contract,
we are *not* running EVM bytecode.
Instead, we are triggering native Injective logic.
Think of it like a Foreign Function Interface (FFI).
This allows our smart contracts written in Solidity to 'speak' directly to
the core blockchain modules within Injective,
which are written in Go, using the Cosmos SDK.

## MultiVM Token Standard (MTS)

This brings us to the MultiVM Token Standard (MTS).
Injective supports multiple environments: EVM, CosmWasm, and standard Cosmos modules.
We refer to each of these execution environments as a virtual machine.
Hence the name "MultiVM".

Usually, assets in different VMs are fragmented.
Thus they require bridges, wrapping, or
some other conversion or equivalence translation mechanism.
Injective takes a different approach.
With MTS, a fungible token is the *same* underlying asset across all VMs.
It is simultaneously an ERC20 token and a Cosmos Denom.
This means we can use both Metamask (an EVM wallet) and Keplr (a Cosmos wallet)
to manage the exact same asset without any conversion steps.

## Bank module + interface

How do we create an MTS token?
The magic happens via the Bank module Precompile.
It lives at this specific address ending in `64`: `0x0000000000000000000000000000000000000064`.
Its interface looks similar to ERC20, with transfer and balance functions.
But it also includes functions for native capabilities like minting, burning, and metadata management.
By invoking this EVM precompile, we are instructing the chain's native Bank module to operate on the underlying asset.
Any change in the underlying asset is reflected instantly in *both* the EVM ERC20 and the Cosmos Denom.

Open `contracts/Bank.sol` to see the `IBankModule` interface definition.

```solidity
interface IBankModule {
   function mint(address,uint256) external payable returns (bool);
   function balanceOf(address,address) external view returns (uint256);
   function burn(address,uint256) external payable returns (bool);
   function transfer(address,address,uint256) external payable returns (bool);
   function totalSupply(address) external view returns (uint256);
   function metadata(address) external view returns (string memory,string memory,uint8);
   function setMetadata(string memory,string memory,uint8) external payable returns (bool);
}
```

## Implement MTS using BankERC20 (demo)

Let's look at the code.
We'll use the canonical `BankERC20` implementation.
This base contract handles the connection to the Bank precompile.
At the same time it also extends OpenZeppelin's ERC20 implementation.
It initialises the interface at the precompile address.

Open `contracts/BankERC20.sol` to see the `BankERC20` smart contract implementation.

```solidity
   address constant bankContract = 0x0000000000000000000000000000000000000064;
   IBankModule bank = IBankModule(bankContract);
```

The constructor is used to set the MTS metadata.

```solidity
   constructor(
       string memory name_,
       string memory symbol_,
       uint8 decimals_
   ) payable ERC20("", "") {
       // parent ERC20 metadata is not used
       bank.setMetadata(name_, symbol_, decimals_);
   }
```

It overrides standard ERC20 methods to fetch data from the chain instead of contract storage.

```solidity
   function totalSupply() public view virtual override returns (uint256) {
       return bank.totalSupply(address(this));
   }
```

And it routes balance related updates, like transfer/ mint/ burn, through to the Bank module.

```solidity
   function _update(address from, address to, uint256 value) internal override {
       if (from == address(0)) {
           /* ... mint ... */
       } else if (to == address(0)) {
           /* ... burn ... */
       } else {
           // transfer
           bank.transfer(from, to, value);
       }
       /* ... */
   }
```

To make our own MTS token, we just extend this contract.
It's that simple.

Open `contracts/MyMtsToken.sol` to see the `MyMtsToken` smart contract implementation.

```solidity
contract MyMtsToken is BankERC20 {
   constructor(
       string memory name_,
       string memory symbol_,
       uint8 decimals_
   ) payable BankERC20(name_, symbol_, decimals_) {}
```

The `BankERC20` constructor gets invoked, which will set the metadata.

What is left for us to do within this smart contract is to mint the initial supply.
For example:

```solidity
        _mint(msg.sender, supply_);
```

## MTS transfer with EVM transaction (demo)

Time for a demo.
Let's going to compile our MTS token.

```shell
npx hardhat compile
```

Next, deploy the MTS token.
Edit the constructor arguments, which will be used in the deployment transaction, in this file:
`script/constructor-args-mymtstoken.js`.
We will need to set a name, symbol, and total supply for the MTS token.
For example:

```js
module.exports = [
    // name_ - full name of the MTS token
    'bguiz mts token',
    // symbol_ - short symbol of the MTS token
    'BGZ_MTS',
    // supply_ - 1 million units with 18 decimal places
    1_000_000n * 1_000_000_000_000_000_000n,
];
```

Then the deployment command, which will pick up the values that we have set in the file above.

```shell
npx hardhat run script/deploy.js --network inj_testnet
```

We should see output for the deployment similar to the following:

```text
Smart contract deployed: 0x2F503565a20B6F3B5109C81A76eea6bBcB442272 - MyMtsToken
    https://testnet.blockscout.injective.network/address/0x2F503565a20B6F3B5109C81A76eea6bBcB442272?tab=contract
    https://testnet.explorer.injective.network/asset/erc20:0x2F503565a20B6F3B5109C81A76eea6bBcB442272
Deployment script executed successfully.
```

Finally, verify the MTS token.

```shell
npx hardhat verify --force --constructor-args ./script/constructor-args-mymtstoken.js --network inj_testnet ${SMART_CONTRACT_ADDRESS}
```

We should see output for the verification similar to the following:

```text
Successfully submitted source code for contract
contracts/MyMtsToken.sol:MyMtsToken at 0xF19484802B9446af98fd2d37189e2EEC9B7F6c62
for verification on the block explorer. Waiting for verification result...

Successfully verified contract MyMtsToken on the block explorer.
https://testnet.blockscout.injective.network/address/0xF19484802B9446af98fd2d37189e2EEC9B7F6c62#code
```

Going back to the deployment, let's grab the address and add it to our Metamask wallet.

- Click on the "Tokens" tab
- Only 1 asset is currently listed (INJ)
- Click on the "triple dot" icon
- Select "Import tokens"
- Paste the smart contract deployed address into "Token contract address"
- Click "Next"
- You should see 2 assets listed (INJ and our MTS token)

We can see it behaves exactly like a standard EVM ERC20 token would, within Metamask.

Now, let's transfer some tokens to another wallet.
This transaction is signed by Metamask, and processed by the EVM.
But the actual transfer of units of the fungible token
occurs as a Bank module action within in the Injective node.
EVM in this case, provides the interface, but not the implementation.

## Check MTS balances - for EVM ERC20 (demo)

Finally, let's check the transfer transaction via the block explorer.
Let's query the `balanceOf` function for both wallets.
First `balanceOf` for our own wallet.
Next `balanceOf` for the other wallet of the recipient.
Observe that our balance has decreased, and the recipient's balance has increased.
We've successfully used an EVM ERC20 and Cosmos Denom simultaneously,
without actually bridging, wrapping etc.

## Check MTS balances - for Cosmos Denom (demo)

At this point, we have tested that MTS token that was deployed on EVM works in EVM.
However, MTS is supposed to be MultiVM remember?
Let's **prove** that it is by looking at the same token on InjScan,
which is a another block explorer for Injective,
that is also Cosmos-aware.

Visit [testnet.explorer.injective.network](https://testnet.explorer.injective.network/).

In the search bar, paste the EVM address of your MTS token,
e.g. `0x862e252845c3d868ce1d531507748ac5c377c10b`.

This will automatically be converted to the bech32 format address,
and redirect you to the page for the smart contract, e.g.:
`https://testnet.explorer.injective.network/account/inj1schz22z9c0vx3nsa2v2sway2chph0sgtml538n/`.

Then click on the "Transactions" tab, and you should see the first transaction,
the initial mint of the MTS token, e.g. `1,000,000 BGZ_MTS` in the "Amount" column.

## Complete!

Congratulations on completing this.
Next up is day 5,
where we'll learn about injectived and the Injective SDK.
