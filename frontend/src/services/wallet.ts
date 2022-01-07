import {
  Web3Provider,
  Network,
  JsonRpcProvider
} from '@ethersproject/providers';
import { BigNumber } from '@ethersproject/bignumber';
import * as ethers from 'ethers';
import { Surreal, SurrealMintPassFactory } from '../contracts/typechain';
import SurrealMintPassFactoryABI from '../contracts/artifacts/SurrealMintPassFactory.json';
import SurrealABI from '../contracts/artifacts/Surreal.json';
import MAYC from '../contracts/apes/MAYC.json';
import BAYC from '../contracts/apes/BAYC.json';
import axios, { AxiosError } from 'axios';

declare let window: any;
let provider: Web3Provider;
let alchemyProvider = new JsonRpcProvider(
  'https://eth-mainnet.alchemyapi.io/v2/YoBi2T8SqjgNZVmbqF8ddfq9zmEaIaLx'
);
const SURREAL_MINTPASS_ADDRESS = '0x18d0e051317e04ae96314c372bd35220460eec62';
const SURREAL_MINTPASS_ADDRESS_RINKEBY =
  '0x6F5FfE767EB8C637aA498f249f32178CDAb6cD77';

const SURREAL_ADDRESS = '0xBC4AEE331E970f6E7A5e91f7B911BdBFdF928A98';
const SURREAL_ADDRESS_RINKEBY = '0xa1B6413BbD6Fc5533d024F0A6Ae92e5bd2a20e20';

export interface ContractInfo {
  totalMinted: number;
  paused: boolean;
  mintPrice: number;
  mintPriceString: string;
  maxMintPerWallet: number;
  maxTokens: number;
  requiresSignature: boolean;
  claimsEnabled: boolean;
}

export interface UserInfo {
  numberMinted1: number;
  numberMinted2: number;
  signature?: string;
  isAdmin: boolean;
  signedAddress?: string;
  selectedCollection: Collection;
  ownedCollectionTokens: Array<CollectionToken>;
  userOwnedEditions: Array<UserOwnedEdition>;
}

export enum MintStatus {
  NONE,
  TX_PENDING,
  COMPLETE,
  ERROR
}

export interface NetworkConfig {
  chainId: number;
  name: string;
}
export interface ConnectionResponse {
  network: NetworkConfig;
  address: string;
}

interface SignatureResponse {
  signature: string;
}

export interface ErrorResponse {
  message: string;
}

type ContractInfoFunction = () => Promise<ContractInfo>;
const getContractInfo: ContractInfoFunction = async () => {
  // Hard coded until I can create low-level getters because I forgot to add them to the mintPassContract
  // 🤦🏻‍♂️🤦🏻‍♂️🤦🏻‍♂️🤦🏻‍♂️🤦🏻‍♂️🤦🏻‍♂️🤦🏻‍♂️
  const mintPassContract = getMintPassContract(alchemyProvider);
  const totalMinted = (await mintPassContract.totalSupply(2)).toNumber();
  const paused = false;
  const mintPrice: BigNumber = BigNumber.from('40000000000000000');
  let mintPriceString = ethers.utils.formatEther(mintPrice);

  const surrealContract = getSurrealContract(alchemyProvider);
  const claimsEnabled = (await surrealContract.paused()) == false;

  const contractInfo: ContractInfo = {
    totalMinted,
    paused,
    mintPrice: parseFloat(mintPriceString),
    mintPriceString,
    maxMintPerWallet: 4,
    maxTokens: 100,
    requiresSignature: true,
    claimsEnabled
  };
  return contractInfo;
};

const connect = async () => {
  const ethereum = window.ethereum;
  if (ethereum !== undefined) {
    const accounts: Array<string> = await ethereum.request({
      method: 'eth_requestAccounts'
    });
    if (accounts.length > 0) {
      provider = new Web3Provider(ethereum);
      await validateNetwork();
      const network = await provider.detectNetwork();
      const address = await provider.getSigner().getAddress();

      const response: ConnectionResponse = {
        network: { chainId: network.chainId, name: network.name },
        address
      };
      return response;
    } else {
      throw Error('No accounts found.');
    }
  } else {
    throw Error(
      'No web3 support detected. Please install a wallet in a supported browser.'
    );
  }
};

