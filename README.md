# Sawtooth-loginForm
Hyperledger Sawtooth loginForm


1.Transaction Processor:

When transactions comes through from clients and go toward the rest api its the job of the validator to route out those to the right transaction processor/transaction family which does the business logic. With regard to the code on the repository we will walk through the core steps/procedures followed for our Transaction processor section:

we import the transaction processor function from the library and create a new object which connects to specific validator (tcp://localhost:4004)(imported from env.).
followed by the import we add a handler function on the tp object which is import from javascript file.
finally by using start() we initiate our transaction processor,while listening to 4004 port.

On the sequel we have int.js where we receive and store the payload which is being sent from the payload. 
we initialize it by loading up with class handler and hash function(crypto) SHA251 for it's purpose,
signers public key, also updates the input output where the addresses can be read from the ledger in the traction which makes data accessible/readable, we have the apply method to define all the business logic.
next we we decode the payload that we receive from client here, again we use cbor to serve its purpose, core aspect of the whole comes the role state address as paraphrased in the sawtooth documentation, Sawtooth stores its data within a Merkle tree comprising of 35 bytes, represented as 70 Hex characters. in short the first 6 character are mended with the namespace for the transaction processor to take place.
the transaction processor request object comprising of its header,header signature and payload,getting the payload from the header.
finally we have the function for storing our data to the state, here we have the context address and payload, we encode the payload then create a variable where we place the key on the address and payload is where our data are being processed and stored.


2.Client:

    Client serves as  a middleware it is the process of encoding the informations to be submitted which later validates and moves down to Transaction processor where the logic start it mostly serves as a data pre-processor. 


We will be using Hapi framework for connecting it to our login server (localhost:5000) from which we connected/created its path/server, 
 Alongside using MongoDB to store on the data we sent.
 furthermore using crypto module we hashed the private/public key, in brief we encoded the payload which we received from userdata.
payload/userdataser is a very important component in client side it is the actual raw data like in these case data we receive from the form manipulating the changes which is required to be applied to the state.
then the transactionHeader followed by creating the transaction which redirects us to the current routing address 
We then follow it up with the batches which are then submitted to the batchlist.
 Signing the batchheader into a list and finally posting them to validator via the REST api,which allows our client to communicate with the validator. 


The client section can easily be followed by crosschecking and executing the codes attached. .
