pragma solidity ^0.4.25;

import "../node_modules/openzeppelin-solidity/contracts/math/SafeMath.sol";

contract FlightSuretyData {
    using SafeMath for uint256;
    using SafeMath for uint;

    /********************************************************************************************/
    /*                                       DATA VARIABLES                                     */
    /********************************************************************************************/

    address private contractOwner;                                      // Account used to deploy contract
    bool private operational = true;                                    // Blocks all state changes throughout the contract if false

    mapping (address=>bool) private authorizedCallers;

    struct Airline{
        bool exists;
        bool registered;
        bool funded;
        bytes32[] flightKeys;
        Votes votes;
        uint numberOfInsurance;
    }

    struct Votes{
        uint votersCount;
        mapping(address => bool) voters;
    }

    struct Insurance {
        address buyer;
        address airline;
        uint value;
        uint ticketNumber;
        InsuranceState state;
    }

    enum InsuranceState {
        NotExist,
        WaitingForBuyer,
        Bought,
        Passed,
        Expired
    }

    mapping(bytes32 => Insurance) private insurances;
    mapping(bytes32 => bytes32[]) private flightInsuranceKeys;
    mapping(address => bytes32[]) private passengerInsuranceKeys;

    uint private airlinesCount = 0;
    uint private registeredAirlinesCount = 0;
    uint private fundedAirlinesCount = 0;


    mapping(address => Airline) private airlines;

    event AirlineExist(address airlineAddress, bool exist);
    event AirlineRegistered(address airlineAddress, bool exist, bool registered);
    event AirlineFunded(address airlineAddress, bool exist, bool registered, bool funded, uint fundedCount);
    event AirlineVoted(address votingAirlineAddress, address votedAirlineAddress, uint startingVotesCount, uint endingVotesCount);
    event GetVotesCalled(uint votesCount);
    event AuthorizedCallerCheck(address caller);
    event AuthorizeCaller(address caller);
    event InsurancePaid(uint amount, address to);
    event InsuranceStateValue(InsuranceState state);
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
            votes: Votes(0),
            numberOfInsurance:0

            });

        airlinesCount = airlinesCount.add(1);
        registeredAirlinesCount = registeredAirlinesCount.add(1);
        // fundedAirlinesCount = fundedAirlinesCount.add(1);
        emit AirlineExist(airlineAddress,  airlines[airlineAddress].exists);
        emit AirlineRegistered( airlineAddress,  airlines[airlineAddress].exists, airlines[airlineAddress].registered);
        // emit AirlineFunded( airlineAddress,  airlines[airlineAddress].exists, airlines[airlineAddress].registered, airlines[airlineAddress].funded);

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
        require(airlines[airlineAddress].exists, "Airline does not exist in requireAirLineExist");
        _;  // All modifiers require an "_" which indicates where the function body will be added
    }

    /**
    * @dev Modifier that requires the airline address to be registered in airlines array
    */
    modifier requireAirLineRegistered(address airlineAddress) 
    {
        require(airlines[airlineAddress].exists, "Airline does not exist in requireAirLineRegistered");
        require(airlines[airlineAddress].registered, "Airline is not registered in requireAirLineRegistered");
        _;  // All modifiers require an "_" which indicates where the function body will be added
    }

    /**
    * @dev Modifier that requires the airline address to be funded in airlines array
    */
    modifier requireAirLineFunded(address airlineAddress) 
    {
        require(airlines[airlineAddress].exists, "Airline does not exist in requireAirLineFunded");
        require(airlines[airlineAddress].registered, "Airline is not registered in requireAirLineFunded");
        require(airlines[airlineAddress].funded, "Airline is not funded in requireAirLineFunded");

        _;  // All modifiers require an "_" which indicates where the function body will be added
    }


    modifier requireAuthorizedCaller(address contractAddress)
    {
        // require(authorizedCallers[contractAddress] == true, "Not Authorized Caller");
        emit AuthorizedCallerCheck(contractAddress);
        _;
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
    public
    requireContractOwner 

    {
        operational = mode;
    }


    function authorizeCaller(address contractAddress)
    public
    requireContractOwner
    requireIsOperational
    {
        authorizedCallers[contractAddress] = true;
        emit AuthorizeCaller(contractAddress);
    }

    function callerIsAuthorized(address contractAddress)
    public
    returns(bool)
    {
        return authorizedCallers[contractAddress];
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
        bool registered
        )
    requireIsOperational
    public
    {
        airlines[airlineAddress] = Airline(
        {
            exists: true,
            registered:registered, 
            funded:false,
            flightKeys: new bytes32[](0),
            votes: Votes(0),
            numberOfInsurance:0
            });
        airlinesCount = airlinesCount.add(1);
        if(registered == true){
            registeredAirlinesCount = registeredAirlinesCount.add(1);
            emit AirlineRegistered( airlineAddress,  airlines[airlineAddress].exists, airlines[airlineAddress].registered);
        }
        else{
            emit AirlineExist(airlineAddress,  airlines[airlineAddress].exists);

        }
    }

    function setAirlineRegistered(address airlineAddress)
    requireIsOperational
    requireAirLineExist(airlineAddress)
    public
    {
        require(airlines[airlineAddress].registered == false , "Airline is already registered in setAirlineRegistered");
        airlines[airlineAddress].registered = true;
        registeredAirlinesCount = registeredAirlinesCount.add(1);
        emit AirlineRegistered( airlineAddress,  airlines[airlineAddress].exists, airlines[airlineAddress].registered);

    }


 /**
    * @dev vote for an airline to be registered 
    *
    */   
    function voteForAirline
    (
        address votingAirlineAddress,
        address airlineAddress
        )
    public
    requireIsOperational
    {
        require(airlines[airlineAddress].votes.voters[votingAirlineAddress] == false, "Airline already voted in voteForAirline");
        airlines[airlineAddress].votes.voters[votingAirlineAddress] = true;
        uint startingVotes = getAirlineVotesCount(airlineAddress);

        require(airlines[airlineAddress].votes.voters[votingAirlineAddress] == true, "Voter record was not saved in voteForAirline");
        airlines[airlineAddress].votes.votersCount = startingVotes.add(1);
        uint endingVotes = getAirlineVotesCount(airlineAddress);

        require(endingVotes == startingVotes + 1, "Count was not incremented in voteForAirline");
        emit AirlineVoted(votingAirlineAddress,  airlineAddress, startingVotes, endingVotes);

    }

/**
    * @dev vote for an airline to be registered 
    *
    */  
    function getAirlineVotesCount
    (
        address airlineAddress
        )
    public
    requireIsOperational
    returns(uint)
    {
        emit GetVotesCalled(airlines[airlineAddress].votes.votersCount);
        return airlines[airlineAddress].votes.votersCount;

    }
    function addFlightKeyToAirline
    (
        address airlineAddress,
        bytes32 flightKey
        )
    public
    requireAuthorizedCaller(msg.sender)
    {
        airlines[airlineAddress].flightKeys.push(flightKey);
    }


   /**
    * @dev Buy insurance for a flight
    *
    */   
    function buy
    (                             
        )
    public
    payable
    {

    }

    /**
     *  @dev Credits payouts to insurees
     */
     function creditInsurees
     (
        bytes32 flightKey,
        uint8 creditRate
        )
     public
     requireAuthorizedCaller(msg.sender)
     {
        bytes32[] storage _insurancesKeys = flightInsuranceKeys[flightKey];

        for (uint i = 0; i < _insurancesKeys.length; i++) {
            Insurance storage _insurance = insurances[_insurancesKeys[i]];

            if (_insurance.state == InsuranceState.Bought) {
                _insurance.value = _insurance.value.mul(creditRate).div(100);
                if (_insurance.value > 0)
                _insurance.state = InsuranceState.Passed;
                else
                _insurance.state = InsuranceState.Expired;
                } else {
                    _insurance.state = InsuranceState.Expired;
                }
            }  
        }


    /**
     *  @dev Transfers eligible payout funds to insuree
     *
     */
     function pay
     (
        )
     public
     pure
     {
     }

   /**
    * @dev Initial funding for the insurance. Unless there are too many delayed flights
    *      resulting in insurance payouts, the contract should be self-sustaining
    *
    */   
    function fund
    (address airlineAddress)
    public
    payable
    requireIsOperational
    requireAirLineRegistered(airlineAddress)
    {
        require(msg.value >= 10 ether, "No suffecient funds supplied");
        airlines[airlineAddress].funded = true;
        fundedAirlinesCount = fundedAirlinesCount.add(1);
        emit AirlineFunded( airlineAddress,  airlines[airlineAddress].exists, airlines[airlineAddress].registered,  airlines[airlineAddress].funded, fundedAirlinesCount );

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
    public 
    payable 
    {
        fund(msg.sender);
    }


    function airlineExists(address airlineAddress)
    public
    view
    returns(bool)
    {
        return airlines[airlineAddress].exists;
    }


    function airlineRegistered(address airlineAddress)
    public
    view
    returns(bool)
    {
        if (airlines[airlineAddress].exists){
            bool registrationStatus = airlines[airlineAddress].registered;
            return registrationStatus;
        }
        return false;
    }
    function airlineFunded(address airlineAddress)
    public
    view
    returns(bool)
    {
        // require(airlines[airlineAddress].funded, "Airline is not funded in airlineFunded");
        return airlines[airlineAddress].funded;
    }

    function getFundedAirlinesCount()
    requireIsOperational
    view
    returns(uint)
    {
        return fundedAirlinesCount;
    }

    function getRegisteredAirlinesCount()
    requireIsOperational
    view
    returns(uint)
    {
        return registeredAirlinesCount;
    }


    function getExistAirlinesCount()
    requireIsOperational
    view
    returns(uint)
    {
        return airlinesCount;
    }



    function getMinimumRequireVotingCount()
    view
    returns(uint)
    {
        return registeredAirlinesCount.div(2);
    }   


    function getInsuranceKey
    (
        bytes32 flightKey,
        uint ticketNumber

        )
    private
    pure 
    returns(bytes32) 
    {
        return keccak256(abi.encodePacked(flightKey, ticketNumber));
    }


    function buildFlightInsurance
    (
        address airlineAddress,
        bytes32 flightKey,
        uint ticketNumber
        )
    public
    requireAuthorizedCaller(msg.sender)
    {
        bytes32 insuranceKey = getInsuranceKey(flightKey, ticketNumber);

        insurances[insuranceKey] = Insurance({
            buyer: address(0),
            airline: airlineAddress,
            value: 0,
            ticketNumber: ticketNumber,
            state: InsuranceState.WaitingForBuyer
            });

        flightInsuranceKeys[flightKey].push(insuranceKey);
    }





    // bool isExist,
    // bool registered,
    // bool funded,
    // uint votesCount,
    // bytes32[] memory flightKeys,
    // uint numberOfInsurance


    function fetchAirlineData(address airlineAddress)
    public
    
    requireIsOperational
    requireAuthorizedCaller(msg.sender)
    requireAirLineExist(airlineAddress)
    returns(
        bool exists,
        bool registered,
        bool funded,
        uint votesCount,
        bytes32[] memory flightKeys,
        uint numberOfInsurance
        )
    {
        Airline memory _airline = airlines[airlineAddress];
        return(
            _airline.exists,
            _airline.registered,
            _airline.funded,
            _airline.votes.votersCount,
            _airline.flightKeys,
            _airline.numberOfInsurance
            );
    }

    function fetchInsuranceData(bytes32 insuranceKey)
    public
    
    requireIsOperational
    requireAuthorizedCaller(msg.sender)
    returns(
        address buyer,
        address airline,
        uint value,
        uint ticketNumber,
        InsuranceState state
        )
    {
        Insurance memory _insurance = insurances[insuranceKey];
        return(_insurance.buyer,
            _insurance.airline,
            _insurance.value,
            _insurance.ticketNumber,
            _insurance.state);
    }




    function fetchPasengerInsurances(address passengerAddress)
    public
    
    requireIsOperational
    requireAuthorizedCaller(msg.sender)
    returns(bytes32[] memory)
    {
        return passengerInsuranceKeys[passengerAddress];
    }

    function fetchFlightInsurances(bytes32 flightKey)
    public
    
    requireIsOperational
    requireAuthorizedCaller(msg.sender)
    returns(bytes32[] memory)
    {
        return flightInsuranceKeys[flightKey];
    }


    function payInsuree(bytes32 insuranceKey)
    public
    requireAuthorizedCaller(msg.sender)
    {
        Insurance memory _insurance = insurances[insuranceKey];
        if (_insurance.state != InsuranceState.Passed){
            emit InsuranceStateValue(_insurance.state);
        }
        require(_insurance.state == InsuranceState.Passed, "Insurance is not valid");
        require(address(this).balance > _insurance.value, "try again later");

        uint _value = _insurance.value;
        _insurance.value = 0;
        _insurance.state = InsuranceState.Expired;
        address insuree = address(uint160(_insurance.buyer));
        insuree.transfer(_value);
        emit InsurancePaid(_value, insuree);
    }

    function buyInsurance
    (
        address  buyer,
        bytes32 insuranceKey
        )
    public
    payable
    {
        // require(insurances[insuranceKey].state == InsuranceState.WaitingForBuyer, "Insurance allredy bought, or not exist or expired");

        insurances[insuranceKey].value = msg.value;
        insurances[insuranceKey].buyer = buyer;
        insurances[insuranceKey].state = InsuranceState.Bought;

        //passengerInsuranceKeys[buyer].push(insuranceKey);
    }
}

