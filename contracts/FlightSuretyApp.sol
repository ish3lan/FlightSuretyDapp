pragma solidity ^0.4.25;

// It's important to avoid vulnerabilities due to numeric overflow bugs
// OpenZeppelin's SafeMath library, when used correctly, protects agains such bugs
// More info: https://www.nccgroup.trust/us/about-us/newsroom-and-events/blog/2018/november/smart-contract-insecurity-bad-arithmetic/

import "../node_modules/openzeppelin-solidity/contracts/math/SafeMath.sol";

import "./FlightSuretyData.sol";

/************************************************** */
/* FlightSurety Smart Contract                      */
/************************************************** */
contract FlightSuretyApp {
    using SafeMath for uint256; // Allow SafeMath functions to be called for all uint256 types (similar to "prototype" in Javascript)

    /********************************************************************************************/
    /*                                       DATA VARIABLES                                     */
    /********************************************************************************************/

    uint256 MinimumAirlinesCount = 4;

    uint8 private constant CREDIT_RATE = 150;

    // Flight status codees
    uint8 private constant STATUS_CODE_UNKNOWN = 0;
    uint8 private constant STATUS_CODE_ON_TIME = 10;
    uint8 private constant STATUS_CODE_LATE_AIRLINE = 20;
    uint8 private constant STATUS_CODE_LATE_WEATHER = 30;
    uint8 private constant STATUS_CODE_LATE_TECHNICAL = 40;
    uint8 private constant STATUS_CODE_LATE_OTHER = 50;

    address private contractOwner;          // Account used to deploy contract

    bool private operational = true;
    struct Flight {
        bool isRegistered;
        string name;
        uint256 departure;
        uint8 statusCode;
        uint256 updatedTimestamp;        
        address airline;
    }


    mapping(bytes32 => Flight) private flights;

    FlightSuretyData dataContract;



    event AirlineSwitchToRegistered(address airlineAddress, bool registered);
    event AirlineAdded(address airlineAddress);
    event AirlineRegistered(address airlineAddress);
    event AirlineNotRegistered(address airlineAddress, uint a, uint b, bool c);
    event FlightRegistered(bytes32 flightKey);
    event FlightTicketsAdded(uint[] ticketsNumbers, bytes32 flightKey);
    event CreditDrawed(uint value);
    event InsuranceBought(bytes32 insuranceKey);
    event OracleRegistered(address oracleaddress, bool isRegistered);
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
         // Modify to call data contract's status
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


    modifier requireIsAirLine(address airlineAddress)
    {
        require(dataContract.airlineExists(airlineAddress), "Airline does not exist in requireIsAirLine");
        _;
    }

    modifier requireIsRegisteredAirLine(address airlineAddress)
    {
        require(dataContract.airlineRegistered(airlineAddress), "Airline is not registered in requireIsRegisteredAirLine");
        _;
    }

    modifier requireIsFundedAirLine(address airlineAddress)
    {
        require(dataContract.airlineFunded(airlineAddress), "Airline is not funded in requireIsFundedAirLine");
        _;
    }
    /********************************************************************************************/
    /*                                       CONSTRUCTOR                                        */
    /********************************************************************************************/

    /**
    * @dev Contract constructor
    *
    */
    constructor
    (address flightSuretyDataAddress
        ) 
    public 
    {
        contractOwner = msg.sender;
        dataContract = FlightSuretyData(flightSuretyDataAddress);
    }

    /********************************************************************************************/
    /*                                       UTILITY FUNCTIONS                                  */
    /********************************************************************************************/

    function isOperational() 
    public 
    view 
    returns(bool) 
    {
        return operational;  // Modify to call data contract's status
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

    /********************************************************************************************/
    /*                                     SMART CONTRACT FUNCTIONS                             */
    /********************************************************************************************/


   /**
    * @dev check airlines registration method
    *
    */   
    // function airlineRegistrationNeedsVoting()
    // public
    // returns(bool)
    // {
    //     return dataContract.getFundedAirlinesCount > 4;
    // }



   /**
    * @dev Add an airline to the registration queue
    *
    */   
    function registerAirline
    (   
        address airlineAddress
        )
    public
    requireIsOperational
    requireIsFundedAirLine(msg.sender)
    {
        // bool needsVoting = airlineRegistrationNeedsVoting();
        if ( dataContract.getRegisteredAirlinesCount() >= MinimumAirlinesCount){
            dataContract.registerAirline(airlineAddress, false);
            emit AirlineAdded(airlineAddress);
        }
        else{
            dataContract.registerAirline(airlineAddress, true);
            emit AirlineRegistered(airlineAddress);
        }
    }



   /**
    * @dev Add an airline to the registration queue
    *
    */   
    function fundAirline
    (
        address airlineAddress
        )
    public
    payable
    requireIsOperational
    {
        require(msg.sender == airlineAddress, "Only the airline can fund itself");
        require(msg.value >= REGISTRATION_FEE, "No enough funding recieved");
        dataContract.fund.value(10 ether)(airlineAddress);
    }


   /**
    * @dev vote for an airline to be registered 
    *
    */   
    function voteForAirline
    (
        address airlineAddress
        )
    public
    requireIsOperational
    requireIsFundedAirLine(msg.sender)
    requireIsAirLine(airlineAddress)
    {
        dataContract.voteForAirline(msg.sender, airlineAddress);
        uint voteCount = dataContract.getAirlineVotesCount(airlineAddress);
        uint minimumRequireVotingCount = dataContract.getMinimumRequireVotingCount();
        bool registrationStatus = dataContract.airlineRegistered(airlineAddress);
        if ( voteCount > minimumRequireVotingCount && !registrationStatus){
            dataContract.setAirlineRegistered(airlineAddress);
            emit AirlineRegistered(airlineAddress);
        }
        else{
            //for testing purposes
            emit AirlineNotRegistered(airlineAddress, voteCount, minimumRequireVotingCount, registrationStatus);
        }
    }



   /**
    * @dev Register a future flight for insuring.
    *
    */  
    function registerFlight
    (
        uint256 departure,
        uint256[] ticketNumbers,
        string flightName
        )
    public
    requireIsOperational
    requireIsFundedAirLine(msg.sender)
    {
        bytes32 flightKey = getFlightKey(msg.sender, flightName, departure);
        require(!flights[flightKey].isRegistered, "Flight is already registered");

        flights[flightKey] = Flight ({
            isRegistered: true,
            name: flightName,
            departure: departure,
            statusCode: 0,
            updatedTimestamp: now,
            airline: msg.sender
            });

        dataContract.addFlightKeyToAirline(msg.sender, flightKey);

        for (uint i = 0; i < ticketNumbers.length; i++) {
            dataContract.buildFlightInsurance(msg.sender, flightKey, ticketNumbers[i]);
        }

        emit FlightRegistered(flightKey);
        emit FlightTicketsAdded(ticketNumbers, flightKey);
    }
    


    function addFlightTickets
    (
        string flightName,
        uint256 departure,
        uint256[] ticketNumbers
        )
    public
    requireIsOperational
    requireIsFundedAirLine(msg.sender)
    {
        bytes32 flightKey = getFlightKey(msg.sender, flightName, departure);
        require(flights[flightKey].isRegistered, "Flight not registered");
        for (uint i = 0; i < ticketNumbers.length; i++) {
            dataContract.buildFlightInsurance(msg.sender, flightKey, ticketNumbers[i]);
        }

        flights[flightKey].updatedTimestamp = now;

        emit FlightTicketsAdded(ticketNumbers, flightKey);
    }




   /**
    * @dev Called after oracle has updated flight status
    *
    */  
    function processFlightStatus
    (
        address airline,
        string memory flight,
        uint256 timestamp,
        uint8 statusCode
        )
    internal
    
    {
        bytes32 flightKey = getFlightKey(airline, flight, timestamp);
        flights[flightKey].statusCode = statusCode;
//|| statusCode == STATUS_CODE_LATE_WEATHER || statusCode == STATUS_CODE_LATE_OTHER || statusCode == STATUS_CODE_LATE_TECHNICAL
if (statusCode == STATUS_CODE_LATE_AIRLINE ){
    dataContract.creditInsurees(flightKey, CREDIT_RATE);
}
else{
    dataContract.creditInsurees(flightKey, 0);
}

}


    // Generate a request for oracles to fetch flight information
    function fetchFlightStatus
    (
        address airline,
        string flight,
        uint256 timestamp                            
        )
    public
    {
        uint8 index = getRandomIndex(msg.sender);

        // Generate a unique key for storing the request
        bytes32 key = keccak256(abi.encodePacked(index, airline, flight, timestamp));
        oracleResponses[key] = ResponseInfo({
            requester: msg.sender,
            isOpen: true
            });

        emit OracleRequest(index, airline, flight, timestamp);
    }


    function getAirline(address airlineAddress)
    public
    view
    returns(
        bool isExist,
        bool registered,
        bool funded,
        uint votesCount,
        bytes32[] memory flightKeys,
        uint numberOfInsurance
        )
    {
        return dataContract.fetchAirlineData(airlineAddress);
    }

    function getFlight
    (
        address airlineAddress,
        string flightName,
        uint departureTime
        )
    public
    view
    returns(
        bool isRegistered,
        string memory name,
        uint256 departure,
        uint8 statusCode,
        uint256 updatedTimestamp,
        address airline
        )
    {
        bytes32 flightKey = getFlightKey(airlineAddress, flightName, departureTime);
        return (
            flights[flightKey].isRegistered,
            flights[flightKey].name,
            flights[flightKey].departure,
            flights[flightKey].statusCode,
            flights[flightKey].updatedTimestamp,
            flights[flightKey].airline

            );
    }

    function creditInsurees
    (
        address airlineAddress,
        string flightName,
        uint departureTime,
        uint _ticketNumber
        )
    public
    view
    returns(
        address buyer,
        address airline,
        uint value,
        uint ticketNumber,
        FlightSuretyData.InsuranceState state
        )
    {
        bytes32 flightKey = getFlightKey(airlineAddress, flightName, departureTime);
        bytes32 insuranceKey = getInsuranceKey(flightKey, _ticketNumber);

        return dataContract.fetchInsuranceData(insuranceKey);
    }

    function getInsurance
    (
        address airlineAddress,
        string flightName,
        uint departureTime,
        uint _ticketNumber
        )
    external
    view
    returns(
        address buyer,
        address airline,
        uint value,
        uint ticketNumber,
        FlightSuretyData.InsuranceState state
        )
    {
        bytes32 flightKey = getFlightKey(airlineAddress, flightName, departureTime);
        bytes32 insuranceKey = getInsuranceKey(flightKey, _ticketNumber);

        return dataContract.fetchInsuranceData(insuranceKey);
    }
    function getInsuranceKey
    (
        bytes32 flightKey,
        uint ticketNumber

        )
    internal
    pure
    returns(bytes32)
    {
        return keccak256(abi.encodePacked(flightKey, ticketNumber));
    }


    function getInsuranceKeysOfPassanger(address _address)
    public
    view
    returns(bytes32[] memory)
    {
        return dataContract.fetchPasengerInsurances(_address);
    }

    function getInsuranceKeysOfFlight
    (
        address airlineAddress,
        string flightName,
        uint departureTime
        )
    public
    view
    returns(bytes32[] memory)
    {
        bytes32 flightKey = getFlightKey(airlineAddress, flightName, departureTime);
        return dataContract.fetchFlightInsurances(flightKey);
    }

    function buyInsurance
    (
        address airlineAddress,
        string flightName,
        uint256 departure,
        uint256 ticketNumber
        )
    public
    payable
    requireIsOperational
    {
        require(msg.value > 0, "Insurance can accept more than 0");
        require(msg.value <= 1 ether, "Insurance can accept less than 1 ether");

        bytes32 flightKey = getFlightKey(airlineAddress, flightName, departure);
        bytes32 insuranceKey = getInsuranceKey(flightKey, ticketNumber);

        dataContract.buyInsurance.value(msg.value)(msg.sender, insuranceKey);

        emit InsuranceBought(insuranceKey);
    }


    function payInsurance
    (
        address airlineAddress,
        string flightName,
        uint256 departure,
        uint ticketNumber
        )
    public
    requireIsOperational
    {
        bytes32 flightKey = getFlightKey(airlineAddress, flightName, departure);
        bytes32 insuranceKey = getInsuranceKey(flightKey, ticketNumber);

        (
            address insuree,
            ,
            uint value,
            ,
            ) = dataContract.fetchInsuranceData(insuranceKey);

        require(insuree == msg.sender, "You do not own this insurance");

        dataContract.payInsuree(insuranceKey);
        emit CreditDrawed(value);

    }

// region ORACLE MANAGEMENT

    // Incremented to add pseudo-randomness at various points
    uint8 private nonce = 0;    

    // Fee to be paid when registering oracle
    uint256 public constant REGISTRATION_FEE = 10 ether;

    // Number of oracles that must respond for valid status
    uint256 private constant MIN_RESPONSES = 3;


    struct Oracle {
        bool isRegistered;
        uint8[3] indexes;        
    }

    // Track all registered oracles
    mapping(address => Oracle) private oracles;

    // Model for responses from oracles
    struct ResponseInfo {
        address requester;                              // Account that requested status
        bool isOpen;                                    // If open, oracle responses are accepted
        mapping(uint8 => address[]) responses;          // Mapping key is the status code reported
                                                        // This lets us group responses and identify
                                                        // the response that majority of the oracles
                                                    }

    // Track all oracle responses
    // Key = hash(index, flight, timestamp)
    mapping(bytes32 => ResponseInfo) private oracleResponses;

    // Event fired each time an oracle submits a response
    event FlightStatusInfo(address airline, string flight, uint256 timestamp, uint8 status);

    event OracleReport(address airline, string flight, uint256 timestamp, uint8 status);

    // Event fired when flight status request is submitted
    // Oracles track this and if they have a matching index
    // they fetch data and submit a response
    event OracleRequest(uint8 index, address airline, string flight, uint256 timestamp);


    // Register an oracle with the contract
    function registerOracle
    (
        )
    public
    payable
    {
        // Require registration fee
        require(msg.value >= REGISTRATION_FEE, "Registration fee is required");

        uint8[3] memory indexes = generateIndexes(msg.sender);

        oracles[msg.sender] = Oracle({
            isRegistered: true,
            indexes: indexes
            });
        emit OracleRegistered( msg.sender, oracles[msg.sender].isRegistered);
    }

    function getMyIndexes
    (
        )
    view
    public
    returns(uint8[3])
    {
        require(oracles[msg.sender].isRegistered, "Not registered as an oracle");
        return oracles[msg.sender].indexes;
    }




    // Called by oracle when a response is available to an outstanding request
    // For the response to be accepted, there must be a pending request that is open
    // and matches one of the three Indexes randomly assigned to the oracle at the
    // time of registration (i.e. uninvited oracles are not welcome)
    function submitOracleResponse
    (
        uint8 index,
        address airline,
        string flight,
        uint256 timestamp,
        uint8 statusCode
        )
    public
    {
        require((oracles[msg.sender].indexes[0] == index) || (oracles[msg.sender].indexes[1] == index) || (oracles[msg.sender].indexes[2] == index), "Index does not match oracle request");


        bytes32 key = keccak256(abi.encodePacked(index, airline, flight, timestamp)); 
        require(oracleResponses[key].isOpen, "Flight or timestamp do not match oracle request");

        oracleResponses[key].responses[statusCode].push(msg.sender);

        // Information isn't considered verified until at least MIN_RESPONSES
        // oracles respond with the *** same *** information
        emit OracleReport(airline, flight, timestamp, statusCode);


        if (oracleResponses[key].responses[statusCode].length >= MIN_RESPONSES) {
            oracleResponses[key].isOpen = false;
            emit FlightStatusInfo(airline, flight, timestamp, statusCode);

            // Handle flight status as appropriate
            processFlightStatus(airline, flight, timestamp, statusCode);
        }
    }


    function getFlightKey
    (
        address airline,
        string flight,
        uint256 timestamp
        )
    pure
    internal
    returns(bytes32) 
    {
        return keccak256(abi.encodePacked(airline, flight, timestamp));
    }

    // Returns array of three non-duplicating integers from 0-9
    function generateIndexes
    (                       
        address account         
        )
    internal
    returns(uint8[3])
    {
        uint8[3] memory indexes;
        indexes[0] = getRandomIndex(account);
        
        indexes[1] = indexes[0];
        while(indexes[1] == indexes[0]) {
            indexes[1] = getRandomIndex(account);
        }

        indexes[2] = indexes[1];
        while((indexes[2] == indexes[0]) || (indexes[2] == indexes[1])) {
            indexes[2] = getRandomIndex(account);
        }

        return indexes;
    }

    // Returns array of three non-duplicating integers from 0-9
    function getRandomIndex
    (
        address account
        )
    internal
    returns (uint8)
    {
        uint8 maxValue = 10;

        // Pseudo random number...the incrementing nonce adds variation
        uint8 random = uint8(uint256(keccak256(abi.encodePacked(blockhash(block.number - nonce++), account))) % maxValue);

        if (nonce > 250) {
            nonce = 0;  // Can only fetch blockhashes for last 256 blocks so we adapt
        }

        return random;
    }

// endregion

}   
