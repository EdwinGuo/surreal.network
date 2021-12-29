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
    '0x6560c8dF05a0823FAaEBF40E52Adcad1e8A5371A', //signer
    '0x37C6E1D755112213d5E7D5e2Aca2b83192f7cF35', //admin
    '0x5Fea9DAcdE1fb43E87b8a9259Aebc937D995F51b', //dev
    '0xBC4AEE331E970f6E7A5e91f7B911BdBFdF928A98', //surreal contract
    [
      '0x37C6E1D755112213d5E7D5e2Aca2b83192f7cF35',
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
