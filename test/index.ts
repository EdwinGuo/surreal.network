import { Signer } from '@ethersproject/abstract-signer';
import { expect } from 'chai';
import { ethers } from 'hardhat';
import {
  Surreal,
  SurrealMintPassFactory
} from '../frontend/src/contracts/typechain';

const getSurrealContract = async () => {
  const Surreal = await ethers.getContractFactory('Surreal');
  const admin = (await ethers.getSigners())[1];
  const signer = (await ethers.getSigners())[2];
  const dev = (await ethers.getSigners())[3];
  const contract: Surreal = (await Surreal.deploy(
    signer.address,
    admin.address,
    [admin.address, dev.address],
    [75, 25]
  )) as Surreal;
  return contract;
};

const getMintPassContract = async (surrealContract: Surreal) => {
  const SurrealMintPass = await ethers.getContractFactory(
    'SurrealMintPassFactory'
  );
  const admin = (await ethers.getSigners())[1];
  const signer = (await ethers.getSigners())[2];
  const dev = (await ethers.getSigners())[3];
  const contract = (await SurrealMintPass.deploy(
    signer.address, // signer
    admin.address, // admin
    dev.address, // dev address
    surrealContract.address, // surreal contract
    [admin.address, dev.address], // payment splitter
    [75, 25]
  )) as SurrealMintPassFactory;
  await surrealContract.connect(admin).setMintPassContract(contract.address);
  return contract;
};

const getAdmin = async () => {
  return (await ethers.getSigners())[1];
};

const getDeployer = async () => {
  return (await ethers.getSigners())[0];
};

const parseEther = (value: string) => {
  return ethers.utils.parseEther(value);
};

const sanitizedAddress = (addressString: string) => {
  let message = addressString;
  if (addressString.startsWith('0x')) {
    message = addressString.slice('0x'.length);
  }
  return message.toLowerCase();
};

