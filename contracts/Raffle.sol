// SPDX-License-Identifier: MIT 
pragma solidity ^0.8.7;
import "@chainlink/contracts/src/v0.8/interfaces/VRFCoordinatorV2Interface.sol";
import "@chainlink/contracts/src/v0.8/VRFConsumerBaseV2.sol";
import "@chainlink/contracts/src/v0.8/interfaces/AutomationCompatibleInterface.sol";


//main structure of smartcontracts can be defined in Natspec format
/*
1. pragma statements
2. import statements
3. interface statements
4. libraries 
5. contracts
    5.1 type declarations
    5.2 state variables
    5.3 events 
    5.4 errors
    5.5 modifies 
    5.6 functions 
    5.7 view/pure functions

*/
//pragma statements

//interface 

//libraries 

//contracts 

    // allow players to enter the raffle
    //pick a randomWinner
    //publish the recent lottery winner
contract Raffle is VRFConsumerBaseV2,AutomationCompatibleInterface {
    //type declarations
    enum RaffleState{

        OPEN,
        CALCULATING
    }
    //state variables
        //chainlink vrf variables
       VRFCoordinatorV2Interface private immutable  i_vrfCoordinator;
       uint64 private immutable i_subscriptionId;
       uint256 private requestId;
       bytes32 private immutable i_gaslane;
       uint32 private immutable i_callbackGasLimit;
       uint16 private constant  REQUEST_CONFIRMATIONS=3;
       uint32 private constant NUM_WORDS=1;


         //lottery variables
        uint256 private immutable i_entranceFee;
        address payable[] private  s_players;
        RaffleState private s_raffleState;
        uint256 private i_interval;
        uint256 private s_lastTimeStamp;
        address  private s_recentWinner;
    //events 
    event RequestedRaffleWinner(uint256 indexed  requestId);
    event RaffleEnter(address indexed player );
    event WinnerPicked(address indexed player);
    //errors
    error  Raffle_sendMoreToEnterRaffle();
    error Raffle_RaffleNotOpen();
    error Raffle_upKeepNeeded(uint256 currentBalance, uint256 numPlayers, uint256 raffleState);
    error Raffle_TransferFailed();
    //modfiers
    //functions 
    constructor(
        uint256 entranceFee,
        address vrfCoordinatorV2,
        uint64 subscriptionId,
        bytes32 gaslane,//keyhash
        uint256 interval,
        uint32 callbackGasLimit

    )VRFConsumerBaseV2(vrfCoordinatorV2)
    {
        i_vrfCoordinator=VRFCoordinatorV2Interface(vrfCoordinatorV2);
        i_entranceFee= entranceFee;
        i_gaslane= gaslane;
        i_interval= interval;
        i_subscriptionId=subscriptionId;
        i_callbackGasLimit=callbackGasLimit;
         s_lastTimeStamp=block.timestamp;
         s_raffleState= RaffleState.OPEN;
    }
    function enterRaffle() public payable {
        //define min eth to enter the raffle
        // require(msg.value>i_entranceFee,"Not enough eth");
        if (msg.value<i_entranceFee) revert Raffle_sendMoreToEnterRaffle();
        if( s_raffleState!=RaffleState.OPEN) revert Raffle_RaffleNotOpen();
        s_players.push(payable(msg.sender));
        //push the players into an array  who entered the raffle
        emit RaffleEnter(msg.sender);

    }
   //random winner is picked by dividing this method into two methods   
        //checkUpKeep
        //PerformUpKeep
        function checkUpkeep(
            bytes memory /*checkData*/
            )public view override  returns(
            bool upKeepNeeded,
            bytes memory /*performData*/
            )
            {
            //check for UpKeep based on four conditions
            //if RaffleState is open
            //if interval has surpasssed for upKeep
            //if min no of players are available
            //if contract has min eth 
            bool state= s_raffleState==RaffleState.OPEN;
            bool time= ((block.timestamp-s_lastTimeStamp)>i_interval);
            bool number= s_players.length >0;
            bool has_balance= address(this).balance>0;
             upKeepNeeded =(state && time && number && has_balance );
             return (upKeepNeeded,"0x0");//can we comment this out

            }

        function performUpkeep(
            bytes calldata
            //  performData
            ) external override {
            (bool upKeepNeeded,)=checkUpkeep("");
            if (!upKeepNeeded){
                revert Raffle_upKeepNeeded(
                    address(this).balance ,
                    s_players.length,
                    uint256(s_raffleState)
                );
            }
            s_raffleState=RaffleState.CALCULATING;
             requestId=i_vrfCoordinator.requestRandomWords(
                i_gaslane,
                i_subscriptionId,
                REQUEST_CONFIRMATIONS,
                i_callbackGasLimit,
                NUM_WORDS
            );
            emit RequestedRaffleWinner(requestId);

        }

        function fulfillRandomWords(
            uint256, /* requestId */
            uint256[] memory randomWords
            ) internal override{
            uint256 indexOfWinner= randomWords[0]%s_players.length;
            address payable recentWinner= s_players[indexOfWinner];
            s_recentWinner = recentWinner;
            s_lastTimeStamp=block.timestamp;
            s_players=new address payable[] (0);
            s_raffleState=RaffleState.OPEN;
            (bool success,)= recentWinner.call{value:address(this).balance}("");
            if(!success) revert Raffle_TransferFailed();
            else emit WinnerPicked(recentWinner);

        }


    //view/pure functions 
    //getter functions
    function getRaffleState() public view returns(RaffleState){
        return s_raffleState;
    }
        //for functions returning hardcoded values such as const values view -> replaed by ->pure ie it lead to 
        //gas efficiency
    function getNumWords() public pure  returns (uint256) {
        return NUM_WORDS;
    }

    function getRequestConfirmations() public pure returns( uint256 ) {
        return REQUEST_CONFIRMATIONS;

    }

    function getRecentWinner() public view returns (address ){
        return s_recentWinner;

    }
    function getLastTimeStamp() public view returns ( uint256){
        return s_lastTimeStamp;

    }

    function getInterval() public view returns (uint256) {
        return i_interval;
    }

    function getEntranceFee() public view returns (uint256) {
        return i_entranceFee;
    }

    function getNumberOfPlayers() public view returns (uint256) {
        return s_players.length;
    }
    function getPlayer(uint256 index) public view returns (address){
        return s_players[index];
    }

    function getRequestId() public view returns (uint256){
        return requestId;
    }







}