import { MinusIcon, PlusIcon } from "@heroicons/react/outline";
import React, { useEffect, useState } from "react";
import { RootState } from "../app/store";
import { useSelector, useDispatch } from "react-redux";
import {
  connectWallet,
  initialize,
  setConnection as setConnectionAction,
  setContractInfo as setContractInfoAction,
  setUserInfo as setUserInfoAction,
} from "../store/wallet/walletSlice";
import {
  checkConnection,
  connect,
  ConnectionResponse,
  ContractInfo,
  getContractInfo,
  getUserInfo,
  listen,
  mint,
  MintStatus,
  UserInfo,
} from "../services/wallet";
import mintpass from "./../videos/mp2.mp4";
import "./mintpass.css";
import opensea from "./../images/opensea.svg";
import Loader from "../components/loader/Loader";

function classNames(...classes: Array<string>) {
  return classes.filter(Boolean).join(" ");
}

const Mintpass = () => {
  const { connection, contractInfo, userInfo } = useSelector(
    (state: RootState) => state.wallet
  );
  const dispatch = useDispatch();
  const [mintAmount, setMintAmount] = useState(1);
  const [errorMessage, setErrorMessage] = useState<string | undefined>();
  const [mintStatus, setMintStatus] = useState<MintStatus>(MintStatus.NONE);
  const [mintTx, setMintTx] = useState<string | undefined>();

  const setContractInfo = (contractInfo: ContractInfo) => {
    dispatch(setContractInfoAction(contractInfo));
  };

  const setUserInfo = (userInfo: UserInfo) => {
    dispatch(setUserInfoAction(userInfo));
  };

  useEffect(() => {
    dispatch(initialize());
  }, []);

  const decrementMintAmount = () => {
    setMintAmount(Math.max(mintAmount - 1, 1));
  };

  const incrementMintAmount = () => {
    setMintAmount(
      Math.min(
        mintAmount + 1,
        (contractInfo?.maxMintPerWallet ?? 0) - (userInfo?.numberMinted2 ?? 0)
      )
    );
  };

  const connectWalletPressed = () => {
    dispatch(connectWallet());
  };

  const mintClicked = async () => {
    if (
      contractInfo === undefined ||
      connection === undefined ||
      userInfo === undefined
    ) {
      return;
    }
    try {
      const tx = await mint(
        connection.address,
        mintAmount,
        contractInfo,
        userInfo.signature
      );
      setMintTx(tx);
      setMintStatus(MintStatus.TX_PENDING);
    } catch (error) {
      if (error instanceof Error) {
        setErrorMessage(error.message);
      }
    }
  };

  useEffect(() => {
    if (mintTx === undefined) {
      return;
    }
    const dispatchListen = async () => {
      try {
        const status = await listen(mintTx);
        setMintStatus(status);
      } catch (error) {
        if (error instanceof Error) {
          setErrorMessage(error.message);
          setMintStatus(MintStatus.ERROR);
        }
      }
    };
    dispatchListen();
  }, [mintTx]);

  useEffect(() => {
    const dispatchRefresh = async () => {
      if (mintStatus == MintStatus.COMPLETE) {
        const newContractInfo = await getContractInfo();
        setContractInfo(newContractInfo);
        const userInfo = await getUserInfo(
          connection?.address ?? "",
          newContractInfo
        );
        setUserInfo(userInfo);
      }
    };
    dispatchRefresh();
  }, [mintStatus]);

  const validUser = () => {
    return connection?.address && userInfo?.signature;
  };

  const canMintMore = () => {
    return (
      (userInfo?.numberMinted2 ?? 0) < (contractInfo?.maxMintPerWallet ?? 0)
    );
  };

  const isSoldOut = () => {
    if (contractInfo === undefined) {
      return false;
    }
    return contractInfo.totalMinted >= contractInfo.maxTokens;
  };

  const isActiveSale = () => {
    if (contractInfo === undefined) {
      return false;
    }
    return !contractInfo.paused;
  };

  return (
    <div className="bg-gray-800 mt-8" id="Mint Pass">
      <div className="max-w-5xl mx-auto py-16 px-4 sm:py-24 sm:px-6 lg:px-8 lg:flex lg:justify-between">
        <div className="max-w-xl">
          <h2 className="text-4xl font-extrabold text-white sm:text-5xl sm:tracking-tight lg:text-6xl">
            Mint Pass #2
          </h2>

          <div className="mt-4 text-xl text-gray-400">
            <div className="flex flex-col gap-2">
              {isActiveSale() ? (
                <p className="text-2xl text-emerald-500">
                  {contractInfo?.totalMinted}/100 Minted
                </p>
              ) : (
                ""
              )}
              <p className="text-2xl text-emerald-500">
                {contractInfo?.mintPriceString}Ξ
              </p>
              <p className="text-lg">Max 4 per wallet</p>
              <p className="text-lg">MAYC/BAYC Exclusive</p>
            </div>

            {isSoldOut() ? (
              <div className="mt-12 flex font-semibold flex-col gap-2 text-sky-700">
                <div className="text-6xl">Sold Out!</div>
                <span>Buy Mint Pass #2</span>
                <a
                  href="https://opensea.io/collection/surreal-mint-pass"
                  target="_blank"
                  className={classNames("py-2 rounded-md text-sm font-medium")}
                  aria-current={"page"}
                >
                  <div className="flex items-center text-sm">
                    <img
                      className="flex-shrink-0 mr-1.5 h-5 w-5"
                      aria-hidden="true"
                      src={opensea}
                    />
                    Open Sea
                  </div>
                </a>
              </div>
            ) : isActiveSale() ? (
              <div>
                <div className="flex flex-col gap-2 mt-8">
                  {validUser() && canMintMore() ? (
                    <>
                      <h1 className="text-2xl font-medium">How many?</h1>
                      <h1 className="text-2xl">{mintAmount}</h1>
                      <div className="max-w-sm">
                        <span className="relative z-0 inline-flex shadow-sm rounded-md">
                          <button
                            type="button"
                            className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-teal-100"
                            onClick={decrementMintAmount}
                          >
                            <span className="sr-only">Less</span>
                            <MinusIcon className="h-5 w-5" aria-hidden="true" />
                          </button>
                          <button
                            type="button"
                            className="-ml-px relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-teal-100"
                            onClick={incrementMintAmount}
                          >
                            <span className="sr-only">More</span>
                            <PlusIcon className="h-5 w-5" aria-hidden="true" />
                          </button>
                        </span>
                      </div>
                    </>
                  ) : (
                    ""
                  )}
                </div>

                <div className="mt-2 max-w-sm">
                  {mintStatus === MintStatus.TX_PENDING ? (
                    <div className="flex flex-col gap-2">
                      <h1 className="text-xl mt-4">
                        Your{" "}
                        <a
                          className="text-green-400"
                          href={"https://etherscan.io/tx/" + mintTx}
                          target="_blank"
                          rel="noreferrer"
                        >
                          transaction
                        </a>{" "}
                        is pending
                      </h1>
                      <Loader />
                    </div>
                  ) : (validUser() && canMintMore()) ||
                    connection === undefined ? (
                    <button
                      onClick={validUser() ? mintClicked : connectWalletPressed}
                    >
                      <div className="hover:bg-emerald-400 text-white bg-emerald-600 text-xs bg-secondary text-contrast py-3 px-6 w-52 rounded-lg shadow-sm text-center">
                        <h1 className="text-lg font-bold">
                          {connection?.address !== undefined
                            ? "Mint"
                            : "Connect Wallet"}
                        </h1>
                      </div>
                    </button>
                  ) : validUser() && !canMintMore() ? (
                    <h1 className="text-emerald-300">
                      You've minted all {contractInfo?.maxMintPerWallet ?? 0} of
                      your NFTs!
                    </h1>
                  ) : (
                    <>
                      <h1 className="text-emerald-500 font-semibold">
                        Mint Pass #2 is MAYC/BAYC exclusive
                      </h1>
                      <h1 className="text-emerald-600 mt-2">
                        In the future, we may open up minting to other
                        collections
                      </h1>
                    </>
                  )}
                  {mintStatus === MintStatus.COMPLETE ? (
                    <h1 className="text-xl mt-4">
                      Your mint{" "}
                      <a
                        className="text-green-400"
                        href={"https://etherscan.io/tx/" + mintTx}
                        target="_blank"
                        rel="noreferrer"
                      >
                        transaction
                      </a>{" "}
                      was successful!
                    </h1>
                  ) : (
                    ""
                  )}
                </div>
                <div className="flex flex-col gap-0 mt-6">
                  {validUser() ? (
                    <>
                      <p className="text-xl text-emerald-800">
                        {connection?.address.substring(0, 5) +
                          "..." +
                          connection?.address.substring(
                            38,
                            connection.address.length
                          )}{" "}
                      </p>
                      <p className="text-xl text-emerald-800">
                        {userInfo?.numberMinted2 ?? 0}/4 Minted
                      </p>
                      {errorMessage ? (
                        <p className="text-xl text-red-700">
                          {errorMessage.substring(
                            0,
                            errorMessage.indexOf("(") > -1
                              ? errorMessage.indexOf("(")
                              : errorMessage.length
                          )}
                        </p>
                      ) : (
                        ""
                      )}
                    </>
                  ) : (
                    ""
                  )}
                </div>
              </div>
            ) : (
              <div className="mt-12">
                <h1 className="font-semibold text-emerald-500 text-4xl">
                  1/7/22 12pm CST
                </h1>
              </div>
            )}
            <div className="max-w-sm">
              <a
                href="https://etherscan.io/address/0x18d0e051317e04ae96314c372bd35220460eec62"
                target="_blank"
              >
                <div className="hover:bg-gray-600 text-blue-400 bg-gray-700 text-xs bg-secondary text-contrast py-3 px-1 rounded-lg shadow-sm text-center mt-16">
                  <p>ERC1155 Verified Smart Contract</p>
                  <p className="text-blue-400 font-bold">
                    0x18d0e051...220460eec62
                  </p>
                </div>
              </a>
            </div>
          </div>
        </div>
        <div className="mt-10 w-full max-w-md">
          <div className="mt-1.5 relative">
            <video src={mintpass} autoPlay muted loop></video>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Mintpass;
