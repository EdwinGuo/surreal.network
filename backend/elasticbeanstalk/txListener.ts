import { JsonRpcProvider } from '@ethersproject/providers';
import { BigNumber, Contract } from 'ethers';
import { ALCHEMY_URL, DISCORD_BOT_KEY, getSecret } from './secrets/secrets';
import AWS, { DynamoDB } from 'aws-sdk';
import Surreal from './abi/Surreal.json';

const dynamoDbClient = new AWS.DynamoDB.DocumentClient({
  region: 'us-east-1'
});
const CLAIMS_TABLE = process.env.CLAIMS_TABLE ?? 'surreal-claims';

const SURREAL_CONTRACT = '0xBC4AEE331E970f6E7A5e91f7B911BdBFdF928A98';

let provider: JsonRpcProvider;
let surrealContract: Contract;

const onRevealed = async (tokenId: number, revealTxHash: string) => {
  try {
    const claimTx = await getClaimTx(tokenId);
    const revealTx = await provider.getTransaction(revealTxHash);
    const decodedData = surrealContract.interface.decodeFunctionData(
      'reveal',
      revealTx.data
    );
    const metadataUri: string = decodedData.revealedTokenURI;
    await updateRevealedItem(tokenId, claimTx, metadataUri);
    // await postReveal({
    //   surrealMetadataUrl: metadataUri,
    //   surrealTokenId: `${tokenId}`
    // });
  } catch (error) {
    console.error(error);
  }
};

const onMined = async (tokenId: number) => {
  try {
    const claimTx = await getClaimTx(tokenId);
    updateMinedItem(tokenId, claimTx);
  } catch (error) {
    console.error(error);
  }
};

const updateMinedItem = async (tokenId: number, claimTx: string) => {
  const params: DynamoDB.DocumentClient.UpdateItemInput = {
    TableName: CLAIMS_TABLE,
    Key: {
      claimTx: claimTx
    },
    UpdateExpression: 'set tokenId = :t',
    ExpressionAttributeValues: {
      ':t': `${tokenId}`
    }
  };
  await dynamoDbClient.update(params).promise();
  console.log('Token ' + tokenId + ' minted');
  console.log('Updated ' + claimTx);
};

const updateRevealedItem = async (
  tokenId: number,
  claimTx: string,
  metadataUri: string
) => {
  const dateRevealed = new Date().getTime().toString();

  const params: DynamoDB.DocumentClient.UpdateItemInput = {
    TableName: CLAIMS_TABLE,
    Key: {
      claimTx: claimTx
    },
    UpdateExpression: 'set dateRevealed = :d, metadataUri = :m, tokenId = :t',
    ExpressionAttributeValues: {
      ':d': dateRevealed,
      ':m': metadataUri,
      ':t': `${tokenId}`
    }
  };
  await dynamoDbClient.update(params).promise();
  console.log('Token ' + tokenId + ' revealed with tokenUri ' + metadataUri);
  console.log('Updated ' + claimTx);
};

const getClaimTx = async (tokenId: number) => {
  const filter = surrealContract.filters.Transfer(
    '0x0000000000000000000000000000000000000000',
    null,
    tokenId
  );
  const logs = await surrealContract.queryFilter(filter);
  if (logs.length == 0) {
    throw Error('Unable to find mint for this token');
  }
  const mintLog = logs[0];
  return mintLog.transactionHash;
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
        '0x6aa3eac93d079e5e100b1029be716caa33586c96aa4baac390669fb5c2a21212',
        null
      ]
    },
    (log, _) => {
      try {
        const topics = log.topics;
        const tokenId = BigNumber.from(topics.pop()).toNumber();
        onMined(tokenId);
      } catch (error) {
        console.error('txListener: ' + error);
      }
    }
  );

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
