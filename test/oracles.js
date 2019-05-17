
var Test = require('../config/testConfig.js');
var BigNumber = require('bignumber.js');
var TruffleAssert = require('truffle-assertions');

contract('Oracles', async (accounts) => {

  const TEST_ORACLES_COUNT = 20;
  var config;
  before('setup contract', async () => {
    config = await Test.Config(accounts);

    // Watch contract events
    const STATUS_CODE_UNKNOWN = 0;
    const STATUS_CODE_ON_TIME = 10;
    const STATUS_CODE_LATE_AIRLINE = 20;
    const STATUS_CODE_LATE_WEATHER = 30;
    const STATUS_CODE_LATE_TECHNICAL = 40;
    const STATUS_CODE_LATE_OTHER = 50;

  });




  describe(`\n🕴 Oracles 🔮`, async() => {
    it('can register oracles', async () => {
      // ARRANGE
      let fee = await config.flightSuretyApp.REGISTRATION_FEE.call();
      // ACT
      for(let i=0; i<config.oracles.length; i++) {
        console.log("Will register Oracle"+i);
        await TruffleAssert.passes(
          await config.flightSuretyApp.registerOracle({ from: config.oracles[i], value: fee }));
        console.log("Done Registering Oracle"+i);
      }
    });

    it(`can get oracle indexes`, async() => {
      let fee = await config.flightSuretyApp.REGISTRATION_FEE.call();
      await config.flightSuretyApp.registerOracle({ from: config.oracles[0], value: fee })
      let result = await config.flightSuretyApp.getMyIndexes({from: config.oracles[0]});
      assert(result.length == 3);
    });

  });



 

});


