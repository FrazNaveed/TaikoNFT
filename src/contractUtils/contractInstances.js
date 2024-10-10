import { ethers } from "ethers";
import nftAbi from "./abi/taikonft.json";
import entrypointAbi from "./abi/entryPoint.json";
import smartwalletAbi from "./abi/smartwallet.json";

// List of contract addresses
const entrypointAddress = "0xc8BAe8188F6AD53777Ca7773e588612fea246ded";
const smartwalletAddress = "0xc67f29882d223C029c7f6D9C8453315C025fE0a3";
const nftContractAddress = "0x699F2ed718D9E82079b6d24a06424D5123DCf8c0";

const BUNDLERS_KEY = process.env.REACT_APP_BUNDLERS_KEY;

const createContractInstance = async (contractAddress, abi) => {
  if (!BUNDLERS_KEY) {
    throw new Error("Bundler's key not provided");
  }
  const provider = new ethers.providers.JsonRpcProvider(
    process.env.REACT_APP_RPC_URL
  );
  const wallet = new ethers.Wallet(BUNDLERS_KEY, provider);
  return new ethers.Contract(contractAddress, abi, wallet);
};

// Function to get contract instances
export const getNftContractInstance = () =>
  createContractInstance(nftContractAddress, nftAbi);
export const getEpContractInstance = () =>
  createContractInstance(entrypointAddress, entrypointAbi);
export const getSwContractInstance = () =>
  createContractInstance(smartwalletAddress, smartwalletAbi);
