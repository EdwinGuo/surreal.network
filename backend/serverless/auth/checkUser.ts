import { APIGatewayEvent } from 'aws-lambda';
import { Contract, Wallet } from 'ethers';
import { JsonRpcProvider } from '@ethersproject/providers';
import cookieParser from 'cookie-parser';
import pinataSDK from '@pinata/sdk';
import { isUserAllowed, verifySignature } from './status';

const headers = {
  'Content-Type': 'application/json',
  Accept: 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Credentials': true
};

interface UserRequest {
  address: string;
}

const handler = async (event: APIGatewayEvent) => {
  if (!event.body) {
    return {
      statusCode: 400,
      headers
    };
  }

  try {
    const { address }: UserRequest = JSON.parse(event.body);
    if (address === undefined) {
      throw Error();
    }
    isUserAllowed(address);
    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Ok'
      }),
      headers
    };
  } catch {
    return {
      statusCode: 401,
      body: JSON.stringify({
        message: 'Unauthorized'
      }),
      headers
    };
  }
};

module.exports = {
  handler
};
