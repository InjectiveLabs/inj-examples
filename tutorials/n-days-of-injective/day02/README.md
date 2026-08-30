# Day 2: Smart Contracts

This is part of the N days of Injective series!

## Pre-requisites

- Completed day 1 (set up) in this series

## What is a smart contract?

So, what exactly is a smart contract?

At its core, a smart contract is simply a program that runs on a blockchain.
Unlike scripts that run on your local machine or a centralized server,
these live on a decentralised network.

For EVM (Ethereum Virtual Machine) compatible blockchains like Injective,
there are a few languages we could use:
Solidity, Yul, and Vyper.

In this series, we will focus on **Solidity**.
It is by far the most dominant language in the space,
with the largest ecosystem and tooling support.
This makes it the best place to start.

## What is a smart contract **not**?

Now, the name "Smart Contract" can be a bit misleading.
Let's clarify what it is *not*.

Firstly, it is not "Smart" in the sense of AI.
It doesn't have a brain; it doesn't "think."
It is just code that executes the instructions we give it.

Second, it is not a "Contract" in the legal sense.
You can't take it to a court of law in the same way you would with a contract written by lawyers.

The term was coined historically to describe the idea of a protocol
that facilitates, verifies, or enforces the execution of a computer program.
The analogy is a vending machine:
This autonomously executes actions according to predefined, immutable instructions.
If you put the money in and press the button,
the machine *must* give you the drink or snack.
No middleman required.

A smart contract is a computer program that is like that.
Because its code is immutable -
that is cannot be changed -
we can predict what it will do given any input and its current state.

They are computer programs with decentralised trust.
The blockchain enables that decentralised trust.

## Clone starter repo (demo)

Alright, enough theory. Let's get building.

Open up your terminal.
We're going to clone the starter repository.

Use git to clone the repo using one of these commands:

```shell
git clone git@github.com:injective-dev/n-days-of-injective.git
# OR
git clone https://github.com/injective-dev/n-days-of-injective.git

cd n-days-of-injective
```

We will be using this same repository for the rest of the "N Days of Injective" series,
so keep it safe!

Once cloned, `cd` into the `smart-contract` directory within `day02`.

```shell
cd day02/smart-contract
```

Also, we'll need to install the dependencies.

```shell
npm install
```

Let's take a quick tour of the project structure in `day02/smart-contract`. This is a standard Hardhat project.
- `contracts/`: This is where our Solidity smart contract lives.
- `artifacts/`: This is where the compiled build outputs will go.
- `test/`: This is where our test files are located.
- `script/`: This is where our deployment script is are located.

Before we begin, be sure to obtain the private key from an account that you created earlier,
and save that in the `.env` file.
Start by copying the example file.

```shell
cd src
cp .example.env .env
```

Next, edit the `.env` file.
Ensure that you replace `your private key without 0x prefix` with
(you guessed it!) your private key without the `0x` prefix.

```shell
PRIVATE_KEY=your private key without 0x prefix
INJ_TESTNET_RPC_URL=https://k8s.testnet.json-rpc.injective.network/
```

> You should already have a private key from day 1 for set up.
> If you do not, please review the steps in the
> "EVM wallet and connect to Injective Testnet" section.

This will allow you to use the account that you have previously created
and funded with Testnet INJ to pay for transactions.
More on that later!

## Overview of smart contract development steps

Before we run commands, let's visualize the workflow.
Smart contract development usually follows this cycle:

1. **Write Code**: We write our logic in Solidity.
2. **Compile**: We use `solc` (via Hardhat) to turn that code into machine-readable EVM bytecode.
3. **Test**: We run local tests using Mocha (via Hardhat) to ensure logic is correct.
4. **Secure**: In a real project, you would perform a security audit here.
   However, we'll skip this for the tutorial.
   Do not skip this step in production!
5. **Deploy**: We send a transaction to put our contract on the blockchain.
6. **Verify**: We publish our source code to the block explorer so others can trust it.
7. **Interact**: Finally, we use queries and transactions with the smart contract.

## Compile Solidity with solc (demo)

The code is already written for you, which is step 1.
See `contracts/Counter.sol`.

So let's start with step 2: Compiling.

Run the compile command in your terminal.

```shell
npx hardhat compile
```

Hardhat will invoke the Solidity compiler (`solc`).
Once it's done, check the `artifacts` folder.
You'll see two critical things:

1. **The ABI**:
   This Application Binary Interface is like a manual that
   tells other apps how to talk to your contract.
   It is human readable, in JSON.
2. **The EVM Bytecode**:
   This is the actual code that the Ethereum Virtual Machine understands and executes.
   It is not human readable.

## Run test cases (demo)

Now, let's test.

(Demo)
Our tests are in the `test/` folder. We're using a setup similar to Mocha, but supercharged by Hardhat for smart contracts.

Run the test command:

```shell
npx hardhat test
```

Oops! It looks like we have a failure.
This is actually great.
It shows our tests are working.
Let's read the error... it seems we expected one value but got another.

Let's go into the code and fix that logic error.
Within `contracts/Counter.sol`, we see that the correct implementation has been commented out.
The wrong implementation is what is running.

```solidity
        // value += num; // correct impl
        value += num + 1; // wrong impl
```

Let's swap that around, such that the correct implementation is what runs.

```solidity
        value += num; // correct impl
        // value += num + 1; // wrong impl
```

Now we re-compile the smart contract.

```shell
npx hardhat compile
```

Then run the test again.

