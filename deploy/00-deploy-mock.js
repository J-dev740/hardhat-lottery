const {network,ethers}= require("hardhat")
const {networkConfig,developmentChains}=require("../helper-hardhat-config")
const BASE_FEE=ethers.parseEther("0.25")//0.25 is the premium value since there are no dedicated chainlink nodes to get randomness unlike priceFees mock
const GAS_PRICE_LINK=1e9// it is a calculated value based on eth price ie if price increases then gasPrice also increases so it fluctuates based on the actual price of the eth on chain
//price of req changes based on price of gas 
//chainlink nodes actually pay the gas price to give randomness and do off chain calculations paid in oracle gas (off chain gas)

module.exports=async({getNamedAccounts,deployments})=>{
    const{deploy,log}= deployments
    const accounts = await ethers.getSigners()
    //accounts[0] returns the first object then we have to specify the .address specifically
    const deployer=accounts[0].address
    // const{deployer}=await getNamedAccounts()
    const networkName=network.name
    const args=[BASE_FEE,GAS_PRICE_LINK]
    if(developmentChains.includes(networkName)){
        log("local networks detected!..deploying Mocks\n")
        await deploy("VRFCoordinatorV2Mock",{
            from:deployer,
            args:args,
            log:true,

        })
        log("mocks deployed \n")
        log("--------------------------------------------->")
    }

}

module.exports.tags=["all","mocks"]