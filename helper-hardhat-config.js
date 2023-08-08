const { ethers } = require("hardhat")

const networkConfig={
    11155111:{
        name:"sepolia",
        vrfCoordinatorV2:"0x8103B0A8A00be2DDC778e6e7eaa21791Cd364625",
        entranceFee:`${ethers.parseEther("0.01")}`,
        subscriptionId:"4028",
        callbackGasLimit:"2300000",
        interval:"30",
        gaslane:"0x474e34a077df58807dbe9c96d3c009b23b3c6d0cce433e59bbf5b34f823bc56c"
        //change this Id when you create id in chainlink ui and get and actual Id

    },
    31337:{
        name:"hardhat",
        interval:"30",
        callbackGasLimit:"500000",
        entranceFee:ethers.parseEther("0.01"),
        gaslane:"0x474e34a077df58807dbe9c96d3c009b23b3c6d0cce433e59bbf5b34f823bc56c"
    }

}

const developmentChains=["hardhat","localhost"]
 module.exports={
    networkConfig,
    developmentChains,
 }