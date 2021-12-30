import { JsonRpcProvider } from '@ethersproject/providers';
import { BigNumber, Contract } from 'ethers';
import { ALCHEMY_URL, getSecret } from './secrets/secrets';
import AWS, { DynamoDB } from 'aws-sdk';
import Surreal from './abi/Surreal.json';

const dynamoDbClient = new AWS.DynamoDB.DocumentClient({
  region: 'us-east-1'
});
const CLAIMS_TABLE = process.env.CLAIMS_TABLE ?? 'surreal-claims';

const SURREAL_CONTRACT = '0xBC4AEE331E970f6E7A5e91f7B911BdBFdF928A98';
const SURREAL_CONTRACT_RINKEBY = '0xa1B6413BbD6Fc5533d024F0A6Ae92e5bd2a20e20';

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
    await updateItem(tokenId, claimTx, metadataUri);
  } catch (error) {
    console.error(error);
  }
};

const updateItem = async (
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
  // const alchemyUrl = await getSecret(ALCHEMY_URL);
  const alchemyUrl =
    'https://eth-rinkeby.alchemyapi.io/v2/BSMsDyBIdtljAPlGdde_sTmzBnCx86AX';
  provider = new JsonRpcProvider(alchemyUrl);

  surrealContract = new Contract(SURREAL_CONTRACT_RINKEBY, Surreal, provider);

  provider.on(
    {
      address: SURREAL_CONTRACT_RINKEBY,
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
