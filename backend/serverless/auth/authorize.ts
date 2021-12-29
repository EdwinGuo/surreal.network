import { verifySignature } from './status';

export const authorize = async (
  authorization: string,
  adminRequired: boolean
) => {
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
  await verifySignature(
    {
      signature,
      address
    },
    adminRequired
  );
  return address;
};
