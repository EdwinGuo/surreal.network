import { JsonRpcProvider } from '@ethersproject/providers';
import { BigNumber, Contract } from 'ethers';
import { ALCHEMY_URL, getSecret } from './secrets/secrets';
import Surreal from './abi/Surreal.json';
import { postReveal } from './bot/revealBot';

const SURREAL_CONTRACT = '0xBC4AEE331E970f6E7A5e91f7B911BdBFdF928A98';

let provider: JsonRpcProvider;
let surrealContract: Contract;

const onRevealed = async (tokenId: number, revealTxHash: string) => {
  try {
    const revealTx = await provider.getTransaction(revealTxHash);
    const decodedData = surrealContract.interface.decodeFunctionData(
      'reveal',
      revealTx.data
    );
    const metadataUri: string = decodedData.revealedTokenURI;
    await postReveal({
      surrealMetadataUrl: metadataUri,
      surrealTokenId: `${tokenId}`
    });
  } catch (error) {
    console.error(error);
  }
};

const start = async () => {
  const alchemyUrl = await getSecret(ALCHEMY_URL);
  provider = new JsonRpcProvider(alchemyUrl, {
    name: 'mainnet',
    chainId: 1
  });

  surrealContract = new Contract(SURREAL_CONTRACT, Surreal, provider);

  provider.on(
    {
      address: SURREAL_CONTRACT,
      topics: [
        '0xa109ba539900bf1b633f956d63c96fc89b814c7287f7aa50a9216d0b55657207',
        null
      ]
    },
    (log, _) => {
      try {
        const topics = log.topics;
        const tokenId = BigNumber.from(topics[1]);
        onRevealed(tokenId.toNumber(), log.transactionHash);
      } catch (error) {
        console.error('txListener: ' + error);
      }
    }
  );

  console.log('Started....');
};

start();
