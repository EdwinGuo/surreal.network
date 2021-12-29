<h1 align="center">
Surreal Apes
</h1>
<p align="center">
  <img src="./readme/logo.png">
</p>

## Official Links

---

[surreal.network](https://surreal.network/)

### Social

- [Discord](https://discord.gg/mk5sRSngsf)
- [Twitter](https://twitter.com/surrealapes)

### Contracts

- [Surreal.sol ERC721 Verified Smart Contract](https://etherscan.io/address/0xbc4aee331e970f6e7a5e91f7b911bdbfdf928a98)
- [SurrealMintPassFactory.sol ERC1155 Verified Smart Contract](https://etherscan.io/address/0x18d0e051317e04ae96314c372bd35220460eec62)

### Collections

- [SURREAL APES on Opensea](https://opensea.io/collection/surrealapes)
- [Surreal Mint-Pass on Opensea](https://opensea.io/collection/surreal-mint-pass)

**Make sure you are always interacting with the contracts you expect**
![Contract Interaction Example](./readme/contract_interaction.png)

## How it works

---

### Minting a Mint Pass

Minter interacts with `0x18d0e051317e04ae96314c372bd35220460eec62`

1. Our `SurrealMintPassFactory` allows us to create new, independently priced and limited, ERC1155 Mint-Pass tokens. Each token comes with its own generative art for our holders.
2. When visiting our web3 site during a mint period, users will be able to mint a limited amount of mint passes per wallet, based on some requirement (ownership or otherwise. See [SignedMinting.sol](#signedmintingsol))

### Redeeming a Surreal Ape

Minter interacts with `0xbc4aee331e970f6e7a5e91f7b911bdbfdf928a98`

1. Holders of our `SurrealMintPass` can log into our site and select which Mint-pass they would like to burn. During redemption, holders also choose which NFT they'd like to create a SURREAL APE derivative from.
2. The Mint Pass contract is configured to allow the Surreal ERC721 contract to burn Mint Pass tokens. This is the **only** address allowed to burn Mint Passes.
3. A claim transaction is created (gas is required). The claim transaction burns the holders Mint Pass and drops an unrevealed SURREAL APE erc721 into their wallet.
4. Our GANs system is invoked. The best image is hand-selected and set as metadata for the ERC721.

## Core Components

---

`Surreal.sol`

```solidity
contract Surreal is
    AccessControlEnumerable,
    ERC721URIStorage,
    ERC721Enumerable,
    PaymentSplitter,
    Pausable,
    ReentrancyGuard,
    SignedMinting
```

`SurrealMintPassFactory.sol`

```solidity
contract SurrealMintPassFactory is
  ERC1155,
  ERC1155Supply,
  AccessControlEnumerable,
  PaymentSplitter,
  SignedMinting,
  ReentrancyGuard
{
  struct MintPass {
    uint256 mintPrice;
    uint256 passMintLimit;
    uint256 walletMintLimit;
    uint256 totalMinted;
    string tokenURI;
    bool requiresSignature;
    bool saleActive;
    uint256 numberMinted;
    mapping(address => uint256) mintsPerAddress;
  }
}

```

`SignedMinting.sol`

```solidity
contract SignedMinting {
  address public signer;

  constructor(address _signer);

  function _setMintingSigner(address _signer) internal;

  function validateSignature(bytes memory signature)
    internal
    view
    returns (bool);

  function recoveredAddress(bytes memory signature);

  function asciiSender() public view returns (string memory);
}

```

## Basic Mechanisms

---

### AccessControlEnumerable.sol

---

An @openzeppelin contract

#### `DEFAULT_ADMIN_ROLE`

Can perform any `authorized` action. Similar to an `owner()` in `Ownable`, but with the added ability to grant roles to other contracts and EOAs.

#### `INTEGRATION_ROLE`

Integration contracts used to automate authorized processes such as minting, revealing, etc. Authorized to use internal mint functions on `Surreal` and `SurrealMintPassFactory` to allow flexibility toward future functionality / contracts.

### SignedMinting.sol

---

ECDSA based signature verification contract. Used to create arbitrary minting restrictions. A more generalized **whitelist** mechanism.

#### High Level Overview

1. The `Surreal` or `SurrealMintPassFactory` contract is set to require signature.
2. A known `signer` address is set on the contract state. That signer's private keys are managed by a backend implementation (usually serverless).
3. Prior to creating a `publicMint` or `claim` transaction, the frontend asks the backend to sign the minter's address using the `signer` keys.
4. The backend applies any restrictions or requirements prior to signing ("must own BAYC/MAYC", "Is on a whitelist"). These can be modified arbitrarily per token requirement.
5. The signature is passed back to the frontend and included in the `publicMint` or `claim` transaction call made by the user on the frontend.
6. `SignedMinting` receives the `signature` and attempts to recover the signers address. `signature` payload is expected to be the eth address of `msg.sender`.
7. If `SignedMinting` recovers our `signer`'s address, it is assumed to be signed by us and authorized for mint.

Thus any backend controller by surreal.network has the ability to first confirm that a wallet can maint a Mint-pass or redeem a Surreal.

Since the `SignedMinting.sol` contract expects the signed message payload to contain the address of `msg.sender` (ie, the minter making the tx), users cannot get around this by providing a different address to our API. Further, our backend signer can be naive and not require a signed message from the minter prior to minting. See `test/index.ts`:

```typescript
it("Cannot mint using someone else's address as signature", async () => {...});
```

**Important**  
When creating new restrictions/requiremets for signing, update the signature on contract using `_setMintingSigner`. If not updated: old signatures (prior restrictions) will still be valid.

## FAQ

---

Q. How do I know my assets are safe?  
A. The best way is to always make sure you are interacting with the contract you expect. In each "How it works" section above, the expected contract interaction address is listed at the top. **Always which address metamask is interacting with prior to signing a transaction**

![Contract Interaction](./readme/contract_interaction.png)

## To do

---

- [ ] Add serverless backend for known-signer verification
- [ ] Connect mint pass contract to frontend for minting
- [ ] Add redemption+burn to frontend
- [ ] Create token-gated dashboard access for managing mint-passes and revealing SURREAL tokens
- [ ] Discord notifications for redemptions and reveals
