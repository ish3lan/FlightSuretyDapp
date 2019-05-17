
import DOM from './dom';
import Contract from './contract';
import './flightsurety.css';


(async() => {

    let result = null;

    let contract = new Contract('localhost', () => {
        // Read transaction
        contract.isOperational((error, result) => {
            console.log("Next display is operational.");
            display('Operational Status', 'Check if contract is operational', [ { label: 'Operational Status', error: error, value: result} ]);
        });


        // User-submitted transaction
        DOM.elid('submit-oracle').addEventListener('click', () => {
            let flight = DOM.elid('flight-number').value;
            // Write transaction
            contract.fetchFlightStatus(flight, (error, result) => {
                console.log(result);
                display('Oracles', 'Trigger oracles', [ { label: 'Fetch Flight Status', error: error, value: result.name + ' ' + result.departure} ]);
            });
        })

        DOM.elid('buy-insurance').addEventListener('click', async () => {
            let amount = DOM.elid('ether-amount').value;
            let flight = DOM.elid('flight-number').value;
            let ticket = DOM.elid('ticket-number').value;
            await contract.purchaseInsurance(flight, ticket, amount, (error, result) => {
                console.log(result);
                display(
                    'Buy Insurance', '', [{ label: 'Flight', error: error, value: result.flight.name + ' ' + result.flight.departure }, { label: 'Ticket', value: result.ticket }, ]);

            });
        })

        DOM.elid('pay-insurance').addEventListener('click', async() => {
            let flight = DOM.elid('flight-number').value;
            let ticket = DOM.elid('ticket-number').value;
            // Write transaction
            await contract.withdrawCredit(flight, ticket, (error, result) => {
                display(
                    'Insurance', 'Insurance credit withdrow', [{ label: 'Flight', error: error, value: result.flight.name + ' ' + result.flight.departure },]);
            });
        })
        DOM.elid('get-insurance').addEventListener('click', async() => {
            let id = DOM.elid('id-block').value;
            let airlineAddress = DOM.elid('airline-address').value;
            let flight = DOM.elid('flight-number').value;

            // Write transaction
            await contract.getInsuranceData(id, airlineAddress,flight, (error, result) => {
                display(
                    'Insurance', 'Insurance Information', [{ label: 'Flight', error: 1, value:1}]);
            });
        })

    });

// console.log(contract);



})();


function display(title, description, results) {
    // console.log(`title $(title). discrition : $(description). result : $(result)`);
    let displayDiv = DOM.elid("display-wrapper");
    let section = DOM.section();
    section.appendChild(DOM.h2(title));
    section.appendChild(DOM.h5(description));
    results.map((result) => {
        let row = section.appendChild(DOM.div({className:'row'}));
        row.appendChild(DOM.div({className: 'col-sm-4 field'}, result.label));
        row.appendChild(DOM.div({className: 'col-sm-8 field-value'}, result.error ? String(result.error) : String(result.value)));
        section.appendChild(row);
    })
    displayDiv.append(section);

}