const checkConnection = async () => {
  const ethereum = window.ethereum;
  if (ethereum !== undefined) {
    const accounts: Array<string> = await ethereum.request({
      method: 'eth_accounts'
    });
    if (accounts.length > 0) {
      return true;
    }
  } else {
    throw Error(
      'No web3 support detected. Please install a wallet in a supported browser.'
    );
  }
};

const validateNetwork = async () => {
  const network = await provider.detectNetwork();
  if (network.chainId !== 1 && network.chainId !== 4) {
    throw Error(
      'Your wallet is currently connected to ' +
        (network.name === 'unknown' ? 'an ' : 'the ') +
        network.name +
        ' network. Please connect to Ethereum Mainnet and refresh the page.'
    );
  }
};

const getUserInfo = async (address: string, contractInfo: ContractInfo) => {
  try {
    let signature: string | undefined;
    try {
      signature = (
        (
          await axios.post('https://api.harmonize.gg/surreal/mintpass/sign', {
            address
          })
        ).data as SignatureResponse
      ).signature;
    } catch {}

    const mintPassContract = getMintPassContract();
    const numberMinted1 = (
      await mintPassContract.balanceOf(address, 1)
    ).toNumber();
    const numberMinted2 = (
      await mintPassContract.balanceOf(address, 2)
    ).toNumber();
    const isAdmin = await checkAdminStatus(address);
    const selectedCollection = collections[0];
    const ownedCollectionTokens = await getOwnedFromCollection(
      selectedCollection
    );
    const userOwnedEditions = await getUserOwnedEditions(address);
    const userInfo: UserInfo = {
      numberMinted1, // Does not scale but works for now
      numberMinted2,
      signature,
      isAdmin,
      selectedCollection,
      ownedCollectionTokens,
      userOwnedEditions
    };

    return userInfo;
  } catch (error) {
    console.error(error);
    if (axios.isAxiosError(error)) {
      const errorMessage = (error as AxiosError).toJSON() as ErrorResponse;
      throw Error(errorMessage.message);
    } else {
      throw error;
    }
  }
};

export interface Claim {
  collectionToken: string;
  collection: string;
  claimTx: string;
  address: string;
  dateClaimed: string;
  dateRevealed?: string;
  tokenId?: string;
  metadataUri?: string;
}
const getClaimsList = async (authSignature: BasicSignature) => {
  const claims = (
    await axios.get('https://api.harmonize.gg/surreal/claims', {
      auth: {
        username: authSignature.address,
        password: authSignature.signature
      },
      headers: {
        accept: 'application/json',
        'Content-Type': `application/json`
      }
    })
  ).data as Array<Claim>;
  return claims.sort((a, b) => {
    if (a.tokenId && b.tokenId) {
      return a.tokenId.localeCompare(b.tokenId);
    }
    return 0;
  });
};

const mint = async (
  address: string,
  amount: number,
  { mintPrice, maxMintPerWallet }: ContractInfo,
  signature?: string
) => {
  if (amount > maxMintPerWallet) {
    throw Error(
      'You can only mint a maximum of ' + maxMintPerWallet + 'NFTs per wallet.'
    );
  }
  const mintPassContract = getMintPassContract();
  await validateNetwork();
  const totalEther = mintPrice * amount;
  let tx: ethers.ContractTransaction = await mintPassContract.publicMint(
    address,
    amount,
    signature ?? '0x00',
    {
      value: ethers.utils.parseEther(`${totalEther}`)
    }
  );
  return tx.hash;
};

const claim = async (mintPassTokenId: string, signature: string) => {
  const contract = getSurrealContract();

  const claimTx = await contract.claim(signature, mintPassTokenId);

  return claimTx.hash;
};

const chooseCollection = async (
  authSignature: BasicSignature,
  collection: string,
  collectionToken: string,
  claimTx: string
) => {
  await axios.post(
    'https://api.harmonize.gg/surreal/claims',
    {
      claimTx,
      collection,
      collectionToken
    },
    {
      auth: {
        username: authSignature.address,
        password: authSignature.signature
      },
      headers: {
        accept: 'application/json',
        'Content-Type': `application/json`
      }
    }
  );
};

const listen = async (hash: string) => {
  let tx = await provider.getTransaction(hash);
  const receipt = await provider.waitForTransaction(tx.hash);
  if (receipt.status === 1) {
    return MintStatus.COMPLETE;
  } else {
    throw MintStatus.ERROR;
  }
};

export interface SurrealMetadata {
  uri: string;
}

