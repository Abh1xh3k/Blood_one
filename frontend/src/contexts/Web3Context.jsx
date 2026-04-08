import React, { createContext, useContext, useState, useEffect } from 'react';
import { ethers } from 'ethers';

const Web3Context = createContext();

export const useWeb3 = () => useContext(Web3Context);

export const Web3Provider = ({ children }) => {
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [account, setAccount] = useState(null);
  const [contract, setContract] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);

  // Pulls the contract address centrally from the .env file
  const contractAddress = import.meta.env.VITE_CONTRACT_ADDRESS || "0x0000000000000000000000000000000000000000";
  const contractABI = [
  {
    "inputs": [],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "string",
        "name": "trackingId",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "donorIdentifier",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "bloodGroup",
        "type": "string"
      }
    ],
    "name": "DonorAdded",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "string",
        "name": "trackingId",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "location",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "organization",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "bool",
        "name": "isUsed",
        "type": "bool"
      }
    ],
    "name": "UsageUpdated",
    "type": "event"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "_trackingId",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "_donorIdentifier",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "_bloodGroup",
        "type": "string"
      }
    ],
    "name": "addDonor",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "admin",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "_donorIdentifier",
        "type": "string"
      }
    ],
    "name": "getBloodDetailsByAadhaar",
    "outputs": [
      {
        "internalType": "string",
        "name": "trackingId",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "group",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "location",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "organization",
        "type": "string"
      },
      {
        "internalType": "bool",
        "name": "isUsed",
        "type": "bool"
      },
      {
        "internalType": "uint256",
        "name": "timestamp",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "",
        "type": "string"
      }
    ],
    "name": "trackingIdExists",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "_trackingId",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "_location",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "_organization",
        "type": "string"
      },
      {
        "internalType": "bool",
        "name": "_isUsed",
        "type": "bool"
      }
    ],
    "name": "updateUsage",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];

  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        setIsConnecting(true);
        
        // Enforce Sepolia Network (Chain ID: 11155111 / 0xaa36a7)
        const currentChainId = await window.ethereum.request({ method: 'eth_chainId' });
        if (currentChainId !== '0xaa36a7') {
          try {
            await window.ethereum.request({
              method: 'wallet_switchEthereumChain',
              params: [{ chainId: '0xaa36a7' }],
            });
          } catch (switchError) {
            alert("Please manually switch your MetaMask network to the Sepolia Testnet.");
            setIsConnecting(false);
            return;
          }
        }

        const web3Provider = new ethers.BrowserProvider(window.ethereum);
        const accounts = await web3Provider.send("eth_requestAccounts", []);
        const web3Signer = await web3Provider.getSigner();
        const bloodBankContract = new ethers.Contract(contractAddress, contractABI, web3Signer);

        setProvider(web3Provider);
        setSigner(web3Signer);
        setAccount(accounts[0]);
        setContract(bloodBankContract);
        setIsConnecting(false);
      } catch (error) {
        console.error("Error connecting wallet", error);
        setIsConnecting(false);
      }
    } else {
      alert("Please install MetaMask to use this application.");
    }
  };

  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', (accounts) => {
        if (accounts.length > 0) {
          setAccount(accounts[0]);
        } else {
          setAccount(null);
          setSigner(null);
          setContract(null);
        }
      });
    }
  }, []);

  return (
    <Web3Context.Provider value={{
      provider, signer, account, contract, isConnecting, connectWallet
    }}>
      {children}
    </Web3Context.Provider>
  );
};
