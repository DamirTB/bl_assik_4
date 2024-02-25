require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.20",
  networks: {
    sepolia: {
      url: `https://eth-sepolia.g.alchemy.com/v2/oGhz0emZQDDHjLYrQ1EEDI1v9usoR2zi`,
      accounts: [process.env.PRIVATE_KEY],
    },
  },  
};