```shell
npx hardhat test
```

Voila! All tests pass!

## Implementation-Specification correctness quadrants

This process touches on the "4 Quadrants of Specification and Implementation".

- Ideally, we want **Correct Spec, Correct Impl** (ideal).
- A failing test usually means **Correct Spec, Wrong Impl** (what we just had).
- Dangerous territory is **Wrong Spec, Correct Impl** (tests fail, even though the logic is OK).
- The most insiduous is, **Wrong Spec, Wrong Impl** (you are misled into thinking logic is OK, when it is not).

Note that this quadrant that I coined way back in 2019:

![](https://dappsdev.org/static/0a23beca3cfbdf6bca79fac1818b23ec/bb194/implementation-specification-quadrants.png)

Ref: https://dappsdev.org/blog/2019-05-02-dapps-dev-club-5th-session-roundup/

## Deploy EVM bytecode to blockchain (demo)

Tests passed. Let's ship it.

We'll run our deployment script now.

```shell
npx hardhat run script/deploy.js --network inj_testnet
```

Watch the terminal.
When you see a deployment transaction hash,
you have a deployed smart contract!

This also outputs the address.

Let's go to the [Injective Testnet Explorer](https://testnet.blockscout.injective.network).

```text
https://testnet.blockscout.injective.network
```

Paste the address of the smart contract that you just copied.

You can see our contract exists!
But look at the "Contract" tab.
It just shows raw bytecode.
It's a "black box".
We know that the smart contract exists,
but we can't easily read what it does yet.

## Verify details on network explorer (demo)

Let's open up that black box.
To do so, we will verify the smart contract on the explorer.

Run the verification command.
This sends our source code and compiler settings to the explorer.

```shell
SMART_CONTRACT_ADDRESS="(paste value from deploy command here)"
npx hardhat verify --network inj_testnet ${SMART_CONTRACT_ADDRESS}
```

> Replace `${SMART_CONTRACT_ADDRESS}` in the command above
> with the address that you copied earlier, from the deployment script.

It should say "Successfully verified contract".

Now, go back to the explorer and refresh the page.
Look at the "Contract" tab now.
We can see the full Solidity source code and the ABI!
This is crucial for trust:
Developers can now verify exactly what logic they are interacting with.

## What is deployment and verification?

Let's pause and distinguish between what we just did.

**Deployment** is an on-chain action.
We sent a transaction containing our bytecode.
The network executed it, which did two things:

1. Copied the bytecode into permanent blockchain storage at a specific address.
2. Ran the `constructor` function to set up the initial state.

**Verification** is an off-chain action.
No transaction was sent to the blockchain itself.
We just talked to the explorer's API.
We said, "Here is the source code and settings."
The explorer compiled it (indpendently) on its server,
compared the output to the bytecode on the blockchain.
Since they matched, it now shows as verified, and displays the source code and ABI.

Remember that deployment changes the state of the blockchain, and therefore uses a transaction.
Verification, on the other hand, does not need to change anything on the blockchain -
the only thing that changes in the explorer (which is fully off-chain).

## Query smart contract (demo)

Now that it's live, let's talk to it.

First, we'll **Query**.
This means **reading** blockchain state.

Enter the interactive console.

```shell
npx hardhat console --network inj_testnet
```

First, connect to the smart contract.
This instantiates an object named `counter`.

```javascript
const smartContractAddress = '(paste value from deploy command here)';
const Counter = await ethers.getContractFactory('Counter');
const counter = await Counter.attach(smartContractAddress.toLowerCase());
```

> Replace `${SMART_CONTRACT_ADDRESS}` in the command above
> with the address that you copied earlier, from the deployment script.

Run the query, by simply calling a function on the `counter` object.
We'll invoke the `value` function.

```javascript
await counter.value();
```

We get the current value back almost instantly.

```text
0n
```

> Note that the `n` suffix indicates that this is a large number.
> i.e. `BigInt` instead of `Number`.

Notice we did not have to sign a wallet transaction or pay gas?
That is because we are only **reading** existing state from the blockchain.

## Update smart contract (demo)

Now, let's **Update** the contract.

While you are still in the interactive console,
invoke a different function on the `counter` object.
This time it will be the `increment` function.

```javascript
const txResponse = await counter.increment(1, { gasPrice: 160e6, gasLimit: 2e6 });
txResponse.hash;
```

Notice we specified a gas details -
this is because there will be a transaction needed.
That is because we are **writing** new state to the blockchain.

Repeat the same query from earlier:

```javascript
await counter.value();
```

We will get the updated value back.

```text
1n
```
Go back to the explorer again, and you can see the updated state there too!

## Read vs write operations

To summarize the difference:

A blockchain is a state machine. It stores a current "state" (who owns what, what values are stored).

- **Queries** (Read):
  These just look at the current state.
  They don't change anything, so they are free and fast.
- **Transactions** (Write):
  These are instructions to transition the state from "before" to "after".
  They need to be signed by an account, pay fees in gas, and take time to confirm.

Understanding this distinction is key to understanding how the EVM works,
and how to develop smart contracts.

## Complete!

Congratulations on completing this.
Next up is day 3, where we will use the smart contract that we have developed here,
and build a dApp with it.

> Injective is a blockchain with a MultiVM architecture.
> In addition to EVM smart contracts,
> [CosmWasm smart contracts](https://docs.injective.network/developers-cosmwasm/smart-contracts)
> are also supported.
> However, these will not be covered in this course.
