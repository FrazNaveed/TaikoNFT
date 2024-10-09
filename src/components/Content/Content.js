import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import HashLoader from "react-spinners/HashLoader";
import {
  getNftContractInstance,
  getSwContractInstance,
  getEpContractInstance,
} from "../../contractUtils/contractInstances";
import "./Content.css";
const Content = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState("");
  const [nftBalance, setNftBalance] = useState("loading...");
  const [isLoading, setIsLoading] = useState(false);

  const showTransactionNotification = (txHash) => {
    const explorerUrl = `https://explorer.hekla.taiko.xyz/tx/${txHash}`;
    toast(
      <>
        🚀 Transaction submitted! <br />
        <a
          href={explorerUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="toast-link"
        >
          View on Block Explorer
        </a>
      </>,
      {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "light",
      }
    );
  };

  function signUserOp(userOpHash, signer) {
    const msg1 = ethers.utils.solidityKeccak256(
      ["string", "bytes32"],
      ["\x19Ethereum Signed Message:\n32", userOpHash]
    );
    const signature = signer.signMessage(ethers.utils.arrayify(userOpHash));
    return signature;
  }

  const mint = async () => {
    try {
      setIsLoading(true);
      const paymasterAddress = "0x00DB2a4A5344FcFA058A7C461e75251cfc597C4c";
      const swInstance = await getSwContractInstance();
      const nftInstance = await getNftContractInstance();
      const epInstance = await getEpContractInstance();
      const nonce = await swInstance.nonce();
      const callData = swInstance.interface.encodeFunctionData(
        "executeFromEntryPoint",
        [
          nftInstance.address,
          0,
          nftInstance.interface.encodeFunctionData("mintNFT", [walletAddress]),
        ]
      );

      // const provider = new ethers.providers.JsonRpcProvider(
      //   process.env.REACT_APP_RPC_URL
      // );
      // const { maxFeePerGas, maxPriorityFeePerGas } =
      //   await provider.getFeeData();

      const UserOp = {
        sender: swInstance.address,
        nonce: nonce,
        initCode: "0x",
        callData: callData,
        callGasLimit: ethers.BigNumber.from("2000000"),
        verificationGasLimit: ethers.BigNumber.from("3000000"),
        preVerificationGas: ethers.BigNumber.from("1000000"),
        maxFeePerGas: ethers.BigNumber.from("40000000000"),
        maxPriorityFeePerGas: ethers.BigNumber.from("40000000000"),
        paymasterAndData: "0x",
        signature: "0x",
      };

      UserOp.paymasterAndData = ethers.utils.solidityPack(
        ["address"],
        [paymasterAddress]
      );
      const userOpHash = await epInstance.getUserOpHash(UserOp);
      const randomWallet = ethers.Wallet.createRandom();
      const signature = await signUserOp(userOpHash, randomWallet);
      UserOp.signature = signature;
      const userOps = [UserOp];
      console.log("sending the txn");
      const txn = await epInstance.handleOps(userOps, walletAddress);
      toast("⏳ Txn submitted. Waiting for confirmation");
      await txn.wait();
      console.log(txn);
      showTransactionNotification(txn.hash);
    } catch (error) {
      toast("😐 Error sending the txn");
      console.error("Error interacting with contracts:", error);
    } finally {
      setIsLoading(false);
      await fetchBalance(walletAddress);
    }
  };

  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        const accounts = await window.ethereum.request({
          method: "eth_requestAccounts",
        });
        const walletAddress = accounts[0];
        setWalletAddress(walletAddress);
        setIsConnected(true);
        await fetchBalance(walletAddress);
      } catch (err) {
        console.error("Error connecting to MetaMask:", err);
      }
    } else {
      alert("Please install MetaMask to use this feature!");
    }
  };

  useEffect(() => {
    const handleAccountsChanged = async (accounts) => {
      if (accounts.length === 0) {
        setWalletAddress(null);
        setIsConnected(false);
        setNftBalance(null);
        console.log("MetaMask is locked or disconnected.");
      } else {
        const newAddress = accounts[0];
        setWalletAddress(newAddress);
        await fetchBalance(newAddress);
        console.log("Account changed:", newAddress);
      }
    };

    const handleDisconnect = () => {
      setWalletAddress(null);
      setIsConnected(false);
      setNftBalance(null);
      console.log("MetaMask disconnected or locked.");
    };

    if (window.ethereum) {
      window.ethereum.on("accountsChanged", handleAccountsChanged);
      window.ethereum.on("disconnect", handleDisconnect);
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener(
          "accountsChanged",
          handleAccountsChanged
        );
        window.ethereum.removeListener("disconnect", handleDisconnect);
      }
    };
  }, []);

  const fetchBalance = async (wallet) => {
    try {
      const nftInstance = await getNftContractInstance();
      const balance = await nftInstance.balanceOf(wallet);
      setNftBalance(balance.toString());
    } catch (err) {
      console.error("Error fetching NFT balance:", err);
    }
  };
  return (
    <div className="parent-container">
      <div className="wallet-container">
        {isConnected ? (
          <>
            <p className="wallet-info">Connected: {walletAddress}</p>
            <p className="wallet-info">NFT Balance: {nftBalance}</p>

            {/* Conditionally show MINT button only when not loading */}
            {!isLoading && (
              <button className="wallet-btn mint-btn" onClick={mint}>
                MINT
              </button>
            )}
          </>
        ) : (
          <button className="wallet-btn connect-btn" onClick={connectWallet}>
            Connect MetaMask
          </button>
        )}

        <ToastContainer />

        {isLoading && (
          <HashLoader
            color={"#da094f"}
            size={50}
            cssOverride={{
              marginTop: "30px",
            }}
          />
        )}
      </div>
    </div>
  );
};

export default Content;
