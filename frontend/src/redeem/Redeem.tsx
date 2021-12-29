import apes from "./../images/apes.gif";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../app/store";
import { useEffect, useState } from "react";
import {
  BasicSignature,
  MintStatus,
  requestAuthHeaders,
} from "../services/wallet";
import { connectWallet, selectCollection } from "../store/wallet/walletSlice";
import {
  DropdownItem,
  SimpleDropdown,
} from "../components/dropdowns/SimpleDropdown";
import { collections } from "../services/wallet";
import Loader from "../components/loader/Loader";
import {
  SimpleStep,
  Step,
  StepStatus,
} from "../components/simplestep/SimpleStep";

enum ClaimState {
  NONE,
  SIGNING,
  CLAIMING,
  WAITING,
  ERROR,
  DONE,
}

const claimSteps: Array<Step> = [
  {
    id: "Sign Message",
    name: "Send selection to our backend",
    status: StepStatus.current,
  },
  {
    id: "Perform Transaction",
    name: "Burn your mint pass",
    status: StepStatus.upcoming,
  },
  {
    id: "Wait",
    name: "Wait for confirmation",
    status: StepStatus.upcoming,
  },
  {
    id: "Done",
    name: "Keep an eye on discord #reveal-alerts",
    status: StepStatus.upcoming,
  },
];

const getStepsForState = (claimState: ClaimState) => {
  switch (claimState) {
    case ClaimState.NONE:
      return [];
    case ClaimState.SIGNING:
      return [
        { ...claimSteps[0], status: StepStatus.current },
        { ...claimSteps[1], status: StepStatus.upcoming },
        { ...claimSteps[2], status: StepStatus.upcoming },
        { ...claimSteps[3], status: StepStatus.upcoming },
      ];
    case ClaimState.CLAIMING:
      return [
        { ...claimSteps[0], status: StepStatus.complete },
        { ...claimSteps[1], status: StepStatus.current },
        { ...claimSteps[2], status: StepStatus.upcoming },
        { ...claimSteps[3], status: StepStatus.upcoming },
      ];
    case ClaimState.WAITING:
      return [
        { ...claimSteps[0], status: StepStatus.complete },
        { ...claimSteps[1], status: StepStatus.complete },
        { ...claimSteps[2], status: StepStatus.current },
        { ...claimSteps[3], status: StepStatus.upcoming },
      ];
    case ClaimState.DONE:
      return [
        { ...claimSteps[0], status: StepStatus.complete },
        { ...claimSteps[1], status: StepStatus.complete },
        { ...claimSteps[2], status: StepStatus.complete },
        { ...claimSteps[3], status: StepStatus.current },
      ];
    default:
      return [];
  }
};

