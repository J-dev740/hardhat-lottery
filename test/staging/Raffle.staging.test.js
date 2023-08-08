//create subscription account -> get sub_id and paste it in helper-hardhat.config.js
//func the subscription account
//deploy the contract on to testnet copy the address->add as consumer
//create a chainlink automation using and give name of the function which checks for upkeeps 
// fund the upkeep contract with 3-7 link tokens 



const {assert,expect}=require("chai")
const {getNamedAccounts,deployments,ethers,network,provider}=require("hardhat")
const {networkConfig,developmentChains}=require("../../helper-hardhat-config")
const {time,helpers}=require("@nomicfoundation/hardhat-network-helpers")
const {toBigInt} = require("ethers")
developmentChains.includes(network.name)
?describe.skip
:
describe("Raffle Staging tests",()=>{
    //contract var def should be given here else scope error is most likely going to occur such as
    //ReferenceError: raffle is not defined etcc....
    let raffle,ethEntranceFee,deployer
    // let interval1=31
    // const chainId=network.config.chainId;

    beforeEach(async ()=>{
        // const {deployer}= await getNamedAccounts()
        const accounts = await ethers.getSigners();
        deployer=accounts[0];

        // await deployments.fixture("all");
        const raffle_address= (await deployments.get("Raffle")).address;
        raffle=await ethers.getContractAt("Raffle",raffle_address);
        raffle=raffle.connect(deployer);
        ethEntranceFee=await raffle.getEntranceFee();
        // const vrfCoordinatorV2_address= (await deployments.get("VRFCoordinatorV2Mock")).address;
        // vrfCoordinatorV2= await ethers.getContractAt("VRFCoordinatorV2Mock",vrfCoordinatorV2_address);
        // vrfCoordinatorV2=vrfCoordinatorV2.connect(deployer);
        // interval= await raffle.getInterval();
        // interval=interval.toNumber()
        // interval=ethers.toNumber(interval)
        // console.log(interval)

    });
    describe("fulfillRandomWords ",()=>{
        it("works with live testnet and chainLinkVrf and chainlink Keepers to update and we get a random winner",async ()=>{
            console.log("setting up the test ")
            const accounts=await ethers.getSigners()
            const startingTimestamp= await raffle.getLastTimeStamp()
            console.log("setting up the listeners")
            await new Promise(async (resolve,reject)=>{


                raffle.once("WinnerPicked",async()=>{
                    console.log("winner picked event emitted")
                    console.log("winner found")
                    try {
                        const recentWinner=await raffle.getRecentWinner()
                        console.log(recentWinner)
                        console.log("\nplayers in the raffle-------->\n")
                        // console.log(accounts[2].address)
                        console.log(accounts[0].address)
                        // console.log(accounts[1].address)
                        // console.log(accounts[3].address)

                        const endingTimeStamp=await raffle.getLastTimeStamp()
                        const raffle_state= await raffle.getRaffleState()
                        const num_players= await raffle.getNumberOfPlayers()
                        const winnerEndingBalance_wei=(await ethers.provider.getBalance(accounts[0].address)).toString()
                        const winnerEndingBalance= BigInt(ethers.parseUnits(winnerEndingBalance_wei,18))
                        // await ethers.getBalance()
                        // console.log(winnerEndingBalance)
                         console.log(`winner starting balance :${winnerStartingBalance_wei}`)

                        console.log(`winner ending balance :${winnerEndingBalance_wei}`)
                        // accounts[0].address will return a string value as == will not check for same type
                        // assert(recentWinner.toString()==accounts[0].address)
                        assert(num_players.toString()=="0")
                        assert(raffle_state.toString()=="0")
                        assert(endingTimeStamp > startingTimestamp)
                        // assert(
                        //   winnerEndingBalance.toString() == (winnerStartingBalance+BigInt(ethers.parseUnits(ethEntranceFee.toString(),18))*BigInt(additionalEntrance)+BigInt(ethEntranceFee)).toString()
                            
                        // )
                        // assert(winnerEndingBalance>winnerStartingBalance)
                        resolve()
    
                    } catch (error) {
                        reject(error)
                    }
                })
                console.log("entering the raffle")
                try {
                    const tx1=  
                    await raffle.enterRaffle({value:ethEntranceFee})
                    tx1.wait(1)
                    console.log('entered the raffle')
                    
                } catch (error) {
                    console.log(error)
                }
        // //   await tx1.wait(1)
        //     raffle=raffle.connect(accounts[1])
        //    const tx2= await raffle.enterRaffle({value:ethEntranceFee})
        // //    await tx2.wait(1)
        //     raffle=raffle.connect(accounts[2])
        //   const tx3=  await raffle.enterRaffle({value:ethEntranceFee})
        // //   await tx3.wait(1)

        //     raffle=raffle.connect(accounts[3])
        //   const tx4=  await raffle.enterRaffle({value:ethEntranceFee})
        // //   await tx4.wait(1)


            const winnerStartingBalance_wei=(await ethers.provider.getBalance(accounts[0].address)).toString()
            const winnerStartingBalance= BigInt(ethers.parseUnits(winnerStartingBalance_wei,18))


            })

        })
    })
})