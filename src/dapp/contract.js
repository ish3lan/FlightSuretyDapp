import FlightSuretyApp from '../../build/contracts/FlightSuretyApp.json';
import Config from './config.json';
import Web3 from 'web3';
import FlightSuretyData from '../../build/contracts/FlightSuretyData.json';


export default class Contract {


    constructor(network, callback) {

        this.config = Config[network];
        // console.log("config is:  ");
        // console.log(this.config);
        this.web3 = new Web3(new Web3.providers.HttpProvider(this.config.url));
        this.flightSuretyApp = new this.web3.eth.Contract(FlightSuretyApp.abi, this.config.appAddress);
        this.flightSuretyData = new this.web3.eth.Contract(FlightSuretyData.abi, this.config.dataAddress);
        // console.log(this.web3.transactionConfirmationBlocks);
        this.owner = null;
        this.passenger = null;
        this.airlines = [];
        this.flights = {};
        this.initialize(callback);
        // let operationalStatus = this.isOperational(()=>{console.log});;



    }


    async initialize(callback) {



        let accounts = await this.web3.eth.getAccounts();

        this.owner = accounts[0];
        this.passenger = accounts[0];
        // console.log("owner is " + this.owner);
        const flightsNames = ['HR305', 'JR430', 'MH666', 'NN199'];

        const ticketsNumbers = [['321', '324'], ['433', '567'], ['132', '544'], ['635', '343']];
        
        for (var i = 0 ; i < flightsNames.length ; i++){
            console.log(flightsNames[i]);
            console.log(ticketsNumbers[i]);
        }

        console.log("Hello Passenger, your adress is: "+ this.passenger);

        try {
            await this.flightSuretyData.methods.authorizeCaller(this.config.appAddress)
            .send({from: this.owner, gas: 1500000});
            // console.log(this.config.appAddress);            
            // console.log("Done Await");
        } catch(e) {
            // console.log(e);
            // console.log(this.config);
        }
        
        // console.log(accounts);
        let airlinesAddresses = accounts.slice(1,5);
        let firstAirline = airlinesAddresses[0];
        // console.log(airlinesAddresses);
        // console.log(firstAirline);


        let firstAirlineRegistered = await this.flightSuretyData.methods.airlineRegistered(firstAirline).call({from:this.owner, gas: 1500000});
        // console.log(firstAirlineRegistered);
        for(let i=0; i<2; i++) {

            if(i > 0 ){
                try {

                    // console.log("will register a new airline");
                    await this.flightSuretyApp.methods
                    .registerAirline(airlinesAddresses[i])
                    .send({from: firstAirline, gas: 1500000});
                    console.log(`Done registering airline ${airlinesAddresses[i]} by: ${firstAirline}`);
                    console.log(await this.flightSuretyData.methods.airlineRegistered(airlinesAddresses[i]).call({from:this.owner, gas: 1500000}));
                } catch (e) { 
                    console.log(`Error while registring new airline, address: ${airlinesAddresses[i]}\n${e}, and submitter ${firstAirline}`) 
                }
            }
            try {
                await this.flightSuretyApp.methods
                .fundAirline(airlinesAddresses[i])
                .send({
                    from: airlinesAddresses[i], 
                    value: this.web3.utils.toWei('10', "ether"),
                    gas: 1500000
                });
                console.log(`Done funding airline ${airlinesAddresses[i]} by: ${airlinesAddresses[i]}`);
                console.log(await this.flightSuretyData.methods.airlineFunded(airlinesAddresses[i]).call({from:this.owner, gas: 1500000}));

                // console.log(airlinesAddresses[i]);
            } catch (e) { 
                console.log(`Error while funding airline ${i}, address: ${airlinesAddresses[i]}\n${e.message}`);
            }

            this.flights[flightsNames[i]] = {
                airlineAddress: airlinesAddresses[i],
                name: flightsNames[i],
                departure: Math.floor(new Date(2019, 3, 1, 22, 30, 0, 0) / 1000),
                tickets: ticketsNumbers[i]
            };

            try {
                await this.flightSuretyApp.methods
                .registerFlight(
                    this.flights[flightsNames[i]].departure,
                    ticketsNumbers[i],
                    this.flights[flightsNames[i]].name
                    )
                .send({from: airlinesAddresses[i], gas: 1500000});
                console.log(`Done registering new flight for airline, address: ${airlinesAddresses[i]}\n${this.flights[flightsNames[i]].name}`) 
            } catch (e) { 
                console.log(`Error while register new flight for airline, address: ${airlinesAddresses[i]}\n${e.message}`) 
            }

            let airline = await this.flightSuretyApp.methods.getAirline(airlinesAddresses[i]).call();
            console.log(`Airline Name: ${airline.name} has ben registered ${airline.registered} and funded ${airline.funded} with Address: ${airlinesAddresses[i]}`);
            // console.log(airline);

            let insurance1 = await this.flightSuretyApp.methods
            .getInsurance(
                airlinesAddresses[i],
                this.flights[flightsNames[i]].name,
                this.flights[flightsNames[i]].departure,
                this.flights[flightsNames[i]].tickets[0],
                )
            .call();
            let insurance2 = await this.flightSuretyApp.methods
            .getInsurance(
                airlinesAddresses[i],
                this.flights[flightsNames[i]].name,
                this.flights[flightsNames[i]].departure,
                this.flights[flightsNames[i]].tickets[1],
                )
            .call();

            console.log(`And registered flight number: ✈️ '${flightsNames[i]}' with tickets numbers: (🎫${insurance1.ticketNumber}, 🎫${insurance2.ticketNumber})`);
            console.log(insurance1) ; 
        }
        // console.log("will callback");
        callback();
    }

