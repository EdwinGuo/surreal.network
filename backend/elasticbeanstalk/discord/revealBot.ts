import axios from 'axios';
import {
  Client,
  Intents,
  Message,
  MessageEmbed,
  TextChannel
} from 'discord.js';
import { getSecret, IPFS_GATEWAY } from '../secrets/secrets';

const maycMetadataBaseUrl = 'https://boredapeyachtclub.com/api/mutants/';
const baycRootCID = 'QmeSjSinHpPnmXmspMjwiXyN6zS4E9zccariGR3jxcaWtq/';
let ipfsGateway: string;

const client = new Client({
  intents: [
    Intents.FLAGS.GUILDS,
    Intents.FLAGS.GUILD_MESSAGES,
    Intents.FLAGS.GUILD_MESSAGE_REACTIONS
  ]
});

const getMAYCMetadataURL = (tokenId: string) => {
  return maycMetadataBaseUrl + tokenId;
};

const getTokenImageURL = async (metadataUrl: string) => {
  const metadata: Metadata = (await axios.get(metadataUrl)).data;
  const cid = metadata.image.split('ipfs://').pop();
  return ipfsGateway + cid;
};

const getSurrealImageURL = (surrealMetadata: Metadata) => {
  const cid = surrealMetadata.image.split('ipfs://').pop();
  return ipfsGateway + cid;
};

const getBAYCMetadataURL = (tokenId: string) => {
  return ipfsGateway + baycRootCID + tokenId;
};

const getOriginalCollectionName = (surrealMetadata: Metadata) => {
  const attribute = surrealMetadata.attributes[0];
  if (attribute === undefined) {
    throw Error('Unexpected surreal metadata. Attribute missing.');
  }
  return attribute.trait_type;
};

const getOriginalCollectionToken = (surrealMetadata: Metadata) => {
  const attribute = surrealMetadata.attributes[0];
  if (attribute === undefined) {
    throw Error('Unexpected surreal metadata. Attribute missing.');
  }
  return attribute.value;
};

const getOriginalMetadataURL = async (surrealMetadata: Metadata) => {
  let metadataURL: string;
  const collection = getOriginalCollectionName(surrealMetadata);
  const collectionTokenId = getOriginalCollectionToken(surrealMetadata);
  switch (collection) {
    case 'MAYC':
      metadataURL = getMAYCMetadataURL(collectionTokenId);
      break;
    case 'BAYC':
      metadataURL = getBAYCMetadataURL(collectionTokenId);
      break;
    default:
      throw Error('Unsupported original collection ' + collection);
  }
  return metadataURL;
};

const getTokenMetadata = async (metadataUrl: string) => {
  let url = metadataUrl;
  if (url.startsWith('ipfs://')) {
    const cid = metadataUrl.split('ipfs://').pop();
    url = ipfsGateway + cid;
  }
  const response = (await axios.get<Metadata>(url)).data;
  return response;
};

export const startClient = async (token: string) => {
  ipfsGateway = (await getSecret(IPFS_GATEWAY)) ?? '';
  if (ipfsGateway.length == 0) {
    console.error('Failed to get IPFS Gateway');
  }
  await client.login(token);
};

export interface Reveal {
  surrealTokenId: string;
  surrealMetadataUrl: string;
}

export interface Metadata {
  image: string;
  attributes: Array<MetadataAttributes>;
}

export interface MetadataAttributes {
  trait_type: string;
  value: string;
}

export const postReveal = async (reveal: Reveal) => {
  const metadata = await getTokenMetadata(reveal.surrealMetadataUrl);
  const originalMetadataURL = await getOriginalMetadataURL(metadata);
  const originalImageURL = await getTokenImageURL(originalMetadataURL);
  const surrealImageURL = getSurrealImageURL(metadata);
  const collectionName = getOriginalCollectionName(metadata);
  const collectionTokenId = getOriginalCollectionToken(metadata);
  const embed = new MessageEmbed()
    .setColor(`${collectionName === 'MAYC' ? '#d1de3f' : '#ffffff'}`)
    .setTitle('SURREAL APE #' + reveal.surrealTokenId + ' revealed')
    .setURL(
      'https://opensea.io/assets/0xbc4aee331e970f6e7a5e91f7b911bdbfdf928a98/' +
        reveal.surrealTokenId
    )
    .setImage(surrealImageURL)
    .setThumbnail(originalImageURL)
    .setTimestamp(Date.now())
    .setFooter({
      text: 'SURREAL APES',
      iconURL:
        'https://surreal.network/static/media/logo.138f7094e7dacac59510.png'
    })
    .addFields([
      {
        name: 'Original Ape',
        value: collectionName + ' #' + collectionTokenId
      }
    ]);

  const channel = (await client.channels.fetch(
    '921878220238905344'
  )) as TextChannel;

  if (channel === undefined || channel === null) {
    throw Error(
      'Could not find specified discord channel. Make sure the bot is invited and has permission.'
    );
  }

  channel.send({ embeds: [embed] });
};
