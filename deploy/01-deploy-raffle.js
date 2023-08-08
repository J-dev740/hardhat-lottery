const {network,ethers,events}=require("hardhat")
const {networkConfig,developmentChains}= require("../helper-hardhat-config")


module.exports =async ({getNamedAccounts,deployments})=>{
    const {deploy, log, get }=deployments
    let deployer
        const accounts= await ethers.getSigners()
        deployer= accounts[0].address
        // log("using getSigners\n")
        // log(deployer)
        
    // const deployer1=(await getNamedAccounts()).deployer
    // log(`\n${deployer1}`)

    const networkName=network.name
    const chainId=network.config.chainId
    let entranceFee=networkConfig[chainId]["entranceFee"]
    // entranceFee= ethers.parseEther(entranceFee)
    // const sub_fund_amt=ethers.parseEther("0.1")
    const sub_fund_amt=ethers.parseEther("2")
    const callbackGasLimit=networkConfig[chainId]["callbackGasLimit"]
    const interval=networkConfig[chainId]["interval"]
    const gaslane=networkConfig[chainId]["gaslane"]
    let vrfCoordinatorV2address,subscriptionId,vrfCoordinatorV2
    if(developmentChains.includes(networkName)){
        log("localnetwork ,,,,getting local mock address")
         const mock_deploy= await get("VRFCoordinatorV2Mock")
         vrfCoordinatorV2address=mock_deploy.address
         vrfCoordinatorV2=await ethers.getContractAt("VRFCoordinatorV2Mock",vrfCoordinatorV2address)
        log("mock contract instance created...")
        //creating sub_id for mock
        const tx_response= await vrfCoordinatorV2.createSubscription()
        const tx_receipt =await tx_response.wait(1)
        subscriptionId= await vrfCoordinatorV2.getSubscriptionId()

        console.log(subscriptionId)
    // if (transaction.events && transaction.events.length > 0) {
    //     const event = transaction.events[0];
    //     subscriptionId = event.args.subId;
    //     // log("emitting event parameter \n")
    //     // log(eventArgs)
    // }
    // else{ 
        // console.log(tx_receipt.events)
        // subscriptionId=tx_receipt.Events[0].args.s_currentSubId;
    //  subscriptionId=await tx_receipt.events.args.subId
    // subscriptionId=vrfCoordinatorV2.events[0].args.subId
        // log(transaction)
        log("\nmock sub_id created...")
        //funding the mock sub account programatically
        await vrfCoordinatorV2.fundSubscription(subscriptionId,sub_fund_amt)
        log("mock sub funded...")

     }
    else{
        vrfCoordinatorV2address=networkConfig[chainId]["vrfCoordinatorV2"]
        subscriptionId=networkConfig[chainId]["subscriptionId"]
    }

    const Args=[entranceFee,vrfCoordinatorV2address,subscriptionId,gaslane,interval,callbackGasLimit]

    const raffle=await deploy("Raffle",{
        from:deployer,
        args:Args,
        log:true,
        waitConfirmations:network.config.BlockConfirmations||1,
    })
if(developmentChains.includes(networkName)){
    await vrfCoordinatorV2.addConsumer(subscriptionId,raffle.address)

}

}
module.exports.tags=["all","raffle"]