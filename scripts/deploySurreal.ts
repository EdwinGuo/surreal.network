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
  const Surreal = await ethers.getContractFactory('Surreal');

  // For rinkeby
  const contract = await Surreal.deploy(
    '0x6560c8dF05a0823FAaEBF40E52Adcad1e8A5371A', //signer
    '0xA879F1096b2F65D7600fe6244F208A39348fEF65', //admin
    [
      '0x37C6E1D755112213d5E7D5e2Aca2b83192f7cF35',
      '0xA879F1096b2F65D7600fe6244F208A39348fEF65'
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