    isOperational(callback) {
        let self = this;
        console.log("will call is operational");
        self.flightSuretyApp.methods
        .isOperational()
        .call({ from: self.owner, gas: 1500000}, callback);
    }

    fetchFlightStatus(flightName, callback) {
        let self = this;
        self.flightSuretyApp.methods
        .fetchFlightStatus(
            self.flights[flightName].airlineAddress,
            self.flights[flightName].name,
            Math.floor(Date.now() / 1000)
            )
        .send({ from: self.owner, gas: 1500000}, (err, res) => {
            callback(err, self.flights[flightName])
        });
    }

    async getInsuranceData(i,airlineAddress,flightName){
        let self = this;
         console.log(i);
         console.log(airlineAddress);
         console.log(flightName);
        let insur = await this.flightSuretyApp.methods
        .getInsurance(
            airlineAddress,
            this.flights[flightName].name,
            this.flights[flightName].departure,
            this.flights[flightName].tickets[1],
            )
        .call();
        console.log(insur); 

        
    }

    purchaseInsurance(flightName, ticketNumber, amount, callback){
        let self = this;

        this.flightSuretyApp.methods
        .buyInsurance(
            self.flights[flightName].airlineAddress,
            self.flights[flightName].name,
            self.flights[flightName].departure,
            ticketNumber
            )
        .send({
            from: self.passenger,
            value: self.web3.utils.toWei(amount, "ether"),
            gass: 1500000,
        }, (err, res) =>{console.log(res); callback(err, {flight: self.flights[flightName], ticket: ticketNumber})});
        
    }

    withdrawCredit(flightName, ticketNumber, callback) {
        let self = this;
        
        this.flightSuretyApp.methods
        .payInsurance(
            self.flights[flightName].airlineAddress,
            self.flights[flightName].name,
            self.flights[flightName].departure,
            ticketNumber
            )
        .send({
            from: self.passenger,
            gass: 1500000,
        }, (err, res) => callback(err, {flight: self.flights[flightName], ticket: ticketNumber}));
    }
}
//     constructor(network, callback) {

//         let config = Config[network];
//         this.web3 = new Web3(new Web3.providers.HttpProvider(config.url));
//         this.flightSuretyApp = new this.web3.eth.Contract(FlightSuretyApp.abi, config.appAddress);
//         this.initialize(callback);
//         this.owner = null;
//         this.airlines = [];
//         this.passengers = [];
//     }

//     initialize(callback) {
//         this.web3.eth.getAccounts((error, accts) => {

//             this.owner = accts[0];

//             let counter = 1;

//             while(this.airlines.length < 5) {
//                 this.airlines.push(accts[counter++]);
//             }

//             while(this.passengers.length < 5) {
//                 this.passengers.push(accts[counter++]);
//             }

//             callback();
//         });
//     }

//     isOperational(callback) {
//        let self = this;
//        self.flightSuretyApp.methods
//             .isOperational()
//             .call({ from: self.owner}, callback);
//     }

//     fetchFlightStatus(flight, callback) {
//         let self = this;
//         let payload = {
//             airline: self.airlines[0],
//             flight: flight,
//             timestamp: Math.floor(Date.now() / 1000)
//         } 
//         self.flightSuretyApp.methods
//             .fetchFlightStatus(payload.airline, payload.flight, payload.timestamp)
//             .send({ from: self.owner}, (error, result) => {
//                 callback(error, payload);
//             });
//     }
// }