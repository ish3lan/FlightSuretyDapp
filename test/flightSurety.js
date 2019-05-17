
var Test = require('../config/testConfig.js');
var BigNumber = require('bignumber.js');
var TruffleAssert = require('truffle-assertions');

contract('Flight Surety Tests', async (accounts) => {

  var config;
  before('setup contract', async () => {
    config = await Test.Config(accounts);
    await config.flightSuretyData.authorizeCaller(config.flightSuretyApp.address);
  });

  /****************************************************************************************/
  /* Operations and Settings                                                              */
  /****************************************************************************************/

  it(`(multiparty) has correct initial isOperational() value`, async function () {

    // Get operating status
    let status = await config.flightSuretyData.isOperational.call();
    assert.equal(status, true, "Incorrect initial operating status value");

  });

  it(`(multiparty) can block access to setOperatingStatus() for non-Contract Owner account`, async function () {

      // Ensure that access is denied for non-Contract Owner account
      let accessDenied = false;
      try 
      {
        await config.flightSuretyData.setOperatingStatus(false, { from: config.testAddresses[2] });
      }
      catch(e) {
        accessDenied = true;
      }
      assert.equal(accessDenied, true, "Access not restricted to Contract Owner");

    });

  it(`(multiparty) can allow access to setOperatingStatus() for Contract Owner account`, async function () {

      // Ensure that access is allowed for Contract Owner account
      let accessDenied = false;
      try 
      {
        await config.flightSuretyData.setOperatingStatus(false);
      }
      catch(e) {
        accessDenied = true;
      }
      assert.equal(accessDenied, false, "Access not restricted to Contract Owner");

    });

  it(`(multiparty) can block access to functions using requireIsOperational when operating status is false`, async function () {

    await config.flightSuretyData.setOperatingStatus(false);

    let reverted = false;
    try 
    {
      await config.flightSurety.setTestingMode(true);
    }
    catch(e) {
      reverted = true;
    }
    assert.equal(reverted, true, "Access not blocked for requireIsOperational");      

      // Set it back for other tests to work
      await config.flightSuretyData.setOperatingStatus(true);

    });



  it('(airline) cannot register an Airline using registerAirline() if it is not funded', async () => {
    // ARRANGE
    let newAirline = accounts[2];
    // ACT
    try {
      await config.flightSuretyApp.registerAirline(newAirline, {from: config.firstAirline});
    }
    catch(e) {
    }

    let result = await config.flightSuretyData.airlineRegistered.call(newAirline); 
    // ASSERT
    assert.equal(result, false, "Airline was able to register another airline given it hasn't provided funding");

  });




  it('(airline) can fund itself', async () => {

    await config.flightSuretyData.AirlineFunded((error, res)=>{
    });
    //ARRANGE
    let newAirline = accounts[8];
    let startingFundedCount = await config.flightSuretyData.getFundedAirlinesCount.call();
    // ACT
    try {
      await config.flightSuretyApp.fundAirline(config.firstAirline, {from: config.firstAirline, value: web3.utils.toWei('10', "ether")});

    }
    catch(e) {
    }

    let endingFundedCount = await config.flightSuretyData.getFundedAirlinesCount.call();
    assert.equal(endingFundedCount.toNumber(), startingFundedCount.toNumber() + 1 , "funded count did not increase");


    let result = await config.flightSuretyData.airlineFunded.call(config.firstAirline); 

    // ASSERT
    assert.equal(result, true, "Airline funding is not successful");

  });

  it('(airline) can register an Airline using registerAirline() if it is funded', async () => {

    // ARRANGE
    let newAirline = accounts[3];
    // ACT
    try {
      await config.flightSuretyApp.fundAirline(config.firstAirline, {from: config.firstAirline,value: web3.utils.toWei('10', "ether")});
      await config.flightSuretyApp.registerAirline(newAirline, {from: config.firstAirline});
    }
    catch(e) {
      assert.equal(false, true, "Error in try");
    }
    let result = await config.flightSuretyData.airlineRegistered.call(newAirline); 

    // ASSERT
    assert.equal(result, true, "Airline was not able to register another airline given it was funded");

  });

  it('(airline) can vote for an Airline  voteForAirline() if it is funded', async () => {


    // ARRANGE
    let newAirline = accounts[4];
    console.log(newAirline);
    let startVoteCount = 0;
    // ACT
    try {
      await config.flightSuretyApp.fundAirline(config.firstAirline, {from: config.firstAirline,value: web3.utils.toWei('10', "ether")});
      await config.flightSuretyApp.registerAirline(newAirline, {from: config.firstAirline});
      startVoteCount = await config.flightSuretyData.getAirlineVotesCount.call(newAirline, {from: config.firstAirline});
      console.log(startVoteCount.toNumber());
      await config.flightSuretyApp.voteForAirline(newAirline, {from: config.firstAirline});
    }
    catch(e) {
      assert.equal(e, true, "Error in try");
    }
    let endVoteCount = await config.flightSuretyData.getAirlineVotesCount.call(newAirline, {from: config.firstAirline});
    console.log(endVoteCount.toNumber());

    // ASSERT
    assert.equal(endVoteCount.toNumber(), startVoteCount.toNumber() + 1, "Funded airline was not able to vote for a registered airline");

  });




  it('5th (airline) will be added but not registered', async () => {


    // ARRANGE
    let startingRegistereAirlineCount = await config.flightSuretyData.getRegisteredAirlinesCount.call( {from: config.firstAirline});
    let startingExistAirlineCount = await config.flightSuretyData.getExistAirlinesCount.call({from: config.firstAirline});

    // ACT
    try {
      await config.flightSuretyApp.fundAirline(config.firstAirline, {from: config.firstAirline,value: web3.utils.toWei('10', "ether")});
      await config.flightSuretyApp.registerAirline(accounts[4], {from: config.firstAirline});
      await config.flightSuretyApp.registerAirline(accounts[5], {from: config.firstAirline});
      await config.flightSuretyApp.registerAirline(accounts[6], {from: config.firstAirline});
      await config.flightSuretyApp.registerAirline(accounts[7], {from: config.firstAirline});
    }
    catch(e) {
      assert.equal(e, true, "Error in try");
    }
    let endingRegistereAirlineCount = await config.flightSuretyData.getRegisteredAirlinesCount.call( {from: config.firstAirline});
    let endingExistAirlineCount = await config.flightSuretyData.getExistAirlinesCount.call({from: config.firstAirline});

    // console.log(startingRegistereAirlineCount.toNumber(), existAirlineCount.toNumber());

    // ASSERT
    assert.equal(startingExistAirlineCount.toNumber(), endingExistAirlineCount.toNumber() - 1 , "Funded airline was not able to vote for a registered airline");

  });



  it('5th (airline) will recieve vogtes till it get registered', async () => {


    // ARRANGE
    let newAirline = accounts[7];
    // let startVoteCount = 0;
    // let startingRegistereAirlineCount = await config.flightSuretyData.getRegisteredAirlinesCount.call( {from: config.firstAirline});
    // let startingExistAirlineCount = await config.flightSuretyData.getExistAirlinesCount.call({from: config.firstAirline});

    // ACT
    try {
      await config.flightSuretyApp.fundAirline(config.firstAirline, {from: config.firstAirline,value: web3.utils.toWei('10', "ether")});

      await config.flightSuretyApp.registerAirline(accounts[4], {from: config.firstAirline});
      await config.flightSuretyApp.fundAirline(accounts[4], {from: accounts[4],value: web3.utils.toWei('10', "ether")});
      await config.flightSuretyApp.registerAirline(accounts[5], {from: config.firstAirline});
      await config.flightSuretyApp.fundAirline(accounts[5], {from: accounts[5],value: web3.utils.toWei('10', "ether")});
      await config.flightSuretyApp.registerAirline(accounts[6], {from: config.firstAirline});
      await config.flightSuretyApp.fundAirline(accounts[6], {from: accounts[6],value: web3.utils.toWei('10', "ether")});
      await config.flightSuretyApp.registerAirline(newAirline, {from: config.firstAirline});
      // await config.flightSuretyApp.fundAirline(accounts[7], {from: accounts[7],value: web3.utils.toWei('10', "ether")});

      // startVoteCount = await config.flightSuretyData.getAirlineVotesCount.call(newAirline, {from: config.firstAirline});
      // console.log(startVoteCount.toNumber());
      await config.flightSuretyApp.voteForAirline(newAirline, {from: config.firstAirline});
      await config.flightSuretyApp.voteForAirline(newAirline, {from: accounts[4]});
      await config.flightSuretyApp.voteForAirline(newAirline, {from: accounts[5]});
      await config.flightSuretyApp.voteForAirline(newAirline, {from: accounts[6]});

    }
    catch(e) {
      assert.equal(e, true, "Error in try");
    }

    // startVoteCount = await config.flightSuretyData.getAirlineVotesCount.call(newAirline, {from: config.firstAirline});
    // console.log(startVoteCount.toNumber());

    // let endingRegistereAirlineCount = await config.flightSuretyData.getRegisteredAirlinesCount.call( {from: config.firstAirline});
    // let endingExistAirlineCount = await config.flightSuretyData.getExistAirlinesCount.call({from: config.firstAirline});
    // console.log(startingRegistereAirlineCount.toNumber(), startingExistAirlineCount.toNumber());
    // console.log(endingRegistereAirlineCount.toNumber(), endingExistAirlineCount.toNumber());
    let registrationStatus = await config.flightSuretyData.airlineRegistered(newAirline);
    // ASSERT
    assert.equal(registrationStatus, true , "Voting for airlines will make it registered if pass needed number");

  });
  describe(`\n🕴 Passengers 🔮`, async() => {

    it(`passenger can buy insurance for his ticket, event InsuranceBought emited`, async() => {
      console.log("config.passengers[0]");
      console.log(config.passengers[0]);
      await Test.passesWithEvent(
        'InsuranceBought',
        config.flightSuretyApp.buyInsurance(
          config.tickets[0].flight.airlineAddress,
          config.tickets[0].flight.name,
          config.tickets[0].flight.departure,
          config.tickets[0].number,
          {from: config.passengers[0] ,value: config.tickets[0].insuranceValue})
        );

      //extra insurance
      config.flightSuretyApp.buyInsurance(
        config.tickets[1].flight.airlineAddress,
        config.tickets[1].flight.name,
        config.tickets[1].flight.departure,
        config.tickets[1].number,
        {from: config.passengers[1] ,value: config.tickets[0].insuranceValue }
        )

      let insurance = await config.flightSuretyApp.getInsurance.call(
        config.tickets[0].flight.airlineAddress,
        config.tickets[0].flight.name,
        config.tickets[0].flight.departure,
        config.tickets[0].number,
        {from: config.passengers[1]}
        );

      assert.equal(insurance.buyer, config.passengers[0], "buyer of insurance did not match the data in contract");
      // InsuranceState.Bought == 2
      assert.equal(insurance.state, "2", "state of insurance not in bought state")
    });

    it(`passangers cannot buy insurance again`, async() => {
      TruffleAssert.reverts(
        config.flightSuretyApp.buyInsurance(
          config.tickets[0].flight.airlineAddress,
          config.tickets[0].flight.name,
          config.tickets[0].flight.departure,
          config.tickets[0].number,
          { from: config.passengers[0], value: config.tickets[0].insuranceValue }
          ),
        "Insurance allredy bought, or not exist or expired"
        )
    });

    it(`insurance cannot be bought with more than 1 ether`, async() => {
      TruffleAssert.reverts(
        config.flightSuretyApp.buyInsurance(
          config.tickets[1].flight.airlineAddress,
          config.tickets[1].flight.name,
          config.tickets[1].flight.departure,
          config.tickets[1].number,
          { from: config.passengers[1], value: web3.utils.toWei('1.1', "ether") }
          ),
        "Insurance can accept less than 1 ether"
        );
    });

    it(`data state will add insurance keys to its buyer (passanger) array`, async() => {
      let passangerInsuranceKeys = await config.flightSuretyApp.getInsuranceKeysOfPassanger.call(config.passengers[0],{from:config.owner});
      assert(passangerInsuranceKeys.length, 1)
    });

    it(`can request flight status, event OracleRequest emited`, async() => {
      await Test.passesWithEvent(
        'OracleRequest',
        config.flightSuretyApp.fetchFlightStatus(
          config.tickets[0].flight.airlineAddress,
          config.tickets[0].flight.name,
          config.tickets[0].flight.departure,
          {from: config.passengers[0]}
          )
        );

      // ticket2 asking for fetchFlightStatus
      await config.flightSuretyApp.fetchFlightStatus(
        config.tickets[1].flight.airlineAddress,
        config.tickets[1].flight.name,
        config.tickets[1].flight.departure,
        {from: config.passengers[1]}
        );
    });

    it(`oracles can update status code of flight using submitOracleResponse, event OracleReport emited`, async() => {
      let reseponseCounter = 0
      for (let i = 0; i < config.oracles.length; i++) {
        let oracleIndexes = await config.flightSuretyApp.getMyIndexes.call({from: config.oracles[i]});
        for (let idx = 0; idx < 3; idx++) {
          try {
            let tx = await config.flightSuretyApp.submitOracleResponse(
              oracleIndexes[idx], 
              config.tickets[0].flight.airlineAddress,
              config.tickets[0].flight.name,
              config.tickets[0].flight.departure,
              config.tickets[0].flight.statusCode,
              {from: config.oracles[i]}
              );

            reseponseCounter += 1;
            if (reseponseCounter >= 3) {
              TruffleAssert.eventEmitted(tx, 'FlightStatusInfo', (ev) => {
                console.log(`**--> Report from oracles[${i}].index[${idx}]:(${oracleIndexes[idx]}) 👏🏽👏🏽👏🏽👏🏽 updated flight with status code ${ev.status}`);
                return true;
              });
            } else {
              TruffleAssert.eventEmitted(tx, 'OracleReport', (ev) => {
                console.log(`--> Report from oracles[${i}].index[${idx}]:(${oracleIndexes[idx]}) 👏🏽 accepted with status code ${ev.status}`);
                return true;
              });
            }

          } catch(e) {
            if (e.reason != 'Flight or timestamp do not match oracle request')
              console.log(e)
          }
        }
      }
    });

    it(`oracles trying to manipulate status code will not change real world data`, async() => {
      let rightReseponseCounter = 0;
      let wrongReseponseCounter = 0;
      let tx;
      for (let i = 0; i < config.oracles.length; i++) {
        let oracleIndexes = await config.flightSuretyApp.getMyIndexes.call({from: config.oracles[i]});
        for (let idx = 0; idx < 3; idx++) {
          try {
            if (i == 1 || i == 5 || i == 10 || i == 15) {
              tx = await config.flightSuretyApp.submitOracleResponse(
                oracleIndexes[idx], 
                config.tickets[1].flight.airlineAddress,
                config.tickets[1].flight.name,
                config.tickets[1].flight.departure,
                config.STATUS_CODE.LATE_AIRLINE,
                {from: config.oracles[i]}
                );
              wrongReseponseCounter += 1;
            } else {
              tx = await config.flightSuretyApp.submitOracleResponse(
                oracleIndexes[idx], 
                config.tickets[1].flight.airlineAddress,
                config.tickets[1].flight.name,
                config.tickets[1].flight.departure,
                config.tickets[1].flight.statusCode,
                {from: config.oracles[i]}
                );
              rightReseponseCounter += 1;
            }

            if (rightReseponseCounter >= 3 || wrongReseponseCounter >= 3) {
              TruffleAssert.eventEmitted(tx, 'FlightStatusInfo', (ev) => {
                console.log(`**--> Report from oracles[${i}].index[${idx}]:(${oracleIndexes[idx]}) 👏🏽👏🏽👏🏽👏🏽 updated flight with status code ${ev.status}`);
                return true;
              });
            } else {
              TruffleAssert.eventEmitted(tx, 'OracleReport', (ev) => {
                console.log(`--> Report from oracles[${i}].index[${idx}]:(${oracleIndexes[idx]}) 👏🏽 accepted with status code ${ev.status}`);
                return true;
              });
            }

          } catch(e) {
            // if (e.reason != 'Flight or timestamp do not match oracle request')
            //   console.log(e)
          }
        }
      }
    });

    it(`flights status code updated after oracles respones`, async() => {
      let flight1 = await config.flightSuretyApp.getFlight.call(
        config.flights[0].airlineAddress,
        config.flights[0].name,
        config.flights[0].departure
        );

      assert.equal(flight1.statusCode, config.flights[0].statusCode);

      let flight2 = await config.flightSuretyApp.getFlight.call(
        config.flights[1].airlineAddress,
        config.flights[1].name,
        config.flights[1].departure
        );

      assert.equal(flight2.statusCode, config.flights[1].statusCode);
    });

    it(`value of insurance which bought by passenger credited after oracles respones if status code == 20`, async() => {
      let insurance = await config.flightSuretyApp.getInsurance.call(
        config.tickets[0].flight.airlineAddress,
        config.tickets[0].flight.name,
        config.tickets[0].flight.departure,
        config.tickets[0].number,
        );

      let insuranceValue15X = config.tickets[0].insuranceValue*1.5;

      assert.equal(insurance.value.toString(), insuranceValue15X.toString());
      // InsuranceState.Passed == 3
      assert.equal(insurance.state, '3');
    });

    it(`value of insurance which bought by passenger will not crideted after oracles respones if status code != 20`, async() => {
      let insurance = await config.flightSuretyApp.getInsurance.call(
        config.tickets[1].flight.airlineAddress,
        config.tickets[1].flight.name,
        config.tickets[1].flight.departure,
        config.tickets[1].number,
        );

      let insuranceValue15X = 0;

      assert.equal(insurance.value.toString(), insuranceValue15X.toString());
      // InsuranceState.Expired == 4
      assert.equal(insurance.state, '4');
    });

    it(`state of insurance which not bought by passenger should expire after oracles respones`, async() => {
      let insurance = await config.flightSuretyApp.getInsurance.call(
        config.flights[0].airlineAddress,
        config.flights[0].name,
        config.flights[0].departure,
        config.flights[0].extraTicketNumbers[0],
        );

      let insuranceValue15X = 0;

      assert.equal(insurance.value.toString(), insuranceValue15X.toString());
      // InsuranceState.Expired == 4
      assert.equal(insurance.state, '4');
    });

    it(`passanger who bought insurance for a flight and passed with status code == 20 can withdrow his insurance value`, async() => {
      let passengerBalanceBefore = new BigNumber(await web3.eth.getBalance(config.passengers[0]));
      let insuranceCredit15X = config.tickets[0].insuranceValue*1.5;

      await Test.passesWithEvent(
        'CreditDrawed',
        config.flightSuretyApp.payInsurance(
          config.tickets[0].flight.airlineAddress,
          config.tickets[0].flight.name,
          config.tickets[0].flight.departure,
          config.tickets[0].number,
          {from: config.passengers[0] }
          )
        );

      let passengerBalanceAfter = new BigNumber(await web3.eth.getBalance(config.passengers[0]));
      let passengerBalanceShouldBe = passengerBalanceBefore.plus(insuranceCredit15X);
      assert(passengerBalanceShouldBe.isGreaterThanOrEqualTo(passengerBalanceAfter) &&
        passengerBalanceAfter.isGreaterThan(passengerBalanceBefore)
        );
    });

  });

});
