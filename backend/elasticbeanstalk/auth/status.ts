import addresses from "./allowed.json";
import { verifyMessage } from "ethers/lib/utils";

// First iteration of signer sessions do not expire
export interface BasicSignature {
  address: string;
  signature: string;
}

const isUserAllowed = (address: string) => {
  if (addresses.indexOf(address) == -1) {
    throw Error("Unauthorized signer");
  }
};

const verifySignature = async (request: BasicSignature) => {
  isUserAllowed(request.address);
  const signer = verifyMessage(request.address, request.signature);
  if (signer !== request.address) {
    throw Error("Unauthorized signer");
  }
};

export { verifySignature, isUserAllowed };
