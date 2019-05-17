
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
        await TruffleAssert.passes(
          await config.flightSuretyApp.registerOracle({ from: config.oracles[i], value: fee })
          );
      }
    });

    it(`can get oracle indexes`, async() => {
      let result = await config.flightSuretyApp.getMyIndexes.call({from: config.oracles[1]});
      assert(result.length == 3);
    });

  });



  describe(`\n🕴 Passengers 🔮`, async() => {

    it(`passenger can buy insurance for his ticket, event InsuranceBought emited`, async() => {

      await Test.passesWithEvent(
        'InsuranceBought',
        config.flightSuretyApp.buyInsurance(
          config.tickets[0].flight.airlineAddress,
          config.tickets[0].flight.name,
          config.tickets[0].flight.departure,
          config.tickets[0].number,
          { from: config.passengers[0], value: config.tickets[0].insuranceValue }
          )
        );

      //extra insurance
      config.flightSuretyApp.buyInsurance(
        config.tickets[1].flight.airlineAddress,
        config.tickets[1].flight.name,
        config.tickets[1].flight.departure,
        config.tickets[1].number,
        { from: config.passengers[1], value: config.tickets[0].insuranceValue }
        )

      let insurance = await config.flightSuretyApp.getInsurance(
        config.tickets[0].flight.airlineAddress,
        config.tickets[0].flight.name,
        config.tickets[0].flight.departure,
        config.tickets[0].number
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
      let passangerInsuranceKeys = await config.flightSuretyApp.getInsuranceKeysOfPassanger(config.passengers[0]);
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
          { from: config.passengers[0] }
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


