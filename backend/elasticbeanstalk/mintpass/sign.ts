import { Contract, Wallet } from "ethers";
import { sanitizedAddress } from "./sanitize";
import { JsonRpcProvider } from "@ethersproject/providers";
import { generateSignature } from "../utilities/signature";
import BAYC from "../abi/BAYC.json";
import MAYC from "../abi/MAYC.json";
import { ALCHEMY_URL, getSecret, SIGNER_MNEMONIC } from "../secrets/secrets";

let signingWallet: Wallet;

const BAYC_ADDRESS = "0xbc4ca0eda7647a8ab7c2061c2e118a18a936f13d";
const MAYC_ADDRESS = "0x60e4d786628fea6478f785a6d7e704777c86a7c6";

let web3Provider: JsonRpcProvider;

const sign = async (addressString: string) => {
  if (!signingWallet) {
    signingWallet = Wallet.fromMnemonic(
      (await getSecret(SIGNER_MNEMONIC)) ?? ""
    );
  }
  return await generateSignature(
    signingWallet,
    sanitizedAddress(addressString)
  );
};

export interface SignatureRequest {
  // Since the contract expects msg.sender as the signed message, we don't need to ask
  // the minter to sign locally before checking for apes.
  address: string;
}

const verifyAddress = async (address: string) => {
  const bayc = new Contract(BAYC_ADDRESS, BAYC, web3Provider);
  const mayc = new Contract(MAYC_ADDRESS, MAYC, web3Provider);
  return (
    (await bayc.balanceOf(address)) > 0 || (await mayc.balanceOf(address)) > 0
  );
};

const unauthorizedMessage = "You must have a BAYC or MAYC to mint";

export const handleSignatureRequest = async (request: SignatureRequest) => {
  if (!web3Provider) {
    web3Provider = new JsonRpcProvider(await getSecret(ALCHEMY_URL), {
      name: "mainnet",
      chainId: 1,
    });
  }
  if (!(await verifyAddress(request.address))) {
    throw Error(unauthorizedMessage);
  }
  const signature = await sign(request.address);

  return {
    signature,
    address: request.address,
  };
};