describe('Surreal Tests', function () {
  let contract: Surreal;
  let mintPassContract: SurrealMintPassFactory;
  let deployer: Signer;
  let admin: Signer;
  let minter: Signer;
  let minterAddress: string;
  let secondMinter: Signer;
  let secondMinterAddress: string;
  let ecdsaSigner: Signer;

  const generateSignature = async (addressString: string) => {
    return await ecdsaSigner.signMessage(sanitizedAddress(addressString));
  };

  const createMintPass = async (
    signer: Signer,
    priceInEth: string,
    passLimit: number,
    walletLimit: number,
    uri: string,
    requiresSignature: boolean
  ) => {
    return mintPassContract
      .connect(signer)
      .createNewMintPass(
        parseEther(priceInEth),
        passLimit,
        walletLimit,
        uri,
        requiresSignature
      );
  };

  beforeEach(async () => {
    contract = await getSurrealContract();
    mintPassContract = await getMintPassContract(contract);
    admin = await getAdmin();
    deployer = (await ethers.getSigners())[0];
    ecdsaSigner = (await ethers.getSigners())[2];
    minter = (await ethers.getSigners())[4];
    minterAddress = await minter.getAddress();
    secondMinter = (await ethers.getSigners())[5];
    secondMinterAddress = await secondMinter.getAddress();
  });

  it('Opensea owner getter overridden for collection management', async () => {
    expect(await contract.owner()).to.eq(await admin.getAddress());
    expect(await mintPassContract.owner()).to.eq(await admin.getAddress());
  });
  it('Sale must be started', async () => {
    await createMintPass(admin, '0.04', 100, 4, 'token1uri', false);
    await expect(
      mintPassContract.connect(minter).publicMint(minterAddress, 1, '0x00', {
        value: parseEther('0.04')
      })
    ).to.be.revertedWith('Sale not active');
  });
  it('Must be authorized to create a mint pass', async () => {
    await expect(
      createMintPass(deployer, '0.04', 100, 4, 'uri1.com', false)
    ).to.be.revertedWith('Not authorized to perform that action');
    expect(await createMintPass(admin, '0.04', 100, 4, 'uri1.com', false)).to.be
      .ok;
  });
  it('Can mint one', async () => {
    await createMintPass(admin, '0.04', 100, 4, 'token1uri', false);
    await mintPassContract.connect(admin).toggleSale(1);
    await mintPassContract
      .connect(minter)
      .publicMint(minterAddress, 1, '0x00', {
        value: parseEther('0.04')
      });
    expect(await mintPassContract.balanceOf(minterAddress, 1)).to.eq(1);
  });
  it('Can mint up to wallet max', async () => {
    await createMintPass(admin, '0.04', 100, 4, 'token1uri', false);
    await mintPassContract.connect(admin).toggleSale(1);
    await expect(
      mintPassContract.connect(minter).publicMint(minterAddress, 5, '0x00', {
        value: parseEther('0.2')
      })
    ).to.be.revertedWith('Exceeds wallet mint limit');
    await mintPassContract
      .connect(minter)
      .publicMint(minterAddress, 4, '0x00', {
        value: parseEther('0.16')
      });
    expect(await mintPassContract.balanceOf(minterAddress, 1)).to.eq(4);
    await expect(
      mintPassContract.connect(minter).publicMint(minterAddress, 1, '0x00', {
        value: parseEther('0.04')
      })
    ).to.be.revertedWith('Exceeds wallet mint limit');
  });
  it('Can mint up to pass max', async () => {
    await createMintPass(admin, '0.04', 3, 4, 'token1uri', false);
    await mintPassContract.connect(admin).toggleSale(1);
    await expect(
      mintPassContract.connect(minter).publicMint(minterAddress, 4, '0x00', {
        value: parseEther('0.16')
      })
    ).to.be.revertedWith('Not enough tokens remaining in this pass');
    await mintPassContract
      .connect(minter)
      .publicMint(minterAddress, 3, '0x00', {
        value: parseEther('0.12')
      });
    expect(await mintPassContract.balanceOf(minterAddress, 1)).to.eq(3);
  });
  it('Can mint up to pass max multiple wallets', async () => {
    await createMintPass(admin, '0.04', 3, 4, 'token1uri', false);
    await mintPassContract.connect(admin).toggleSale(1);
    await mintPassContract
      .connect(minter)
      .publicMint(minterAddress, 3, '0x00', {
        value: parseEther('0.12')
      });
    await expect(
      mintPassContract
        .connect(secondMinter)
        .publicMint(secondMinterAddress, 1, '0x00', {
          value: parseEther('0.04')
        })
    ).to.be.revertedWith('Not enough tokens remaining in this pass');
    expect(await mintPassContract.balanceOf(minterAddress, 1)).to.eq(3);
    expect(await mintPassContract.balanceOf(secondMinterAddress, 1)).to.eq(0);
  });
  it('Can mint multiple mint passes', async () => {
    await createMintPass(admin, '0.04', 3, 4, 'token1uri', false);
    await mintPassContract.connect(admin).toggleSale(1);

    await mintPassContract
      .connect(minter)
      .publicMint(minterAddress, 3, '0x00', {
        value: parseEther('0.12')
      });

    await createMintPass(admin, '0.05', 10, 1, 'token2uri', false);
    await mintPassContract.connect(admin).toggleSale(2);
    await mintPassContract
      .connect(minter)
      .publicMint(minterAddress, 1, '0x00', {
        value: parseEther('0.05')
      });

    expect(await mintPassContract.balanceOf(minterAddress, 1)).to.eq(3);
    expect(await mintPassContract.balanceOf(minterAddress, 2)).to.eq(1);
  });

  it('Signatures validated when required', async () => {
    await createMintPass(admin, '0.04', 100, 4, 'token1uri', true);
    await mintPassContract.connect(admin).toggleSale(1);
    await expect(
      mintPassContract
        .connect(secondMinter)
        .publicMint(secondMinterAddress, 1, '0x00', {
          value: parseEther('0.04')
        })
    ).to.be.revertedWith('ECDSA: invalid signature length');

    const signature = await generateSignature(sanitizedAddress(minterAddress));
    await mintPassContract
      .connect(minter)
      .publicMint(minterAddress, 1, signature, {
        value: parseEther('0.04')
      });
    expect(await mintPassContract.balanceOf(minterAddress, 1)).to.eq(1);
  });

  it("Cannot mint using someone else's address as signature", async () => {
    await createMintPass(admin, '0.04', 100, 4, 'token1uri', true);
    await mintPassContract.connect(admin).toggleSale(1);
    const signature = await generateSignature(sanitizedAddress(minterAddress));
    await expect(
      mintPassContract
        .connect(secondMinter)
        .publicMint(secondMinterAddress, 1, signature, {
          value: parseEther('0.04')
        })
    ).to.be.revertedWith('Requires valid signature');
  });

  it('Each token has its own URI', async () => {
    await createMintPass(admin, '0.04', 100, 4, 'token1uri', false);
    await createMintPass(admin, '0.04', 100, 4, 'token2uri', false);
    await createMintPass(admin, '0.04', 100, 4, 'token3uri', false);

    expect(await mintPassContract.uri(1)).to.eq('token1uri');
    expect(await mintPassContract.uri(2)).to.eq('token2uri');
    expect(await mintPassContract.uri(3)).to.eq('token3uri');
  });

  it('Admin cannot burn tokens', async () => {
    await createMintPass(admin, '0.04', 100, 4, 'token1uri', false);
    await mintPassContract.connect(admin).toggleSale(1);
    await mintPassContract
      .connect(minter)
      .publicMint(minterAddress, 1, '0x00', {
        value: parseEther('0.04')
      });
    await expect(
      mintPassContract.connect(admin).burn(minterAddress, 1, 1)
    ).to.be.revertedWith('Only surreal contract can burn mint passes');
  });
  it('Owners cannot burn their own tokens', async () => {
    await createMintPass(admin, '0.04', 100, 4, 'token1uri', false);
    await mintPassContract.connect(admin).toggleSale(1);
    await mintPassContract
      .connect(minter)
      .publicMint(minterAddress, 1, '0x00', {
        value: parseEther('0.04')
      });
    await expect(
      mintPassContract.connect(minter).burn(minterAddress, 1, 1)
    ).to.be.revertedWith('Only surreal contract can burn mint passes');
  });

  it('Mint pass redeems a surreal token', async () => {
    await createMintPass(admin, '0.04', 100, 4, 'token1uri', false);
    await mintPassContract.connect(admin).toggleSale(1);
    await mintPassContract
      .connect(minter)
      .publicMint(minterAddress, 4, '0x00', {
        value: parseEther('0.16')
      });

    expect(await mintPassContract.balanceOf(minterAddress, 1)).to.eq(4);
    await contract.connect(admin).unpauseClaiming();
    const signature = await generateSignature(sanitizedAddress(minterAddress));

    await contract.connect(minter).claim(signature, 1);
    expect(await contract.balanceOf(minterAddress)).to.eq(1);
    expect(await mintPassContract.balanceOf(minterAddress, 1)).to.eq(3);
  });

  it('Any mint pass can redeem a surreal token', async () => {
    await createMintPass(admin, '0.04', 100, 4, 'token1uri', false);
    await mintPassContract.connect(admin).toggleSale(1);
    await mintPassContract
      .connect(minter)
      .publicMint(minterAddress, 4, '0x00', {
        value: parseEther('0.16')
      });

    await createMintPass(admin, '0.04', 100, 4, 'token2uri', false);
    await mintPassContract.connect(admin).toggleSale(2);
    await mintPassContract
      .connect(minter)
      .publicMint(minterAddress, 4, '0x00', {
        value: parseEther('0.16')
      });

    expect(await mintPassContract.balanceOf(minterAddress, 1)).to.eq(4);
    expect(await mintPassContract.balanceOf(minterAddress, 2)).to.eq(4);

    await contract.connect(admin).unpauseClaiming();
    const signature = await generateSignature(sanitizedAddress(minterAddress));

    await contract.connect(minter).claim(signature, 2);
    expect(await contract.balanceOf(minterAddress)).to.eq(1);
    expect(await mintPassContract.balanceOf(minterAddress, 1)).to.eq(4);
    expect(await mintPassContract.balanceOf(minterAddress, 2)).to.eq(3);

    await contract.connect(minter).claim(signature, 1);
    expect(await mintPassContract.balanceOf(minterAddress, 1)).to.eq(3);
    expect(await mintPassContract.balanceOf(minterAddress, 2)).to.eq(3);
    expect(await contract.balanceOf(minterAddress)).to.eq(2);
  });

  it('Minting signer can be changed', async () => {
    await createMintPass(admin, '0.04', 100, 4, 'token1uri', true);
    await mintPassContract.connect(admin).toggleSale(1);

    const firstSignature = await generateSignature(
      sanitizedAddress(minterAddress)
    );

    ecdsaSigner = (await ethers.getSigners())[10];
    mintPassContract
      .connect(admin)
      .setMintingSigner(await ecdsaSigner.getAddress());

    const signature = await generateSignature(sanitizedAddress(minterAddress));
    await expect(
      mintPassContract
        .connect(secondMinter)
        .publicMint(secondMinterAddress, 1, firstSignature, {
          value: parseEther('0.04')
        })
    ).to.be.revertedWith('Requires valid signature');
    await mintPassContract
      .connect(minter)
      .publicMint(minterAddress, 1, signature, {
        value: parseEther('0.04')
      });
    expect(await mintPassContract.balanceOf(minterAddress, 1)).to.eq(1);
  });

  it('Mint pass params can be updated', async () => {
    await createMintPass(admin, '0.04', 100, 4, 'token1uri', false);
    await mintPassContract.connect(admin).toggleSale(1);

    await mintPassContract
      .connect(minter)
      .publicMint(minterAddress, 4, '0x00', {
        value: parseEther('0.16')
      });
    await expect(
      mintPassContract.connect(minter).publicMint(minterAddress, 1, '0x00', {
        value: parseEther('0.04')
      })
    ).to.be.revertedWith('Exceeds wallet mint limit');

    await mintPassContract
      .connect(admin)
      .updateMintPass(1, parseEther('0.05'), 100, 5, false);
    await mintPassContract
      .connect(minter)
      .publicMint(minterAddress, 1, '0x00', {
        value: parseEther('0.05')
      });
    expect(await mintPassContract.balanceOf(minterAddress, 1)).to.eq(5);

    await mintPassContract
      .connect(admin)
      .updateMintPass(1, parseEther('0.05'), 100, 7, true);
    await expect(
      mintPassContract.connect(minter).publicMint(minterAddress, 1, '0x00', {
        value: parseEther('0.05')
      })
    ).to.be.revertedWith('ECDSA: invalid signature length');

    const signature = await generateSignature(sanitizedAddress(minterAddress));
    await mintPassContract
      .connect(minter)
      .publicMint(minterAddress, 2, signature, {
        value: parseEther('0.1')
      });
    expect(await mintPassContract.balanceOf(minterAddress, 1)).to.eq(7);
  });

  it('Mint pass can be overridden', async () => {
    await createMintPass(admin, '0.04', 100, 4, 'token1uri', false);
    await mintPassContract.connect(admin).toggleSale(1);
    await createMintPass(admin, '0.04', 100, 4, 'token2uri', false);
    await mintPassContract.connect(admin).toggleSale(2);

    await mintPassContract
      .connect(minter)
      .publicMint(minterAddress, 1, '0x00', {
        value: parseEther('0.04')
      });

    await mintPassContract.connect(admin).overrideCurrentActiveMintPass(1);
    await mintPassContract
      .connect(minter)
      .publicMint(minterAddress, 2, '0x00', {
        value: parseEther('0.08')
      });

    expect(await mintPassContract.balanceOf(minterAddress, 1)).to.eq(2);
    expect(await mintPassContract.balanceOf(minterAddress, 2)).to.eq(1);
  });
});
