import { JsonRpcProvider } from '@ethersproject/providers';
import { APIGatewayEvent } from 'aws-lambda';
import AWS, { DynamoDB } from 'aws-sdk';
import { authorize } from '../auth/authorize';
import Surreal from '../abi/Surreal.json';
import BAYC from '../abi/BAYC.json';
import MAYC from '../abi/MAYC.json';
import { Contract, ethers } from 'ethers';

const dynamoDbClient = new AWS.DynamoDB.DocumentClient();
const CLAIMS_TABLE = process.env.CLAIMS_TABLE ?? '';
const SURREAL_CONTRACT = '0xBC4AEE331E970f6E7A5e91f7B911BdBFdF928A98';
const BAYC_ADDRESS = '0xbc4ca0eda7647a8ab7c2061c2e118a18a936f13d';
const MAYC_ADDRESS = '0x60e4d786628fea6478f785a6d7e704777c86a7c6';

const surrealInterface = new ethers.utils.Interface(Surreal);
export interface Claim {
  claimTx: string;
  collection: string;
  collectionToken: string;
}
const web3Provider = new JsonRpcProvider(process.env.ALCHEMY, {
  name: 'mainnet',
  chainId: 1
});

const maycContract = new ethers.Contract(MAYC_ADDRESS, MAYC, web3Provider);
const baycContract = new ethers.Contract(BAYC_ADDRESS, BAYC, web3Provider);

const handler = async (event: APIGatewayEvent) => {
  if (
    event.body === undefined ||
    event.body === null ||
    event.headers.authorization === undefined
  ) {
    return {
      statusCode: 400,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json'
      }
    };
  }

  const address = await authorize(event.headers.authorization, false);

  try {
    let claim: Claim;

    try {
      claim = JSON.parse(event.body);
    } catch {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json'
        }
      };
    }

    try {
      const transaction = await web3Provider.getTransaction(claim.claimTx);
      // Validate that this tx was for the claim function
      surrealInterface.decodeFunctionData('claim', transaction.data);
      if (
        transaction.from.toLowerCase() !== address.toLowerCase() ||
        transaction.to?.toLowerCase() !== SURREAL_CONTRACT.toLowerCase() ||
        (claim.collection !== 'MAYC' && claim.collection !== 'BAYC')
      ) {
        throw Error();
      }

      let contract: Contract;
      switch (claim.collection) {
        case 'BAYC':
          contract = baycContract;
          break;
        case 'MAYC':
          contract = maycContract;
          break;
        default:
          throw Error();
      }

      if (
        (await contract.ownerOf(claim.collectionToken).toLowerCase()) !==
        address.toLowerCase()
      ) {
        throw Error();
      }
    } catch {
      return {
        statusCode: 401,
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json'
        }
      };
    }

    const dateClaimed = new Date().getTime().toString();
    const params: DynamoDB.DocumentClient.PutItemInput = {
      TableName: CLAIMS_TABLE,
      Item: {
        ...claim,
        address,
        dateClaimed
      }
    };
    await dynamoDbClient.put(params).promise();
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json'
      }
    };
  } catch {
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json'
      }
    };
  }
};

export { handler };
