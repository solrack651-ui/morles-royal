import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./styles.css";

import { configureChains, createClient, WagmiConfig } from "wagmi";
import { w3mProvider, w3mConnectors } from "@web3modal/ethereum";
import { EthereumClient } from "@web3modal/ethereum";
import { Web3Modal } from "@web3modal/react";

const bscTestnet = {
  id: 97,
  name: "Binance Smart Chain Testnet",
  network: "bsc-testnet",
  nativeCurrency: { decimals: 18, name: "BNB", symbol: "BNB" },
  rpcUrls: {
    default: { http: ["https://data-seed-prebsc-1-s1.binance.org:8545/"] },
    public: { http: ["https://data-seed-prebsc-1-s1.binance.org:8545/"] }
  },
  blockExplorers: {
    default: { name: "BscScan", url: "https://testnet.bscscan.com" }
  }
};

const projectId = import.meta.env.VITE_WC_PROJECT_ID;

const { chains, provider } = configureChains(
  [bscTestnet],
  [
    w3mProvider({ projectId }),
    (config) => ({
      ...config,
      rpcUrl: "https://data-seed-prebsc-1-s1.binance.org:8545/"
    })
  ]
);

const wagmiClient = createClient({
  autoConnect: false,
  connectors: w3mConnectors({ projectId, version: 2, chains }),
  provider
});

const ethereumClient = new EthereumClient(wagmiClient, chains);

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <WagmiConfig client={wagmiClient}>
      <App />
      <Web3Modal projectId={projectId} ethereumClient={ethereumClient} />
    </WagmiConfig>
  </React.StrictMode>
);
