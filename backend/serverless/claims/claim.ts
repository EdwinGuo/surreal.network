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
const BAYC_ADDRESS = '0xbc4ca0eda7647a8ab7c2061c2e118a18a936f13d';
const MAYC_ADDRESS = '0x60e4d786628fea6478f785a6d7e704777c86a7c6';
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
  console.log('handling claim request with body:');
  console.log(event.body);

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
  console.log(address + ' attempting claim. Authorized successfully.');
  try {
    let claim: Claim;

    try {
      claim = JSON.parse(event.body);
      console.log('Successfully parsed claim body');
      console.log(JSON.stringify(claim));
    } catch (error) {
      console.error(error);
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json'
        }
      };
    }

    try {
      let contract: Contract;
      switch (claim.collection) {
        case 'BAYC':
          contract = baycContract;
          break;
        case 'MAYC':
          contract = maycContract;
          break;
        default:
          throw Error('Incorrect collection provided. Must be BAYC or MAYC.');
      }

      console.log(
        claim.claimTx +
          ': Validating ' +
          address +
          ' ownership of ' +
          claim.collection +
          ' #' +
          claim.collectionToken
      );
      if (
        (await contract.ownerOf(claim.collectionToken)).toLowerCase() !==
        address.toLowerCase()
      ) {
        throw Error(
          'You do not own ' + claim.collection + ' #' + claim.collectionToken
        );
      }
    } catch (error) {
      console.error(error);
      return {
        statusCode: 401,
        body: JSON.stringify({
          error: error.message
        }),
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json'
        }
      };
    }

    const dateClaimed = new Date().getTime().toString();
    const Item = {
      ...claim,
      address,
      dateClaimed
    };
    console.log(claim.claimTx + ': writing item to dynamodb');
    console.log(JSON.stringify(Item));
    const params: DynamoDB.DocumentClient.PutItemInput = {
      TableName: CLAIMS_TABLE,
      Item
    };
    await dynamoDbClient.put(params).promise();
    console.log(claim.claimTx + ': sucessfully wrote item to dynamodb');
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json'
      }
    };
  } catch (error) {
    console.error(error);
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
