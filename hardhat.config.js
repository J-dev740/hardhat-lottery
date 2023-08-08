require("@nomicfoundation/hardhat-toolbox");
// require("@nomiclabs/hardhat-etherscan")
require("hardhat-deploy")
require("chai")
// require("@nomicfoundation/hardhat-network-helpers")
require("solidity-coverage")
require("hardhat-gas-reporter")
require("hardhat-contract-sizer")
require("dotenv").config()

const RPC_URL=process.env.RPC_URL
const PRIVATE_KEY=process.env.PRIVATE_KEY

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  defaultNetwork:"hardhat",
  networks:{
    hardhat:{},
    sepolia:{
      url:RPC_URL,
      chainId:11155111,
      accounts:[PRIVATE_KEY,],
      BlockConfirmations:2,
    },
    localhost:{
      url:"http://127.0.0.1:8545/",
      chainId:31337,
      //accounts:[] is not  req as hardhat automatically locates its private key from the node that we are running locally


    },


  },
  namedAccounts:{
    deployer:{
      default:0
    },
    player:{
      default:1
    }
  },
  solidity: "0.8.7",
  mocha:{
    timeout:400000,
  },
};