const reveal = async (metadata: SurrealMetadata, tokenId: string) => {
  try {
    const mintPassContract = getSurrealContract();
    console.log('got mintPassContract');
    const revealTx = await mintPassContract.reveal(
      parseInt(tokenId),
      metadata.uri
    );
    return revealTx.hash;
  } catch (error) {
    console.error(error);
    throw Error('Could not set metadata');
  }
};

const getMintPassContract = (
  web3Provider: JsonRpcProvider | undefined = undefined
) => {
  let contractAddress = SURREAL_MINTPASS_ADDRESS;
  if (provider !== undefined && provider.network.name === 'rinkeby') {
    contractAddress = SURREAL_MINTPASS_ADDRESS_RINKEBY;
  }
  const mintPassContract = new ethers.Contract(
    contractAddress,
    SurrealMintPassFactoryABI,
    provider ? provider.getSigner() : web3Provider
  ) as SurrealMintPassFactory;
  return mintPassContract;
};

const getSurrealContract = (
  web3Provider: JsonRpcProvider | undefined = undefined
) => {
  let contractAddress = SURREAL_ADDRESS;
  if (provider !== undefined && provider.network.name === 'rinkeby') {
    contractAddress = SURREAL_ADDRESS_RINKEBY;
  }
  const mintPassContract = new ethers.Contract(
    contractAddress,
    SurrealABI,
    provider ? provider.getSigner() : web3Provider
  ) as Surreal;
  return mintPassContract;
};

export interface BasicSignature {
  address: string;
  signature: string;
}

const checkAdminStatus = async (address: string) => {
  try {
    await axios.post('https://api.harmonize.gg/surreal/user/auth/check', {
      address
    });
    return true;
  } catch {
    return false;
  }
};

const requestAuthHeaders = async (): Promise<BasicSignature> => {
  const signer = provider.getSigner();
  if (signer === undefined) {
    throw Error('Invalid provider. Must have signer');
  }
  const address = await signer.getAddress();
  const signature = await signer.signMessage(address);
  return { signature, address };
};

export interface Collection {
  name: string;
  address: string;
}

export const collections = [
  {
    address: '0x60e4d786628fea6478f785a6d7e704777c86a7c6',
    name: 'MAYC'
  },
  {
    address: '0xbc4ca0eda7647a8ab7c2061c2e118a18a936f13d',
    name: 'BAYC'
  }
];
export interface CollectionToken {
  tokenId: string;
}
const getContractOfCollection = (collection: Collection) => {
  let contract: ethers.Contract;
  let abi: ethers.ContractInterface | undefined;
  switch (collection.name) {
    case 'BAYC':
      abi = BAYC;
      break;
    case 'MAYC':
      abi = MAYC;
      break;
  }
  if (abi === undefined) {
    throw Error('Invalid contract');
  }
  contract = new ethers.Contract(collection.address, abi, provider.getSigner());
  return contract;
};

const defaultTokenResponse: Array<CollectionToken> = [];

const getOwnedFromCollection = async (collection: Collection) => {
  try {
    const contract = getContractOfCollection(collection);
    const signer = provider.getSigner();

    const address = await signer.getAddress();
    let tokens: Array<CollectionToken> = [];
    const balance: BigNumber = await contract.balanceOf(address);
    for (let index = 0; index < balance.toNumber(); index++) {
      const apeTokenId: BigNumber = await contract.tokenOfOwnerByIndex(
        address,
        index
      );
      tokens.push({ tokenId: apeTokenId.toString() });
    }
    if (tokens.length === 0) {
      return defaultTokenResponse;
    }
    return tokens;
  } catch (error) {
    console.error(error);
    return defaultTokenResponse;
  }
};

const availableEditions = [1];
export interface UserOwnedEdition {
  tokenId: number;
  numberOwned: number;
}

const getUserOwnedEditions = async (
  address: string
): Promise<Array<UserOwnedEdition>> => {
  const contract = getMintPassContract();
  const userOwnedEditions = await Promise.all(
    availableEditions.map((item) => {
      return contract.balanceOf(address, item);
    })
  );
  return userOwnedEditions.map((item, index) => {
    const edition: UserOwnedEdition = {
      numberOwned: item.toNumber(),
      tokenId: availableEditions[index]
    };
    return edition;
  });
};

export {
  checkAdminStatus,
  checkConnection,
  chooseCollection,
  connect,
  claim,
  getClaimsList,
  getContractInfo,
  getOwnedFromCollection,
  getUserInfo,
  listen,
  mint,
  requestAuthHeaders,
  reveal
};
