import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import ErrorAlert, { ErrorAlertProps } from "../components/alerts/ErrorAlert";
import InfoAlert from "../components/alerts/InfoAlert";
import { uploadImagetoIPFS } from "../services/upload";
import {
  listen,
  MintStatus,
  requestAuthHeaders,
  reveal,
  SurrealMetadata,
} from "../services/wallet";
import gerry from "./../images/gerry.png";

interface Props {}

const Admin = (props: Props) => {
  const [imageFile, setImageFile] = useState<File | undefined | null>();
  const [collection, setCollection] = useState<string | undefined>();
  const [collectionTokenNumber, setCollectionTokenNumber] = useState<
    string | undefined
  >();
  const [surrealTokenNumber, setSurrealTokenNumber] = useState<
    string | undefined
  >();
  const [fileURL, setFileURL] = useState<string | undefined>();
  const [revealTx, setRevealTx] = useState<string | undefined>();

  const [errorAlertMessages, setErrorAlertMessages] = useState<
    Array<string> | undefined
  >();

  const [revealTxState, setRevealTxState] = useState<MintStatus>(
    MintStatus.NONE
  );

  const [metadataHash, setMetadataHash] = useState<string | undefined>();

  const saveClicked = () => {
    setMetadataHash(undefined);
    setRevealTx(undefined);
    setRevealTxState(MintStatus.NONE);
    setErrorAlertMessages(undefined);

    const dispatchSave = async () => {
      if (
        imageFile &&
        collection &&
        collectionTokenNumber &&
        surrealTokenNumber
      ) {
        const headers = await requestAuthHeaders();
        const metadata = (
          await uploadImagetoIPFS(
            headers,
            { collection, collectionTokenNumber, surrealTokenNumber },
            imageFile
          )
        ).data as SurrealMetadata;
        setMetadataHash(metadata.uri);
        const tx = await reveal(metadata, surrealTokenNumber);
        setRevealTxState(MintStatus.TX_PENDING);
        setRevealTx(tx);
      } else {
        let messages: Array<string> = [];
        if (imageFile === undefined) {
          messages.push("Image not selected");
        }
        if (collection === undefined) {
          messages.push("Must specify original collection.");
        }
        if (collectionTokenNumber === undefined) {
          messages.push("Must specify original collection token number.");
        }
        if (surrealTokenNumber === undefined) {
          messages.push("Must specify surreal token number to reveal.");
        }
        setErrorAlertMessages(messages);
      }
    };
    dispatchSave();
  };

  useEffect(() => {
    const dispatchListen = async () => {
      if (revealTx) {
        try {
          const status = await listen(revealTx);
          setRevealTxState(status);
        } catch (error) {
          console.error(error);
          setRevealTxState(MintStatus.ERROR);
          setErrorAlertMessages(["Failed to reveal token. See tx " + revealTx]);
        }
      }
    };
    dispatchListen();
  }, [revealTx]);

  useEffect(() => {
    if (revealTxState === MintStatus.COMPLETE) {
      setImageFile(undefined);
      setFileURL(undefined);
      setCollection(undefined);
      setCollectionTokenNumber(undefined);
      setSurrealTokenNumber(undefined);
    }
  }, [revealTxState]);

  useEffect(() => {
    if (imageFile) {
      setFileURL(URL.createObjectURL(imageFile));
    } else {
      setFileURL(undefined);
    }
  }, [imageFile]);
  return (
    <>
      <div className="bg-gray-800 mt-8" id="Admin">
        <div className="max-w-6xl mx-auto py-16 px-4 sm:py-24 sm:px-6 lg:px-8 lg:flex lg:justify-between">
          <div className="max-w-md">
            <h2 className="text-4xl font-extrabold text-white sm:text-5xl sm:tracking-tight lg:text-6xl">
              Gerry's Admin Tool
            </h2>
            <div className="mt-1.5 lg:mt-24">
              <img src={gerry} />
            </div>
          </div>
          <div className="mt-1 w-full max-w-lg">
            <div className="mt-24">
              <div className="shadow sm:rounded-md sm:overflow-hidden">
                <div className="px-4 py-5 bg-white space-y-6 sm:p-6">
                  <h1 className="text-4xl font-medium">Reveal Token</h1>
                  {errorAlertMessages ? (
                    <ErrorAlert messages={errorAlertMessages}></ErrorAlert>
                  ) : (
                    ""
                  )}
                  {revealTxState === MintStatus.TX_PENDING &&
                  revealTx !== undefined ? (
                    <InfoAlert
                      title="Loading"
                      message={"Reveal tx loading"}
                      link={"https://etherscan.io/tx/" + revealTx}
                    />
                  ) : (
                    ""
                  )}
                  {revealTxState === MintStatus.COMPLETE ? (
                    <InfoAlert
                      title="Complete"
                      message={"Reveal tx complete."}
                      link={"https://etherscan.io/tx/" + revealTx}
                    />
                  ) : (
                    ""
                  )}
                  <div className="grid grid-cols-3 gap-6">
                    <div className="col-span-3 sm:col-span-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Surreal Token Number
                      </label>
                      <div className="mt-1 flex rounded-md shadow-sm">
                        <input
                          type="number"
                          className="focus:ring-indigo-500 focus:border-indigo-500 flex-1 block w-full rounded-none rounded-r-md sm:text-sm border-gray-300"
                          placeholder="0"
                          value={surrealTokenNumber ?? 0}
                          onChange={(event) => {
                            setSurrealTokenNumber(event.target.value);
                          }}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-6">
                    <div className="col-span-3 sm:col-span-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Collection
                      </label>
                      <div className="mt-1 flex rounded-md shadow-sm">
                        <input
                          type="text"
                          className="focus:ring-indigo-500 focus:border-indigo-500 flex-1 block w-full rounded-none rounded-r-md sm:text-sm border-gray-300"
                          placeholder="MAYC"
                          value={collection ?? ""}
                          onChange={(event) => {
                            setCollection(event.target.value);
                          }}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-6">
                    <div className="col-span-3 sm:col-span-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Original Ape Number
                      </label>
                      <div className="mt-1 flex rounded-md shadow-sm">
                        <input
                          type="number"
                          className="focus:ring-indigo-500 focus:border-indigo-500 flex-1 block w-full rounded-none rounded-r-md sm:text-sm border-gray-300"
                          placeholder="13202"
                          value={collectionTokenNumber ?? ""}
                          onChange={(event) => {
                            setCollectionTokenNumber(event.target.value);
                          }}
                        />
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Image
                    </label>
                    <div className="mb-4 mt-2 relative">
                      <div className="z-0">
                        <img src={fileURL} alt="" />
                      </div>
                    </div>
                    {fileURL ? (
                      <></>
                    ) : (
                      <>
                        <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                          <div className="space-y-1 text-center">
                            <svg
                              className="mx-auto h-12 w-12 text-gray-400"
                              stroke="currentColor"
                              fill="none"
                              viewBox="0 0 48 48"
                              aria-hidden="true"
                            >
                              <path
                                d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                                strokeWidth={2}
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                            <div className="flex text-sm text-gray-600">
                              <label
                                htmlFor="file-upload"
                                className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500"
                              >
                                <span>Upload a file</span>
                                <input
                                  id="file-upload"
                                  name="file-upload"
                                  type="file"
                                  onChange={(event) => {
                                    setImageFile(event.target.files?.item(0));
                                  }}
                                  className="sr-only"
                                />
                              </label>
                              <p className="pl-1">or drag and drop</p>
                            </div>
                            <p className="text-xs text-gray-500">
                              PNG, JPG, GIF up to 10MB
                            </p>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
                {fileURL ? (
                  <div className="px-4 py-3 bg-gray-50 text-right sm:px-6">
                    <label
                      htmlFor="file-upload"
                      className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500"
                    >
                      <span>Replace</span>
                      <input
                        id="file-upload"
                        name="file-upload"
                        type="file"
                        onChange={(event) => {
                          setImageFile(event.target.files?.item(0));
                        }}
                        className="sr-only"
                      />
                    </label>
                    <button
                      type="submit"
                      className="ml-4 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
                      onClick={saveClicked}
                    >
                      Reveal
                    </button>
                  </div>
                ) : (
                  <h1 className="font-bold text-indigo-600 mt-8">
                    {metadataHash}
                  </h1>
                )}
                {/* {metadataHash ? <h1>{metadataHash}</h1> : ""} */}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Admin;
