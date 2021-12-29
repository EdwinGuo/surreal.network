import { SSMClient, GetParameterCommand } from "@aws-sdk/client-ssm";

const client = new SSMClient({ region: "us-east-1" });
export const getSecret = async (key: string) => {
  const command = new GetParameterCommand({
    Name: key,
    WithDecryption: true,
  });
  const response = await client.send(command);
  return response.Parameter?.Value;
};

export const PINATA_API_KEY = "pinata-api-key";
export const PINATA_API_SECRET = "pinata-api-secret";
export const ALCHEMY_URL = "surreal-alchemy-url";
export const AUTH_MNEMONIC = "surreal-auth-mnemonic";
export const SIGNER_MNEMONIC = "surreal-signer-mnemonic";
