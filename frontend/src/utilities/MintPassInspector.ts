// Hard coded until I can create low-level getters because I forgot to add them to the mintPassContract
/*
    > let value = web3.utils.soliditySha3({type: "uint", value: 1},{type: "uint", value: 15})
    undefined
    > await provider.getStorageAt("0x18d0E051317E04Ae96314C372Bd35220460eEc62", value);
    '0x000000000000000000000000000000000000000000000000008e1bc9bf040000' => 40000000000000000

    mintprice 40000000000000000 
    💪💪💪💪💪💪💪💪💪
    found you, you bastard

    > await provider.getStorageAt("0x18d0E051317E04Ae96314C372Bd35220460eEc62", value);
      '0x0000000000000000000000000000000000000000000000000000000000000063' => 99
      mintPassLimit fuck yeah

    > await provider.getStorageAt("0x18d0E051317E04Ae96314C372Bd35220460eEc62", value);
      '0x0000000000000000000000000000000000000000000000000000000000000004'
      walletMintLimit yes yes yes!!!
    
    > await provider.getStorageAt("0x18d0E051317E04Ae96314C372Bd35220460eEc62", value);
      '0x000000000000000000000000000000000000000000000000000000000000006b'

    > '0x169f97de0d9a84d840042b17d3c6b9638b3d6fd9024c9eb0c7a306a17b49f895'
    > await provider.getStorageAt("0x18d0E051317E04Ae96314C372Bd35220460eEc62", value);
      '0x0000000000000000000000000000000000000000000000000000000000000063' => 99 totalMinted
    

    '0x169f97de0d9a84d840042b17d3c6b9638b3d6fd9024c9eb0c7a306a17b49f896'
    > await provider.getStorageAt("0x18d0E051317E04Ae96314C372Bd35220460eEc62", value);
      '0x0000000000000000000000000000000000000000000000000000000000000000'
      mapping



      > value = web3.utils.soliditySha3({type: "uint", value: 2},{type: "uint", value: 15})
      '0xa74ba3945261e09fde15ba3db55005b205e61eeb4ad811ac0faa2b315bffeead'
      > await provider.getStorageAt("0x18d0E051317E04Ae96314C372Bd35220460eEc62", value);
      '0x000000000000000000000000000000000000000000000000008e1bc9bf040000'
      mint pass 2
      mint price 

      // mint pass limit
      '0xa74ba3945261e09fde15ba3db55005b205e61eeb4ad811ac0faa2b315bffeeae'
      > await provider.getStorageAt("0x18d0E051317E04Ae96314C372Bd35220460eEc62", value);
      '0x0000000000000000000000000000000000000000000000000000000000000064'

  */

import { Networkish, Provider } from '@ethersproject/providers';
import { BigNumber, BigNumberish, ethers } from 'ethers';
import { SurrealMintPassFactory } from '../contracts/typechain';

const MINT_PASS_STRUCT_MAPPING_SLOT = 15;
const CURRENT_MINT_PASS_INDEX_SLOT = 16;

// Determined through the trial and error of which C3-linear ivars correspond to which slots
const MINT_PASS_CONTRACT_ADDR = '0x18d0E051317E04Ae96314C372Bd35220460eEc62';
const MINT_PASS_CONTRACT_ADDR_RINKEBY =
  '0x6F5FfE767EB8C637aA498f249f32178CDAb6cD77';

/*
    Struct order
    -----------------------------------------------------
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
*/

export interface MintPassInfo {
  id: number;
  mintPrice: BigNumber;
  passMintLimit: BigNumber;
  walletMintLimit: BigNumber;
  numberMinted: BigNumber;
  tokenURI: string;
  signatureRequired: boolean;
  saleActive: boolean;
}

enum STRUCT_SLOTS {
  MINT_PRICE = 0,
  PASS_MINT_LIMIT = 1,
  WALLET_MINT_LIMIT = 2,
  TOTAL_MINTED = 3, // A mistake in the contract. Unused.
  TOKEN_URI = 4,
  BOOLEAN_SLOT = 5, // 0x00...00[saleActive][requiresSignature]
  NUMBER_MINTED = 6,
  MINTS_PER_ADDRESS_MAPPING = 7
}

export const getCurrentActiveMintPass = async (
  contract: SurrealMintPassFactory
) => {
  return BigNumber.from(
    await contract.provider.getStorageAt(
      await getAddressForNetwork(contract.provider),
      CURRENT_MINT_PASS_INDEX_SLOT
    )
  ).toNumber();
};

export const getMintpassInfo = async (
  contract: SurrealMintPassFactory,
  mintPassId: number
): Promise<MintPassInfo> => {
  const provider = contract.provider;
  const mintPrice = await getMintPassStructStorageOffsetBy(
    STRUCT_SLOTS.MINT_PRICE,
    mintPassId,
    provider
  );
  const passLimit = await getMintPassStructStorageOffsetBy(
    STRUCT_SLOTS.PASS_MINT_LIMIT,
    mintPassId,
    provider
  );
  const walletLimit = await getMintPassStructStorageOffsetBy(
    STRUCT_SLOTS.WALLET_MINT_LIMIT,
    mintPassId,
    provider
  );
  const numberMinted = await getMintPassStructStorageOffsetBy(
    STRUCT_SLOTS.NUMBER_MINTED,
    mintPassId,
    provider
  );
  const tokenURI = await contract.uri(mintPassId);
  const boolstring = await getMintPassStructStorageOffsetBy(
    STRUCT_SLOTS.BOOLEAN_SLOT,
    mintPassId,
    provider
  );

  const signatureRequired = boolstring.endsWith('1');
  const saleActive = boolstring.endsWith('101') || boolstring.endsWith('100');

  return {
    id: mintPassId,
    mintPrice: BigNumber.from(mintPrice),
    passMintLimit: BigNumber.from(passLimit),
    walletMintLimit: BigNumber.from(walletLimit),
    numberMinted: BigNumber.from(numberMinted),
    tokenURI,
    signatureRequired,
    saleActive
  };
};

const getMintPassSlot = (mintPassId: number) => {
  return ethers.utils.solidityKeccak256(
    ['uint', 'uint'],
    [mintPassId, MINT_PASS_STRUCT_MAPPING_SLOT]
  );
};

const getOffsetValue = (value: BigNumberish, by: number) => {
  return ethers.BigNumber.from(value).add(by).toHexString();
};

const getMintPassStructStorageOffsetBy = async (
  offset: number,
  mintPassId: number,
  provider: Provider
) => {
  return await provider.getStorageAt(
    await getAddressForNetwork(provider),
    getOffsetValue(getMintPassSlot(mintPassId), offset)
  );
};

const getAddressForNetwork = async (provider: Provider) => {
  const network = await provider.getNetwork();
  if (network.chainId == 4) {
    return MINT_PASS_CONTRACT_ADDR_RINKEBY;
  }
  return MINT_PASS_CONTRACT_ADDR;
};
