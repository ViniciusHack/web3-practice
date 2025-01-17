import hre from 'hardhat';

async function main() {
  const NumberGuessingGame = await hre.viem.deployContract("NumberGuessingGame");

  const address = NumberGuessingGame.address;
  console.log(`NumberGuessingGame deployed to ${address}`);

  // Write the contract address to both .env files
  const fs = require('fs');
  
  // Update frontend .env
  fs.writeFileSync('./frontend/.env', `VITE_CONTRACT_ADDRESS=${address}\nVITE_BACKEND_URL=http://localhost:3001\n`);
  
  // Update backend .env
  fs.writeFileSync('.env', `CONTRACT_ADDRESS=${address}\nETHEREUM_NODE_URL=http://127.0.0.1:8545\n`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});