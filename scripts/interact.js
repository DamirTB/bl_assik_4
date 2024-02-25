const hre = require("hardhat");

const deployedContractAddress = "0x22Ff090471C9D0cbe81F606FCe8E19987469B8BC";
const wallet_add = "0xD9B9432482110BE33A939d27317Fbb67A4B3E963";

async function safeMint(deployedContractAddress, wallet_add, token_id){
  const MyContract = await hre.ethers.getContractFactory("MyToken");
  const contract = await MyContract.attach(deployedContractAddress); 
  const safeMintTx = await contract.safeMint(wallet_add, token_id);
  await safeMintTx.wait();
}

async function balanceOf(deployedContractAddress, wallet_add){
  const MyContract = await hre.ethers.getContractFactory("MyToken");
  const contract = await MyContract.attach(deployedContractAddress); 
  const balance = await contract.balanceOf(wallet_add);
  return balance
}

async function baseURI(deployedContractAddress){
  const MyContract = await hre.ethers.getContractFactory("MyToken");
  const contract = await MyContract.attach(deployedContractAddress); 
  const link = await contract.baseURI();
  return link;
}

// baseURI(deployedContractAddress)
//   .then((link) => {
//     console.log(link);
//   })
//   .catch((error) => {
//     console.error("Error getting balance:", error);
//   });

// balanceOf(deployedContractAddress, wallet_add)
//   .then((balance) => {
//     console.log(`Balance of ${wallet_add}: ${balance.toString()}`);
//   })
//   .catch((error) => {
//     console.error("Error getting balance:", error);
//   });


// safeMint(deployedContractAddress, wallet_add, token_id)
//   .then(() => {
//     console.log("Token minted successfully!");
//   })
//   .catch((error) => {
//     console.error("Error while minting token:", error);
//   });
