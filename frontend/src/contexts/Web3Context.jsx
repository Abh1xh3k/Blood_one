import React, { createContext, useContext, useState, useEffect } from 'react';
import { ethers } from 'ethers';
import toast from 'react-hot-toast';

const Web3Context = createContext();

export const useWeb3 = () => useContext(Web3Context);

export const Web3Provider = ({ children }) => {
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [account, setAccount] = useState(null);
  const [contract, setContract] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);

  const contractAddress = import.meta.env.VITE_CONTRACT_ADDRESS || "0x0000000000000000000000000000000000000000";
  
  const ROLES = {
    ADMIN: ethers.ZeroHash,
    BLOOD_BANK: ethers.id("BLOOD_BANK_ROLE"),
    HOSPITAL: ethers.id("HOSPITAL_ROLE")
  };

  const contractABI = [
    {
      "inputs": [{ "internalType": "address", "name": "defaultAdmin", "type": "address" }],
      "name": "initialize",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "anonymous": false,
      "inputs": [
        { "indexed": false, "internalType": "string", "name": "trackingId", "type": "string" },
        { "indexed": true, "internalType": "bytes32", "name": "donorHash", "type": "bytes32" },
        { "indexed": false, "internalType": "string", "name": "bloodGroup", "type": "string" },
        { "indexed": false, "internalType": "uint32", "name": "timestamp", "type": "uint32" }
      ],
      "name": "PacketRegistered",
      "type": "event"
    },
    {
      "inputs": [
        { "internalType": "bytes32", "name": "_donorHash", "type": "bytes32" }
      ],
      "name": "getPacketByDonor",
      "outputs": [
        {
          "components": [
            { "internalType": "string", "name": "trackingId", "type": "string" },
            { "internalType": "bytes32", "name": "donorHash", "type": "bytes32" },
            { "internalType": "string", "name": "bloodGroup", "type": "string" },
            { "internalType": "string", "name": "location", "type": "string" },
            { "internalType": "string", "name": "organization", "type": "string" },
            { "internalType": "string", "name": "metadataCID", "type": "string" },
            { "internalType": "uint8", "name": "status", "type": "uint8" },
            { "internalType": "uint32", "name": "timestamp", "type": "uint32" }
          ],
          "internalType": "struct BloodSupplyChain.BloodPacket",
          "name": "",
          "type": "tuple"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [{ "internalType": "string", "name": "_trackingId", "type": "string" }],
      "name": "getPacketDetails",
      "outputs": [
        {
          "components": [
            { "internalType": "string", "name": "trackingId", "type": "string" },
            { "internalType": "bytes32", "name": "donorHash", "type": "bytes32" },
            { "internalType": "string", "name": "bloodGroup", "type": "string" },
            { "internalType": "string", "name": "location", "type": "string" },
            { "internalType": "string", "name": "organization", "type": "string" },
            { "internalType": "string", "name": "metadataCID", "type": "string" },
            { "internalType": "uint8", "name": "status", "type": "uint8" },
            { "internalType": "uint32", "name": "timestamp", "type": "uint32" }
          ],
          "internalType": "struct BloodSupplyChain.BloodPacket",
          "name": "",
          "type": "tuple"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        { "internalType": "string", "name": "_trackingId", "type": "string" },
        { "internalType": "bytes32", "name": "_donorHash", "type": "bytes32" },
        { "internalType": "string", "name": "_bloodGroup", "type": "string" },
        { "internalType": "string", "name": "_location", "type": "string" },
        { "internalType": "string", "name": "_organization", "type": "string" },
        { "internalType": "string", "name": "_metadataCID", "type": "string" }
      ],
      "name": "registerPacket",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        { "internalType": "string", "name": "_trackingId", "type": "string" },
        { "internalType": "string", "name": "_location", "type": "string" },
        { "internalType": "string", "name": "_organization", "type": "string" },
        { "internalType": "uint8", "name": "_status", "type": "uint8" }
      ],
      "name": "updateLogistics",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        { "internalType": "bytes32", "name": "role", "type": "bytes32" },
        { "internalType": "address", "name": "account", "type": "address" }
      ],
      "name": "hasRole",
      "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }],
      "stateMutability": "view",
      "type": "function"
    }
  ];

  const hashAadhaar = (aadhaar) => {
    const salt = "LifeChain_Secure_Salt_2026";
    return ethers.keccak256(ethers.toUtf8Bytes(aadhaar + salt));
  };

  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        setIsConnecting(true);
        const currentChainId = await window.ethereum.request({ method: 'eth_chainId' });
        if (currentChainId !== '0xaa36a7') {
          try {
            await window.ethereum.request({
              method: 'wallet_switchEthereumChain',
              params: [{ chainId: '0xaa36a7' }],
            });
          } catch (switchError) {
            toast.error("Please switch to Sepolia Testnet.");
            setIsConnecting(false);
            return;
          }
        }

        const web3Provider = new ethers.BrowserProvider(window.ethereum);
        const accounts = await web3Provider.send("eth_requestAccounts", []);
        const web3Signer = await web3Provider.getSigner();
        const bloodChainContract = new ethers.Contract(contractAddress, contractABI, web3Signer);

        setProvider(web3Provider);
        setSigner(web3Signer);
        setAccount(accounts[0]);
        setContract(bloodChainContract);
        setIsConnecting(false);
      } catch (error) {
        console.error("Error connecting wallet", error);
        toast.error("Connection failed.");
        setIsConnecting(false);
      }
    } else {
      toast.error("Install MetaMask.");
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
      provider, signer, account, contract, isConnecting, connectWallet, hashAadhaar, ROLES
    }}>
      {children}
    </Web3Context.Provider>
  );
};
