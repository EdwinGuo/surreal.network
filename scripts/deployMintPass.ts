// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
import { ethers } from 'hardhat';

async function main() {
  // Hardhat always runs the compile task when running scripts with its command
  // line interface.
  //
  // If this script is run directly using `node` you may want to call compile
  // manually to make sure everything is compiled
  // await hre.run('compile');

  // We get the contract to deploy
  const SurrealMintPassFactory = await ethers.getContractFactory(
    'SurrealMintPassFactory'
  );

  const contract = await SurrealMintPassFactory.deploy(
    '0xBa0d9255Bf420E1A23A274f011D7074800B96AE2', //signer
    '0xA879F1096b2F65D7600fe6244F208A39348fEF65', //admin
    '0xA879F1096b2F65D7600fe6244F208A39348fEF65', //dev
    '0xa1B6413BbD6Fc5533d024F0A6Ae92e5bd2a20e20', //surreal contract
    [
      '0xA879F1096b2F65D7600fe6244F208A39348fEF65',
      '0xfAd0feC24047f510D110fB03b73e57a72e91f33D'
    ],
    [75, 25]
  );

  await contract.deployed();

  console.log('Surreal deploying:', contract.deployTransaction);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
