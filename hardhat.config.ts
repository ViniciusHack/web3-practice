import "@nomicfoundation/hardhat-toolbox-viem";
import dotenv from "dotenv";
import type { HardhatUserConfig } from "hardhat/config";

dotenv.config();

const config: HardhatUserConfig = {
  solidity: "0.8.28",
  networks: {
    // hardhat: {
    //   chainId: 1337 // This ensures a consistent chainId for local development
    // },
    sepolia: {
      url: `https://eth-sepolia.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`,
      accounts: [process.env.PRIVATE_KEY!]
    }
  }
};

export default config;
