# Proof of Existence on Ethereum Blockchain

Blockproof is a web-based time stamping application that uses Ethereum Decentralized Blockchain to store anonymous, tamper-proof time stamps for any digital content. Blockproof allows users to hash files, images, or plain text, and subsequently store the created hashes in the blockchain as well as retrieve and verify time stamps that have been committed to the blockchain. It enables anyone, e.g., students, researchers, authors, journalists, or artists, to prove that they were the originator of certain information at a given point in time.

## Prerequisites

Please install Ganache and Metamask on your local to simulate a local Blockchain environment.
Node version must be equal to or greater than 8.0.0.

## Getting Started

1. Download the repository and install all npm dependencies by running below command
   ```javascript
   npm install
   ```
2. Start Local Ethereum Blockchain Node using Ganache and make sure it is listening on below RPC Server

   ```javascript
   HTTP://127.0.0.1:8545
   ```

   **Navigate to root folder of the project and perform below steps:**

3. The Smart Contracts uses Oraclize to get timestamp instead of block timestamp. For this a local Ethereum Bridge is required.
   Please execute below command in command prompt

   ```javascript
   cd node_modules
   node ethereum-bridge -H localhost:8545 -a 1 --dev
   ```

   On succesful completion above command will give an output as below.

   ```javascript
   OAR = OraclizeAddrResolverI(0x6f485c8bf6fc43ea212e93bbf8ce046c7f1cb475);
   ```

   The value inside the brackets will be different for your local implementation. Please copy the entire statement and
   paste it to smart contract Blockproof.sol line#76 (existing piece of code is for reference)

4. Compile smart contracts by running below command.

   ```javascript
   truffle compile
   ```

5. Deploy smart contracts to Ganache by running below command.

   ```javascript
   truffle migrate
   ```

   In case the deployment gets stuck, try below command.

   ```javascript
   truffle migrate --reset
   ```

6. Test the smart contract by running below command.

   ```javascript
   truffle test
   ```

   **Please note that Oraclize services charge Ether for query execution which is taken from contract balance**
   **The contract is deployed with 10 Ether as coded in 2_deploy_contracts.js file. In case the balance is exhausted,**
   **the application may not work as expected. In that case either transfer Ether to the contract or deploy it again.**

7. Run servers for front-end and back-end by running below command
   ```javascript
   npm run dev
   ```
   On succesful run, application will be served on
   ```javascript
   http://localhost:8080
   ```

## How to use the dApp

Please refer below document which explains all the execution steps.

//https://docs.google.com/document/d/1s8Kh1xu-5xbqZYPjLTG__kHleZfYl5kJP3v0bGZ0EOQ/edit?usp=sharing

## Design Patterns Used in the dApp

Following patterns have been implemented in smart contract Blockproof.sol

**Lifetime**

A dedicated function named 'kill' has been provided which can be invoked only by contract owner. It can be used anytime
to destroy the contract.

**Ownership**

Modifiers have been used to restrict access/usage of below functions only to contract owner:

withdraw : To withdraw funds (if any) from the contract

kill : To destroy the contract

toggle_active : To enable or disable functions in case of circuit breaker situations

**Security**

Circuit Breaker pattern has been applied with help of toggle_active function which can be invoked only by contract owner.
Details of a proof can only be seen by the document owner and not by anyone else.

## Measures taken to mitigate attacks on the smart contract

1. Simple implementation at expense of some gas
2. Avoided Poison data by limiting the length of user supplied data
3. No Complex logic, no mathematical operations involved that may cause Integer Arithmetic Overflow.
4. Verified the compiler-generated ABI to ensure no unexpected functions appear.
5. No personal information is stored inside the contract. Only IPFS hash of the document, its time stamp
   and user address are stored.
6. Mitigated Denial of service attack by limiting the length of user supplied data such as document title,
   document hash, document remarks, document tags. So that user cannot supply big sized data that is very
   expensive to process and prevents users from interacting with the contract.
7. Ethereum miners have some limited ability to influence block timestamps which may impact the timestamping
   of the document. This Miner Vulnerability is mitigated by not using block timestamps but rather Oracle
   services using 'Oraclize' which runs independent of Blockchain Miners.

## Library/EthPM used

Smart contract Blockproof.sol uses oraclize-api package. Related source code is visible inside
installed_contracts/oraclize-api/contracts folder.

## Stretch Goals

**IPFS**

This dApp uses IPFS to store documents for which proof are generated. Each document can be accessed by clicking on the hash URL
on details page.

**Oracle**

Ethereum miners have some limited ability to influence block timestamps which may impact the functional usage of this dApp.
Instead it Oraclize services to get current time stamp which is independent of Blockchain Miners.

**Testnet Deployment**

Contract Blockproof.sol has been deployed to Rinkeby Network, details of which are inside deployed_address.txt file.

**Mobile Friendly Design**

The design of the dApp is very minimal and mobile friendly. It can be easliy viewed on web3 enabled mobile browsers.

**This dApp uses services of third party applications like Infura for IPFS, Oraclize as Oracle to get timestamp and mLab database**
**as an Off-Chain storage. Depending on the server availability the dApp may take time to process a request. In case it gets** **stuck, please try reloading the page. In case of any issues please reach out to me at tannmay@gmail.com**
