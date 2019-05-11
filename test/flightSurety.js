
var Test = require('../config/testConfig.js');
var BigNumber = require('bignumber.js');

contract('Flight Surety Tests', async (accounts) => {

  var config;
  beforeEach('setup contract', async () => {
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



  // it('(airline) cannot register an Airline using registerAirline() if it is not funded', async () => {
  //   // ARRANGE
  //   let newAirline = accounts[2];
  //   // ACT
  //   try {
  //     await config.flightSuretyApp.registerAirline(newAirline, {from: config.firstAirline});
  //   }
  //   catch(e) {
  //   }

  //   let result = await config.flightSuretyData.airlineRegistered.call(newAirline); 
  //   // ASSERT
  //   assert.equal(result, false, "Airline was able to register another airline given it hasn't provided funding");

  // });




  it('(airline) can fund itself', async () => {
    config.flightSuretyData.AirlineFunded((error, res)=>{
    });
    // ACT
    try {
      await config.flightSuretyApp.fundAirline(config.firstAirline, {from: config.firstAirline, value: web3.utils.toWei('1', "ether")});
    }
    catch(e) {
    }


    let fundedCount = await config.flightSuretyData.getFundedAirlinesCount.call();
    assert.equal(fundedCount.toNumber(), 1 , "funded count does not match 1");


    let result = await config.flightSuretyData.airlineFunded.call(config.firstAirline); 
    // ASSERT
    assert.equal(result, true, "Airline funding is not successful");

  });


 // let fundingStatus = await config.flightSuretyData.airlineFunded.call(config.firstAirline); 
    // assert.equal(fundingStatus, false, "Starting funding status is true");
    // ARRANGE
    

    // config.flightSuretyData.AirlineRegistered((error, res)=>{
    // });

    // config.flightSuretyData.AirlineExist((error, res)=>{
    // });





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


});
