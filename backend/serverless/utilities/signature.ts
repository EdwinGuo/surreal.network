import { Wallet } from 'ethers';

const generateSignature = async (wallet: Wallet, message: string) => {
  return await wallet.signMessage(message);
};

export { generateSignature };
