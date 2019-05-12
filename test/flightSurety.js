
var Test = require('../config/testConfig.js');
var BigNumber = require('bignumber.js');

contract('Flight Surety Tests', async (accounts) => {

  var config;
  before('setup contract', async () => {
    config = await Test.Config(accounts);
    await config.flightSuretyData.authorizeCaller(config.flightSuretyApp.address);
  });

  /****************************************************************************************/
  /* Operations and Settings                                                              */
  /****************************************************************************************/

  // it(`(multiparty) has correct initial isOperational() value`, async function () {

  //   // Get operating status
  //   let status = await config.flightSuretyData.isOperational.call();
  //   assert.equal(status, true, "Incorrect initial operating status value");

  // });

  // it(`(multiparty) can block access to setOperatingStatus() for non-Contract Owner account`, async function () {

  //     // Ensure that access is denied for non-Contract Owner account
  //     let accessDenied = false;
  //     try 
  //     {
  //       await config.flightSuretyData.setOperatingStatus(false, { from: config.testAddresses[2] });
  //     }
  //     catch(e) {
  //       accessDenied = true;
  //     }
  //     assert.equal(accessDenied, true, "Access not restricted to Contract Owner");

  //   });

  // it(`(multiparty) can allow access to setOperatingStatus() for Contract Owner account`, async function () {

  //     // Ensure that access is allowed for Contract Owner account
  //     let accessDenied = false;
  //     try 
  //     {
  //       await config.flightSuretyData.setOperatingStatus(false);
  //     }
  //     catch(e) {
  //       accessDenied = true;
  //     }
  //     assert.equal(accessDenied, false, "Access not restricted to Contract Owner");

  //   });

  // it(`(multiparty) can block access to functions using requireIsOperational when operating status is false`, async function () {

  //   await config.flightSuretyData.setOperatingStatus(false);

  //   let reverted = false;
  //   try 
  //   {
  //     await config.flightSurety.setTestingMode(true);
  //   }
  //   catch(e) {
  //     reverted = true;
  //   }
  //   assert.equal(reverted, true, "Access not blocked for requireIsOperational");      

  //     // Set it back for other tests to work
  //     await config.flightSuretyData.setOperatingStatus(true);

  //   });



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




  // it('(airline) can fund itself', async () => {

  //   await config.flightSuretyData.AirlineFunded((error, res)=>{
  //   });
  //   //ARRANGE
  //   let newAirline = accounts[8];
  //   let startingFundedCount = await config.flightSuretyData.getFundedAirlinesCount.call();
  //   // ACT
  //   try {
  //     await config.flightSuretyApp.fundAirline(config.firstAirline, {from: config.firstAirline, value: web3.utils.toWei('10', "ether")});
  //     await config.flightSuretyApp.registerAirline(newAirline, {from: config.firstAirline});
  //     await config.flightSuretyApp.fundAirline(newAirline, {from: newAirline, value: web3.utils.toWei('10', "ether")});

  //   }
  //   catch(e) {
  //   }

  //   let endingFundedCount = await config.flightSuretyData.getFundedAirlinesCount.call();
  //   assert.equal(endingFundedCount.toNumber(), startingFundedCount.toNumber() + 2 , "funded count did not increase");


  //   let result = await config.flightSuretyData.airlineFunded.call(config.firstAirline); 
  //   let result2 = await config.flightSuretyData.airlineFunded.call(newAirline); 

  //   // ASSERT
  //   assert.equal(result, true, "Airline funding is not successful");
  //   assert.equal(result2, true, "2nd Airline funding is not successful");

  // });

  // it('(airline) can register an Airline using registerAirline() if it is funded', async () => {

  //   // ARRANGE
  //   let newAirline = accounts[3];
  //   // ACT
  //   try {
  //     await config.flightSuretyApp.fundAirline(config.firstAirline, {from: config.firstAirline,value: web3.utils.toWei('10', "ether")});
  //     await config.flightSuretyApp.registerAirline(newAirline, {from: config.firstAirline});
  //   }
  //   catch(e) {
  //     assert.equal(false, true, "Error in try");
  //   }
  //   let result = await config.flightSuretyData.airlineRegistered.call(newAirline); 

  //   // ASSERT
  //   assert.equal(result, true, "Airline was not able to register another airline given it was funded");

  // });

  // it('(airline) can vote for an Airline  voteForAirline() if it is funded', async () => {


  //   // ARRANGE
  //   let newAirline = accounts[4];
  //   console.log(newAirline);
  //   let startVoteCount = 0;
  //   // ACT
  //   try {
  //     await config.flightSuretyApp.fundAirline(config.firstAirline, {from: config.firstAirline,value: web3.utils.toWei('10', "ether")});
  //     await config.flightSuretyApp.registerAirline(newAirline, {from: config.firstAirline});
  //     startVoteCount = await config.flightSuretyData.getAirlineVotesCount.call(newAirline, {from: config.firstAirline});
  //     console.log(startVoteCount.toNumber());
  //     await config.flightSuretyApp.voteForAirline(newAirline, {from: config.firstAirline});
  //   }
  //   catch(e) {
  //     assert.equal(e, true, "Error in try");
  //   }
  //   let endVoteCount = await config.flightSuretyData.getAirlineVotesCount.call(newAirline, {from: config.firstAirline});
  //   console.log(endVoteCount.toNumber());

  //   // ASSERT
  //   assert.equal(endVoteCount.toNumber(), startVoteCount.toNumber() + 1, "Funded airline was not able to vote for a registered airline");

  // });




  // it('5th (airline) will be added but not registered', async () => {


  //   // ARRANGE
  //   let startingRegistereAirlineCount = await config.flightSuretyData.getRegisteredAirlinesCount.call( {from: config.firstAirline});
  //   let startingExistAirlineCount = await config.flightSuretyData.getExistAirlinesCount.call({from: config.firstAirline});

  //   // ACT
  //   try {
  //     await config.flightSuretyApp.fundAirline(config.firstAirline, {from: config.firstAirline,value: web3.utils.toWei('10', "ether")});
  //     await config.flightSuretyApp.registerAirline(accounts[4], {from: config.firstAirline});
  //     await config.flightSuretyApp.registerAirline(accounts[5], {from: config.firstAirline});
  //     await config.flightSuretyApp.registerAirline(accounts[6], {from: config.firstAirline});
  //     await config.flightSuretyApp.registerAirline(accounts[7], {from: config.firstAirline});
  //   }
  //   catch(e) {
  //     assert.equal(e, true, "Error in try");
  //   }
  //   let endingRegistereAirlineCount = await config.flightSuretyData.getRegisteredAirlinesCount.call( {from: config.firstAirline});
  //   let endingExistAirlineCount = await config.flightSuretyData.getExistAirlinesCount.call({from: config.firstAirline});

  //   console.log(registereAirlineCount.toNumber(), existAirlineCount.toNumber());

  //   // ASSERT
  //   assert.equal(registereAirlineCount.toNumber(), existAirlineCount.toNumber() - 1 , "Funded airline was not able to vote for a registered airline");

  // });



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

});
