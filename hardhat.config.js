require("@nomicfoundation/hardhat-toolbox");
require("solidity-coverage");
require("hardhat-deploy");
require("dotenv").config();
// const { INFURA_API_KEY, SEPOLIA_PRIVATE_KEY } = process.env;
/** @type import('hardhat/config').HardhatUserConfig */

module.exports = {
  solidity: {
    compilers: [{
      version: "0.8.18"
    },
    {
      version: "0.4.18"
    }
  ]
  },
  networks:{
    hardhat: {
      forking: {
        url: `https://base-goerli.g.alchemy.com/v2/${process.env.ALCHEMY_KEY}`,
      }
    }
  },
  nameAccounts: {
    deployer: {
      default: 0,
    },
  },
  
};
