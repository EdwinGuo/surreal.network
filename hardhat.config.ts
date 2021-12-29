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
    address: '0xa1B6413BbD6Fc5533d024F0A6Ae92e5bd2a20e20',
    constructorArguments: [
      '0x6560c8dF05a0823FAaEBF40E52Adcad1e8A5371A', //signer
      '0xA879F1096b2F65D7600fe6244F208A39348fEF65', //admin
      [
        '0x37C6E1D755112213d5E7D5e2Aca2b83192f7cF35',
        '0xA879F1096b2F65D7600fe6244F208A39348fEF65'
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
      loggingEnabled: true,
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
      loggingEnabled: true,
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
