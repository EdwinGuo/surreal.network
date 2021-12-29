import axios from 'axios';
import { BasicSignature } from './wallet';
export interface Metadata {
  collection: string;
  collectionTokenNumber: string;
  surrealTokenNumber: string;
}

const uploadImagetoIPFS = async (
  signature: BasicSignature,
  metadata: Metadata,
  file: File
) => {
  let data = new FormData();
  data.append('image', file, file.name);
  data.append('collection', metadata.collection);
  data.append('collectionTokenNumber', metadata.collectionTokenNumber);
  data.append('surrealTokenNumber', metadata.surrealTokenNumber);
  const uploadResponse = await axios.post(
    'https://surreal.harmonize.gg/upload',
    data,
    {
      maxBodyLength: Infinity,
      auth: {
        username: signature.address,
        password: signature.signature
      },
      headers: {
        accept: 'application/json',
        'Accept-Language': 'en-US,en;q=0.8',
        'Content-Type': `multipart/form-data`
      }
    }
  );

  return uploadResponse;
};

export { uploadImagetoIPFS };
