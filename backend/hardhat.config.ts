import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import * as dotenv from "dotenv";

dotenv.config();

const config: HardhatUserConfig = {
    solidity: "0.8.24",
    networks: {
        hardhat: {
            forking: {
                url: process.env.MAINNET_RPC_URL || "https://eth.llamarpc.com", // Fallback to public RPC
                // blockNumber: 19200000, // Removed to avoid "pruned state" error on free RPCs
            },
            chainId: 1, // Impersonate Mainnet
        },
    },
};

export default config;
