pragma solidity ^0.4.25;

import "../node_modules/openzeppelin-solidity/contracts/math/SafeMath.sol";

contract FlightSuretyData {
    using SafeMath for uint256;
    using SafeMath for uint16;

    /********************************************************************************************/
    /*                                       DATA VARIABLES                                     */
    /********************************************************************************************/

    address private contractOwner;                                      // Account used to deploy contract
    bool private operational = true;                                    // Blocks all state changes throughout the contract if false


    struct Airline{
        bool exists;
        bool registered;
        bool funded;
        bytes32[] flightKeys;
        Votes votes;

    }
    struct Votes{
        uint votersCount;
        mapping(address => bool) voters;
    }

    uint256 private airlinesCount = 0;
    uint256 private registeredAirlinesCount = 0;
    uint256 private fundedAirlinesCount = 0;
    
    mapping(address => Airline) private airlines;


    /********************************************************************************************/
    /*                                       EVENT DEFINITIONS                                  */
    /********************************************************************************************/


    /**
    * @dev Constructor
    *      The deploying account becomes contractOwner
    */
    constructor
    (
        address airlineAddress
        ) 
    public 
    {
        contractOwner = msg.sender;
        airlines[airlineAddress] = Airline({
            exists:true,
            registered:true, 
            funded: false,
            flightKeys: new bytes32[](0),
            votes: Votes(0)
            });
        airlinesCount = airlinesCount.add(1);
        registeredAirlinesCount = registeredAirlinesCount.add(1);
        fundedAirlinesCount = fundedAirlinesCount.add(1);

    }

    /********************************************************************************************/
    /*                                       FUNCTION MODIFIERS                                 */
    /********************************************************************************************/

    // Modifiers help avoid duplication of code. They are typically used to validate something
    // before a function is allowed to be executed.

    /**
    * @dev Modifier that requires the "operational" boolean variable to be "true"
    *      This is used on all state changing functions to pause the contract in 
    *      the event there is an issue that needs to be fixed
    */
    modifier requireIsOperational() 
    {
        require(operational, "Contract is currently not operational");
        _;  // All modifiers require an "_" which indicates where the function body will be added
    }

    /**
    * @dev Modifier that requires the "ContractOwner" account to be the function caller
    */
    modifier requireContractOwner()
    {
        require(msg.sender == contractOwner, "Caller is not contract owner");
        _;
    }

    /**
    * @dev Modifier that requires the airline address to be presend in airlines array
    */
    modifier requireAirLineExist(address airlineAddress) 
    {
        require(airlines[airlineAddress].exists, "Airline does not existed");
        _;  // All modifiers require an "_" which indicates where the function body will be added
    }

    /**
    * @dev Modifier that requires the airline address to be registered in airlines array
    */
    modifier requireAirLineRegistered(address airlineAddress) 
    {
        require(airlines[airlineAddress].exists, "Airline does not existed");
        require(airlines[airlineAddress].registered, "Airline is not registered");
        _;  // All modifiers require an "_" which indicates where the function body will be added
    }

    /**
    * @dev Modifier that requires the airline address to be funded in airlines array
    */
    modifier requireAirLineFunded(address airlineAddress) 
    {
        require(airlines[airlineAddress].exists, "Airline does not existed");
        require(airlines[airlineAddress].registered, "Airline is not registered");
        require(airlines[airlineAddress].registered, "Airline is not funded");

        _;  // All modifiers require an "_" which indicates where the function body will be added
    }

    /********************************************************************************************/
    /*                                       UTILITY FUNCTIONS                                  */
    /********************************************************************************************/

    /**
    * @dev Get operating status of contract
    *
    * @return A bool that is the current operating status
    */      
    function isOperational() 
    public 
    view 
    returns(bool) 
    {
        return operational;
    }


    /**
    * @dev Sets contract operations on/off
    *
    * When operational mode is disabled, all write transactions except for this one will fail
    */ 
    function setOperatingStatus

    (
        bool mode
        ) 
    external
    requireContractOwner 

    {
        operational = mode;
    }

    /********************************************************************************************/
    /*                                     SMART CONTRACT FUNCTIONS                             */
    /********************************************************************************************/

   /**
    * @dev Add an airline to the registration queue
    *      Can only be called from FlightSuretyApp contract
    *
    */   
    function registerAirline
    (
        address airlineAddress,
        bool registered,
        bool funded
        )
    requireIsOperational
    external
    {
        airlines[airlineAddress] = Airline(
        {
            exists: true,
            registered:registered, 
            funded:funded,
            flightKeys: new bytes32[](0),
            votes: Votes(0)
            });

        airlinesCount = airlinesCount.add(1);
        if(registered){
            registeredAirlinesCount = registeredAirlinesCount.add(1);
        }
        if(funded){
            fundedAirlinesCount = fundedAirlinesCount.add(1);
        }
    }


    function airlineExists(address airlineAddress)
    external
    view
    returns(bool)
    {
        return airlines[airlineAddress].exists;
    }


    function airlineRegistered(address airlineAddress)
    external
    view
    returns(bool)
    {
        if (airlines[airlineAddress].exists){
            return airlines[airlineAddress].registered;
        }
        return false;
    }
    function airlineFunded(address airlineAddress)
    external
    view
    returns(bool)
    {
        if (airlines[airlineAddress].registered){
            return airlines[airlineAddress].funded;
        }
        return false;
    }


   /**
    * @dev Buy insurance for a flight
    *
    */   
    function buy
    (                             
        )
    external
    payable
    {

    }

    /**
     *  @dev Credits payouts to insurees
     */
     function creditInsurees
     (
        )
     external
     pure
     {
     }


    /**
     *  @dev Transfers eligible payout funds to insuree
     *
     */
     function pay
     (
        )
     external
     pure
     {
     }

   /**
    * @dev Initial funding for the insurance. Unless there are too many delayed flights
    *      resulting in insurance payouts, the contract should be self-sustaining
    *
    */   
    function fund
    ()
    public
    payable
    requireIsOperational
    requireAirLineRegistered(msg.sender)
    {
        require(msg.value >= 1 ether, "No suffecient funds supplied");
        airlines[msg.sender];
    }

    function getFlightKey
    (
        address airline,
        string memory flight,
        uint256 timestamp
        )
    pure
    internal
    returns(bytes32) 
    {
        return keccak256(abi.encodePacked(airline, flight, timestamp));
    }

    /**
    * @dev Fallback function for funding smart contract.
    *
    */
    function() 
    external 
    payable 
    {
        fund();
    }



    function getFundedAirlinesCount()
    requireIsOperational
    view
    returns(uint256)
    {
        return fundedAirlinesCount;
    }
}

