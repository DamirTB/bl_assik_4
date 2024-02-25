const hre = require("hardhat");

async function main() {
  const MyContractFactory = await hre.ethers.getContractFactory("MyToken");
  const contract = await MyContractFactory.deploy("0xD9B9432482110BE33A939d27317Fbb67A4B3E963");
  console.log("My contract " + contract.target)
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
