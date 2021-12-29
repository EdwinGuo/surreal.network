import { Readable } from 'stream';
import PinataSDK, { PinataClient } from '@pinata/sdk';
import { verifySignature } from '../auth/status';
import { Request, Response } from 'express';
import {
  getSecret,
  PINATA_API_KEY,
  PINATA_API_SECRET
} from '../secrets/secrets';

let pinata: PinataClient;

export const authorize = async (authorization: string) => {
  if (!authorization?.startsWith('Basic ')) {
    throw Error('No auth header');
  }
  const base64Header = authorization.split('Basic ').pop();
  if (base64Header == undefined) {
    throw Error('Invalid auth header');
  }
  const headerString = Buffer.from(base64Header, 'base64').toString();
  const components = headerString.split(':');
  const address = components[0];
  const signature = components[1];

  if (signature === undefined || address === undefined) {
    throw Error('Signature or Address missing from header');
  }
  await verifySignature({
    signature,
    address
  });
};

interface UploadRequest {
  collection: string;
  collectionTokenNumber: string;
  surrealTokenNumber: string;
}

interface NFTMetadata {
  image: string;
  attributes: Array<NFTAttributes>;
}

interface NFTAttributes {
  trait_type: string;
  value: string;
}

export const handleUploadRequest = async (req: Request, res: Response) => {
  if (pinata === undefined) {
    const pinataApiKey = await getSecret(PINATA_API_KEY);
    const pinataSecretKey = await getSecret(PINATA_API_SECRET);
    pinata = PinataSDK(pinataApiKey ?? '', pinataSecretKey ?? '');
  }
  if (req.file === undefined) {
    throw Error('No file provided');
  }
  const uploadResponse = await uploadImageToIPFS(req.file.buffer);

  const request = req.body as UploadRequest;
  const metadata: NFTMetadata = {
    image: 'ipfs://' + uploadResponse.IpfsHash,
    attributes: [
      {
        trait_type: request.collection,
        value: request.collectionTokenNumber
      }
    ]
  };

  const jsonResponse = await uploadJSONToIPFS(metadata);
  return {
    uri: 'ipfs://' + jsonResponse.IpfsHash
  };
};

const uploadJSONToIPFS = async (metadata: NFTMetadata) => {
  const uploadResponse = await pinata.pinJSONToIPFS(metadata);
  return uploadResponse;
};

const uploadImageToIPFS = async (contents: Buffer) => {
  const key = Date.now().toString();
  let object = new Readable() as any;
  object._read = () => {};
  object.push(contents);
  object.push(null);
  object.path = key + '.png';
  const uploadResponse = await pinata.pinFileToIPFS(object);
  return uploadResponse;
};

interface PinataResponse {
  IpfsHash: string;
  PinSize;
}
