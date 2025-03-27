# Otterscan

An open-source, fast, local, laptop-friendly Ethereum block explorer.

https://user-images.githubusercontent.com/28685/124196700-4fe71200-daa3-11eb-912c-b66494fe4b23.mov

## What?

This is an Ethereum block explorer designed to be run locally with an archive node companion, more specifically, with [Erigon](https://github.com/ledgerwatch/erigon).

This approach brings many advantages, as follows.

## Getting Started

To get started with this project, you need to have Node.js and npm installed. Then, follow these steps:

1. Clone the repository: 

```bash
git clone https://github.com/shardeum/ots-shardeum-explorer.git

cd ots-shardeum-explorer
```

2. Install dependencies:

```bash
npm install
```

3. Set the environment variable:

```bash
export VITE_RPC_URL=your_shardeum_rpc_url
```

4. Build the project:

```bash
npm run build
```

5. Run the project:

```bash
npm run dev
```

6. Open the project in your browser:

```bash
http://localhost:5173
```

## Deploying

There are two recommended ways to deploy Otterscan in production:

### 1. Using PM2

You can deploy using PM2:

1. Install PM2 globally:
```bash
npm install -g pm2
```

2. Set up your environment:
```bash
cp .env.example .env
# Edit .env and update the VITE_RPC_URL with your Shardeum RPC URL
```

> Be sure to open port 5173 in your firewall. 


3. Build and start the application:
```bash
npm run build
VITE_RPC_URL=your_shardeum_rpc_url pm2 start npm --name "otterscan" -- start
```

You may need to start as host 0.0.0.0 depending on your setup. Should that be the case, update the start script in packae.json to:

```json
"scripts": {
  "start": "vite --host 0.0.0.0",
  ...
}
```

With firewall configured, you should be able to access Otterscan at `http://YOUR_VM_EXTERNAL_IP:5173`.

### 2. Using Docker 

Another way to deploy Otterscan is using Docker and Docker Compose:

1. Clone the repository and navigate to it:
```bash
git clone https://github.com/shardeum/otterscan.git
cd otterscan
```

2. Set up your environment:
```bash
cp .env.example .env
# Edit .env and update the VITE_RPC_URL with your Shardeum node URL
# Optionally set PORT if you want to use a different port than 80
```

3. Start the service:
```bash
docker-compose up -d
```

The application will be available at `http://localhost:80` (or whichever port you configured in .env).

#### Managing Your Docker Deployment

- View logs:
```bash
docker-compose logs -f
```

- Stop the service:
```bash
docker-compose down
```

- Update to the latest version:
```bash
git pull
docker-compose up -d --build
```



## Privacy

You are querying your own node, so you are not sending your IP address or queries to an external third-party node.

## Fast

Since you are querying your local archive node, everything is fast, no network roundtrips are necessary.

## Actually, very fast

This software was designed to be a companion of Erigon, a blazingly fast archive node.

## Really, it is even faster

The standard web3 jsonrpc methods are quite verbose and generic requiring many calls to gather many pieces of information at client side.

We've implemented some custom methods at rpcdaemon level, less information is needed to be json-marshalled and transmitted over network.

## Alpha warning

This software is in alpha stage, and for sure lots of features, error handling, edge cases are missing.

Be sure to check it often or send patches 😀

## Why?

Current offerings are either closed source or lack many features the most famous Ethereum block explorer has, or simply have high requirements like having an archive node + additional indexers.

Otterscan requires only mainline Erigon executing node, patched Erigon RPC daemon and running Otterscan itself (a simple React app), which makes it a laptop-friendly block explorer.

## Why the name?

3 reasons:

- It is heavily based on Erigon, whose mascot is an otter (Erigon, the otter), think about an otter scanning your transactions inside blocks.
- It is an homage to the most famous and used ethereum block explorer.
- The author loves wordplays and bad puns.

## It looks familiar...

The UI was intentionally made very similar to the most popular Ethereum block explorer so users do not struggle trying to find where the information is.

However, you will see that we made many UI improvements.

## Supported networks

Otterscan runs on any network that has a client implementing the [Otterscan API](#otterscan-json-rpc-api-extensions).

### Erigon

The reference implementation is maintained by us and comes out-of-box in any Erigon installation.

So, it runs on any network supported by Erigon, which at the moment of writing are:

- Ethereum mainnet + all testnets
- Gnosis chain
- Polygon

### Optimism

[Test-in-Prod](https://www.testinprod.io/) made and maintain OP-Erigon, which is a fork of Erigon that can sync any Optimism Superchain (Optimism, BASE, Zora, etc.).

### Anvil

Anvil [implements the Otterscan API](https://book.getfoundry.sh/reference/anvil/#otterscan-methods), so you can point your Otterscan installation to an Anvil RPC endpoint and have an explorer for your local devnet.

## Public instances

Otterscan is meant to be run on your own environment ([see install instructions below](#install-instructions)).

However, we host some testnet instances as a showcase of our features:

- Sepolia testnet: https://sepolia.otterscan.io/
- Holesky testnet: https://holesky.otterscan.io/

Test-in-Prod, the makers of OP-Erigon, also host instances for Optimism:

- OP-Sepolia testnet: https://otterscan.sepolia.testinprod.io/
- OP-Mainnet: https://otterscan.mainnet.testinprod.io/

## Commercial offerings

Some node providers offer Otterscan API for their customers. Please check with them their business conditions as we are not affiliated to them:

- Llamanodes: https://llamanodes.com/
- Quicknode: https://www.quicknode.com/

## Install instructions

[Here](./docs/install.md).

> **NEW**: if you want to opt-in into testing Otterscan v2 ALPHA features, [follow these instructions](./docs/ots2.md).

## Contract verification

We make use of [Sourcify](https://sourcify.dev/) for displaying contract verification info. More info [here](docs/sourcify.md).

## Otterscan JSON-RPC API extensions

We implemented new JSON-RPC APIs to expose information not available in a standard ETH node. They can be useful for non-Otterscan users and their specification is available [here](./docs/custom-jsonrpc.md).

## Kudos (in no particular order)

We make use of many open-source software and integrate many public datasources, mainly:

To the [Geth](https://geth.ethereum.org/) team whose code Erigon is based on.

To the [Erigon](https://github.com/ledgerwatch/erigon) team that made it possible for regular humans to run an archive node in a retail laptop. Also, they have been very helpful explaining Erigon's internals which made the modifications Otterscan requires possible.

To the [Test-in-Prod](https://www.testinprod.io/) team that made OP-Erigon possible. Their effort made it possible to run Otterscan against any Optimism Superchain.

To the [mdbx](https://github.com/erthink/libmdbx) team which is the blazingly fast database that empowers Erigon.

To [Trust Wallet](https://github.com/trustwallet/assets) who sponsors and makes available their icons under a permissive license.

To the owners of the [4bytes repository](https://github.com/ethereum-lists/4bytes) that we import and use to translate the method selectors to human-friendly strings.

To [Sourcify](https://sourcify.dev/), a public decentralized source code and metadata verification service.

To [Ethers](https://github.com/ethers-io/ethers.js/) which is the client library we used to interact with the ETH node. It is high level enough to hide most jsonrpc particularities, but flexible enough to allow easy interaction with custom jsonrpc methods.

## Future

Erigon keeps evolving at a fast pace, with weekly releases, sometimes with (necessary) breaking changes.

This project intends to keep following their progress and maintaining compatibility as the availability of the author permits.

Erigon itself is alpha, so I consider this software is also in alpha state, however it is pretty usable.

Also there is room for many improvements that are not possible in the current centralized, closed source block explorer offerings and the author of this software would like to have.

## Licensing

This software itself is MIT licensed and redistributes MIT-compatible dependencies.

The Otterscan API is implemented inside Erigon and follow its own license (LPGL-3).