const Redeem = () => {
  const dispatch = useDispatch();
  const [claimState, setClaimState] = useState(ClaimState.NONE);
  const [signature, setSignature] = useState<BasicSignature | undefined>();

  const resetState = () => {
    setClaimState(ClaimState.NONE);
  };

  const claimWindowOpen = () => {
    return contractInfo?.claimsEnabled ?? false;
  };

  const { userInfo, connection, isLoadingCollection, contractInfo } =
    useSelector((state: RootState) => state.wallet);

  const [collection, setCollection] = useState(collections[0]);

  const onSelect = (item: DropdownItem) => {
    setCollection({
      name: item.value,
      address: item.key,
    });
  };

  useEffect(() => {
    // dispatch(selectCollection(collection));
  }, [collection]);

  const canBurn = () => {
    return userInfo?.numberMinted ?? 0 > 0;
  };
  const connectWalletPressed = () => {
    dispatch(connectWallet());
  };

  const requestSignature = () => {
    const dispatchRequestSignature = async () => {
      try {
        const signature = await requestAuthHeaders();
        setSignature(signature);
      } catch (error) {
        setClaimState(ClaimState.ERROR);
      }
    };
    dispatchRequestSignature();
  };

  return (
    <div className="bg-gray-800 mt-8" id="Redeem">
      <div className="max-w-5xl mx-auto py-16 px-4 sm:py-24 sm:px-6 lg:px-8 lg:flex lg:justify-between">
        <div className="max-w-xl">
          <div className="mt-1.5 relative">
            <img src={apes} />
          </div>
        </div>
        <div className="mt-1 w-full max-w-xs">
          <h2 className="text-4xl font-extrabold text-white sm:text-5xl sm:tracking-tight lg:text-6xl mt-8">
            SURREAL APES
          </h2>
          {claimState == ClaimState.NONE ? (
            <h2 className="text-xl font-medium text-white sm:text-xl sm:tracking-tight lg:text-xl mt-4">
              Choose your ape
            </h2>
          ) : claimState !== ClaimState.DONE ? (
            <Loader className="mt-6" />
          ) : claimState == ClaimState.DONE ? (
            <button onClick={resetState}>
              <div className="hover:bg-emerald-400 text-white bg-emerald-600 text-xs bg-secondary text-contrast py-3 px-6 w-52 rounded-lg shadow-sm text-center mt-4">
                <h1 className="text-lg font-bold">Claim Additional</h1>
              </div>
            </button>
          ) : (
            ""
          )}
          <div className="text-xl text-gray-400">
            {canBurn() && claimWindowOpen() ? (
              <div className="flex flex-col gap-4">
                {claimState == ClaimState.NONE ? (
                  <div className="flex flex-row gap-4 mt-4">
                    <SimpleDropdown
                      onSelect={onSelect}
                      items={collections.map((item) => {
                        return { value: item.name, key: item.address };
                      })}
                      title="Collection"
                      className="w-40"
                    ></SimpleDropdown>
                    {isLoadingCollection ? (
                      <Loader className="mt-7 ml-8" />
                    ) : (userInfo?.ownedCollectionTokens ?? []).length > 0 ? (
                      <SimpleDropdown
                        onSelect={onSelect}
                        items={
                          userInfo?.ownedCollectionTokens.map((item) => {
                            return { value: item.tokenId, key: item.tokenId };
                          }) ?? []
                        }
                        title="Token"
                        className="w-40"
                      ></SimpleDropdown>
                    ) : (
                      <div className="mt-7 text-xl font-medium">None Owned</div>
                    )}
                  </div>
                ) : (
                  ""
                )}

                {(userInfo?.ownedCollectionTokens ?? []).length > 0 &&
                !isLoadingCollection &&
                claimState == ClaimState.NONE ? (
                  <>
                    <h2 className="text-xl font-medium text-white sm:text-xl sm:tracking-tight lg:text-xl mt-4">
                      Burn your mint pass
                    </h2>
                    <SimpleDropdown
                      onSelect={onSelect}
                      items={
                        userInfo?.userOwnedEditions.map((item) => {
                          return {
                            value: item.tokenId.toString(),
                            key: item.tokenId.toString(),
                          };
                        }) ?? []
                      }
                      title="Mint Pass Edition"
                      className="w-40"
                    ></SimpleDropdown>
                    {claimState === ClaimState.NONE ||
                    claimState === ClaimState.ERROR ? (
                      <button>
                        <div className="hover:bg-emerald-400 text-white bg-emerald-600 text-xs bg-secondary text-contrast py-3 px-6 w-52 rounded-lg shadow-sm text-center mt-4">
                          <h1 className="text-lg font-bold">Claim Surreal</h1>
                        </div>
                      </button>
                    ) : (
                      ""
                    )}
                  </>
                ) : (
                  ""
                )}
              </div>
            ) : (
              <div>
                <div className="mt-8 flex flex-col gap-4">
                  <div>Burn your Mint Pass</div>
                  <div>Choose your BAYC/MAYC</div>
                  <div>Redeem matching SURREAL APE</div>
                </div>
                {connection && claimWindowOpen() ? (
                  <div className="mt-8 text-2xl font-bold">
                    The connected wallet has no available mint passes.
                  </div>
                ) : claimWindowOpen() ? (
                  <button className="mt-8" onClick={connectWalletPressed}>
                    <div className="hover:bg-emerald-400 text-white bg-emerald-600 text-xs bg-secondary text-contrast py-3 px-6 w-52 rounded-lg shadow-sm text-center">
                      <h1 className="text-lg font-bold">Connect Wallet</h1>
                    </div>
                  </button>
                ) : (
                  <h1 className="mt-8 font-extrabold text-emerald-400">
                    Redeeming Soon
                  </h1>
                )}
              </div>
            )}

            <a
              href="https://etherscan.io/address/0xbc4aee331e970f6e7a5e91f7b911bdbfdf928a98"
              target="_blank"
            >
              <div className="mt-8 hover:bg-gray-600 text-blue-400 bg-gray-700 text-xs bg-secondary text-contrast py-3 px-1 rounded-lg shadow-sm text-center">
                <p>ERC721 Verified Smart Contract</p>
                <p className="text-blue-400 font-bold">
                  0xbc4aee33...dbfdf928a98
                </p>
              </div>
            </a>
          </div>
        </div>
      </div>
      <div className="text-white px-16 pb-10">
        {claimState !== ClaimState.ERROR && claimState !== ClaimState.NONE ? (
          <SimpleStep steps={getStepsForState(claimState)}></SimpleStep>
        ) : (
          ""
        )}
        {claimState === ClaimState.ERROR
          ? //Show some error
            ""
          : ""}
        {claimState === ClaimState.DONE ? "" : ""}
      </div>
    </div>
  );
};

export default Redeem;
