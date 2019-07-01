const { TransactionProcessor } = require('sawtooth-sdk/processor')

const loginHandler = require('./int')
const env = require('./env')

const transactionProcessor = new TransactionProcessor(env.validatorUrl)


transactionProcessor.addHandler(new loginHandler())
transactionProcessor.start()
