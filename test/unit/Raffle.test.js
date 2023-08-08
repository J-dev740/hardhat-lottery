const {assert,expect}=require("chai")
const {getNamedAccounts,deployments,ethers,network,provider}=require("hardhat")
const {networkConfig,developmentChains}=require("../../helper-hardhat-config")
const {time,helpers}=require("@nomicfoundation/hardhat-network-helpers")
const {toBigInt} = require("ethers")
!developmentChains.includes(network.name)
?describe.skip
:
describe("Raffle",()=>{
    //contract var def should be given here else scope error is most likely going to occur such as
    //ReferenceError: raffle is not defined etcc....
    let raffle,vrfCoordinatorV2,ethEntranceFee,deployer,interval
    let interval1=31
   
    const chainId=network.config.chainId;
    beforeEach(async ()=>{
        // const {deployer}= await getNamedAccounts()
        const accounts = await ethers.getSigners();
        deployer=accounts[0];

        await deployments.fixture("all");
        const raffle_address= (await deployments.get("Raffle")).address;
        raffle=await ethers.getContractAt("Raffle",raffle_address);
        raffle=raffle.connect(deployer);
        const vrfCoordinatorV2_address= (await deployments.get("VRFCoordinatorV2Mock")).address;
        vrfCoordinatorV2= await ethers.getContractAt("VRFCoordinatorV2Mock",vrfCoordinatorV2_address);
        vrfCoordinatorV2=vrfCoordinatorV2.connect(deployer);
        ethEntranceFee=await raffle.getEntranceFee();
        interval= await raffle.getInterval();
        // interval=interval.toNumber()
        interval=ethers.toNumber(interval)
        console.log(interval)

    });
    describe("constructor",()=>{
        it("should set initial raffle state to open",async ()=>{
            const raffle_state=  await  raffle.getRaffleState()
            console.log(raffle_state)
            assert(raffle_state.toString(),"0")
        });

        it("should set the min interval to 30 seconds ",async () =>{

            // const interval=  await raffle.getInterval()
            console.log(interval)
            assert(interval.toString(),networkConfig[chainId]["interval"])

        });

    });
    describe("enterRaffle",()=>{
        it("should revert if no min eth is provided to enter raffle",async ()=>{
           await expect (raffle.enterRaffle()).to.be.revertedWithCustomError(raffle,"Raffle_sendMoreToEnterRaffle")

        })
        it("should add players to array entering raffle",async()=>{
            await raffle.enterRaffle({value:ethEntranceFee})
            const player= raffle.getPlayer(0)
            assert(player.toString(),deployer.toString())
        })
        it("should not allow to enter if state is calculating",async()=>{
            //increase interval just enough to make raffle state calculating
            // console.log("hello")
            // console.log(`${typeof(interval)}`)
            await raffle.enterRaffle({value:ethEntranceFee})
            // console.log("breaking here")
            await ethers.provider.send( "evm_increaseTime",  [interval+1] )
            // await network.provider.send(`evm_increaseTime`,[40])
            // await helpers.time.increase(interval+1)
            // await time.increase(interval+1)


            // await network.provider.send()
            //mines a single block to simulate next state of blockchain
            await ethers.provider.send("evm_mine",[])
            //now we are acting as the chainlink keepers and calling performKeep to 
            //simulate the raffle state to be CALCULATING
                await raffle.performUpkeep("0X")
       
            // console.log("End")
            await expect(raffle.enterRaffle({value:ethEntranceFee})).to.be.revertedWithCustomError(raffle,"Raffle_RaffleNotOpen")
        }) 
        
      })
    describe("checkUpkeep",()=>{
        it("should revert if state is not open",async ()=>{
            // let upKeepNeeded
            await raffle.enterRaffle({value:ethEntranceFee})
            await network.provider.send("evm_increaseTime",[interval+1])
            await network.provider.send("evm_mine",[])
            await raffle.performUpkeep("0x")
            const raffle_state= await raffle.getRaffleState()
            const{upKeepNeeded,}=await raffle.checkUpkeep("0x")
             assert(!upKeepNeeded,raffle_state.toString()=="1")

        })
        it("should revert if no players entered the raffle",async()=>{
            await network.provider.send("evm_increaseTime",[interval+1])
            await network.provider.send("evm_mine",[])
            const {upKeepNeeded,}= await raffle.checkUpkeep("0x")
            assert(!upKeepNeeded)

        })
        it("should revert if enough time has not passed ",async()=>{
            await raffle.enterRaffle({value:ethEntranceFee})
            await network.provider.send("evm_increaseTime",[interval+1-5])
            await network.provider.send("evm_mine",[])
            const {upKeepNeeded,}= await raffle.checkUpkeep("0x")
            assert(!upKeepNeeded)


        })
        it("returns true if all above is satisfied ",async()=>{
            await raffle.enterRaffle({value:ethEntranceFee})
            await network.provider.send("evm_increaseTime",[interval+1])
            await network.provider.send("evm_mine",[])
            const {upKeepNeeded,}= await raffle.checkUpkeep("0x")
            assert(upKeepNeeded)


        })

    })
    describe("performUpkeep",()=>{
        it("can only run if checkUpkeep returns true ",async ()=>{
            await raffle.enterRaffle({value:ethEntranceFee})
            await network.provider.send("evm_increaseTime",[interval+1])
            await network.provider.send("evm_mine",[])
            /**
             * @bug raffle.performUpkeep([]) does not work 
             * we have to give empty bytes array in the latter specified format only
             */
            const tx= await raffle.performUpkeep("0x")
            assert(tx)
        })
        it ('reverts when checkUpkeep returns false',async ()=>{
            await expect(raffle.performUpkeep('0x')).to.be.revertedWithCustomError(raffle,"Raffle_upKeepNeeded")

        })
        it(' updates the raffle state , emits an event and calls the vrf',async ()=>{
            await raffle.enterRaffle({value:ethEntranceFee})
            await network.provider.send("evm_increaseTime",[interval+1])
            await network.provider.send('evm_mine',[])
            /**
             * @bug not able to call events to find the triggered event args with the code below
             */
            // await new Promise(async(resolve,reject)=>{

            //     raffle.once("RequestedRaffleWinner",(eventArgs)=>{
            //         try {
            //     assert(ethers.toNumber(eventArgs.requestId)>0)
            //     console.log(eventArgs.requestId)
            //     resolve()
                        
            //         } catch (error) {
            //             console.log("error")
            //             console.log(error)
            //             reject(error)
            //         }
            //     })
            // })
            const tx_response= await raffle.performUpkeep('0x')
            await tx_response.wait(1)
            const raffle_state= await raffle.getRaffleState()
            assert(raffle_state.toString()=='1')
            /**
             const requestId= tx_receipt.events(0).args.requestId
             * @bug returns TypeError: Cannot read properties of undefined (reading '1')
             */
        })
            
    })
    describe("fulfillRandomWords",()=>{
        beforeEach(async ()=>{
            await raffle.enterRaffle({value:ethEntranceFee})
            await network.provider.send("evm_increaseTime",[interval+1])
            await network.provider.send("evm_mine",[])
        })
        it("should revert if performUpkeep is not called before",async ()=>{
            await expect(vrfCoordinatorV2.fulfillRandomWords(0,raffle.getAddress())).to.be.revertedWith("nonexistent request")
            await expect(vrfCoordinatorV2.fulfillRandomWords(1,raffle.getAddress())).to.be.revertedWith("nonexistent request")

        })
        it("pick the winner, resets and sends eth",async ()=>{
            const accounts= await ethers.getSigners()
            const additionalEntrance=3
            const startingIndex=2
            for (let index = startingIndex; index < startingIndex+additionalEntrance; index++) {
                raffle=raffle.connect(accounts[index])
                await raffle.enterRaffle({value:ethEntranceFee})

            }
            const startingTimestamp= await raffle.getLastTimeStamp()
            const winnerStartingBalance_wei= (await ethers.provider.getBalance(accounts[2].address)).toString()
            const winnerStartingBalance=  BigInt(ethers.parseUnits(winnerStartingBalance_wei,18))
            



            await new Promise(async (resolve,reject)=>{

                raffle.once("WinnerPicked",async ()=>{
                    console.log("winner picked event emitted")
                    console.log("winner found")
                    try {
                        const recentWinner=await raffle.getRecentWinner()
                        console.log(recentWinner)
                        console.log("\nplayers in the raffle-------->\n")
                        console.log(accounts[2].address)
                        console.log(accounts[0].address)
                        console.log(accounts[1].address)
                        console.log(accounts[3].address)

                        const endingTimeStamp=await raffle.getLastTimeStamp()
                        const raffle_state= await raffle.getRaffleState()
                        const num_players= await raffle.getNumberOfPlayers()
                        const winnerEndingBalance_wei=(await ethers.provider.getBalance(accounts[2].address)).toString()
                        const winnerEndingBalance= BigInt(ethers.parseUnits(winnerEndingBalance_wei,18))
                        // await ethers.getBalance()
                        // console.log(winnerEndingBalance)
                         console.log(`winner starting balance :${winnerStartingBalance_wei}`)

                        console.log(`winner ending balance :${winnerEndingBalance_wei}`)
                        assert(num_players.toString()=="0")
                        assert(raffle_state.toString()=="0")
                        assert(endingTimeStamp > startingTimestamp)
                        // assert(
                        //   winnerEndingBalance.toString() == (winnerStartingBalance+BigInt(ethers.parseUnits(ethEntranceFee.toString(),18))*BigInt(additionalEntrance)+BigInt(ethEntranceFee)).toString()
                            
                        // )
                        assert(winnerEndingBalance>winnerStartingBalance)
                        resolve()
    
                    } catch (error) {
                        reject(error)
                    }
                })
                //     raffle.once("RequestedRaffleWinner",async (eventArgs)=>{
                  
            //             try {
            //                 const raffle_address= await raffle.getAddress()
            //                 console.log(raffle_address)
            //                 await vrfCoordinatorV2.fulfillRandomWords(eventArgs.requestId,raffle_address)
                            
            //             } catch (error) {
            //                 console.log("error")
            //                 console.log(eventArgs)
            //                 console.log(error)
            //             }
                 

                // })
                const tx_response= await raffle.performUpkeep('0x')
                await tx_response.wait(1)
                const raffle_state= await raffle.getRaffleState()
                // even though we are running on localnetwork we need to simulate to get tx_receipt after 1 block confirmation 
                // await  tx.wait(1) 
                try {
                    
                    const req_id= await raffle.getRequestId()
                    console.log(`winner starting balance : ${winnerStartingBalance}`)

                    await vrfCoordinatorV2.fulfillRandomWords(req_id,raffle.getAddress())
                    console.log(req_id)
                } catch (error) {
                    console.log(error)
                }
                
            })
        })
    })
});