import { APIGatewayEvent } from 'aws-lambda';
import { authorize } from '../auth/authorize';
import AWS, { DynamoDB } from 'aws-sdk';

const dynamoDbClient = new AWS.DynamoDB.DocumentClient();
const CLAIMS_TABLE = process.env.CLAIMS_TABLE ?? '';

const unauthorizedResponse = {
  statusCode: 401,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json'
  }
};
const handler = async (event: APIGatewayEvent) => {
  if (event.headers.authorization === undefined) {
    return unauthorizedResponse;
  }
  try {
    try {
      await authorize(event.headers.authorization, true);
    } catch {
      return unauthorizedResponse;
    }
    const showOnlyUnrevealed =
      event.queryStringParameters?.unrevealed ?? false ? true : false;

    const params = {
      FilterExpression: showOnlyUnrevealed
        ? 'attribute_not_exists(dateRevealed)'
        : undefined,
      TableName: CLAIMS_TABLE
    };
    const values = (await dynamoDbClient.scan(params).promise()).Items;
    return values;
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
