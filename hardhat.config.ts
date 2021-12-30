import * as dotenv from 'dotenv';

import { HardhatUserConfig, task } from 'hardhat/config';
import '@nomiclabs/hardhat-etherscan';
import '@nomiclabs/hardhat-waffle';
import '@typechain/hardhat';
import 'hardhat-gas-reporter';
import 'hardhat-abi-exporter';
import 'solidity-coverage';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { exit } from 'process';

dotenv.config();

const frontendContractRoot = './frontend/src/contracts/';

task('verifyContract', async (taskArgs, hre) => {
  await hre.run('verify:verify', {
    address: '0x6F5FfE767EB8C637aA498f249f32178CDAb6cD77',
    constructorArguments: [
      '0xBa0d9255Bf420E1A23A274f011D7074800B96AE2', //signer
      '0xA879F1096b2F65D7600fe6244F208A39348fEF65', //admin
      '0xA879F1096b2F65D7600fe6244F208A39348fEF65', //dev
      '0xa1B6413BbD6Fc5533d024F0A6Ae92e5bd2a20e20', //surreal contract
      [
        '0xA879F1096b2F65D7600fe6244F208A39348fEF65',
        '0xfAd0feC24047f510D110fB03b73e57a72e91f33D'
      ],
      [75, 25]
    ]
  });
});

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

const config: HardhatUserConfig = {
  solidity: {
    version: '0.8.4',
    settings: {
      optimizer: {
        enabled: true,
        runs: 10
      }
    }
  },
  networks: {
    mainnet: {
      chainId: 1,
      timeout: 120000,
      gasMultiplier: 1,
      gasPrice: 70000000000,
      accounts: {
        mnemonic: process.env.MAINNET_MNEMONIC ?? ''
      },
      url: process.env.MAINNET_URL ?? ''
    },
    rinkeby: {
      chainId: 4,
      timeout: 120000,
      gasMultiplier: 1,
      gasPrice: 1000000000,
      accounts: {
        mnemonic: process.env.RINKEBY_MNEMONIC ?? ''
      },
      url: process.env.RINKEBY_URL ?? ''
    },
    hardhat: {
      initialBaseFeePerGas: 0, // workaround from https://github.com/sc-forks/solidity-coverage/issues/652#issuecomment-896330136 . Remove when that issue is closed.
      forking: {
        url: process.env.MAINNET_URL ?? ''
      },
      gas: 12000000,
      blockGasLimit: 0x1fffffffffffff,
      allowUnlimitedContractSize: true,
      mining: {
        auto: true
      }
    }
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS !== undefined,
    currency: 'USD'
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY
  },
  abiExporter: {
    path: frontendContractRoot + 'artifacts',
    flat: true
  },
  typechain: {
    outDir: frontendContractRoot + 'typechain'
  }
};

export default config;
