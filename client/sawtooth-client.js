const { randomBytes, createHash } = require('crypto')
const axios = require('axios')
const cbor = require('cbor')
const protobuf = require('sawtooth-sdk/protobuf')
const fs = require('fs')
const leafHash = (input) => {
    return createHash('sha512').update(input).digest('hex').toLowerCase().slice(0, 64)
}

const SawtoothClientFactory = (factoryOptions) => {
    return {
        asyncget(url) {
            try {
                const res = axios({
                    method: 'get',
                    baseURL: factoryOptions.restApiUrl,
                    url
                })
                return res
            } catch (err) {
                console.log('error', err)
            }
        },
        newTransactor(transactorOptions) {
            const _familyNamespace = transactorOptions.familyNamespace || leafHash(transactorOptions.familyName).substring(0, 6)
            const _familyVersion = transactorOptions.familyVersion || '1.0'
            const _familyEncoder = transactorOptions.familyEncoder || cbor.encode
            return {
                async post(payload, txnOptions) {


                    const payloadBytes = _familyEncoder(payload)


                    const transactionHeaderBytes = protobuf.TransactionHeader.encode({
                        familyName: transactorOptions.familyName,
                        familyVersion: _familyVersion,
                        inputs: [_familyNamespace],
                        outputs: [_familyNamespace],
                        signerPublicKey: factoryOptions.enclave.publicKey.toString('hex'),
                        batcherPublicKey: factoryOptions.enclave.publicKey.toString('hex'),
                        dependencies: [],
                        nonce: randomBytes(32).toString('hex'),
                        payloadSha512: createHash('sha512').update(payloadBytes).digest('hex'),
                        ...txnOptions
                    }).finish()

                    const txnSignature = factoryOptions.enclave.sign(transactionHeaderBytes).toString('hex')

                    const transaction = protobuf.Transaction.create({
                        header: transactionHeaderBytes,
                        headerSignature: txnSignature,
                        payload: payloadBytes
                    })

                    const transactions = [transaction]
                    const batchHeaderBytes = protobuf.BatchHeader.encode({
                        signerPublicKey: factoryOptions.enclave.publicKey.toString('hex'),
                        transactionIds: transactions.map((txn) => txn.headerSignature),
                    }).finish()

                    const batchSignature = factoryOptions.enclave.sign(batchHeaderBytes).toString('hex')
                    const batch = protobuf.Batch.create({
                        header: batchHeaderBytes,
                        headerSignature: batchSignature,
                        transactions: transactions
                    })


                    const batchListBytes = protobuf.BatchList.encode({
                        batches: [batch]
                    }).finish()


                    try {
                        const res = await axios({
                            method: 'post',
                            baseURL: factoryOptions.restApiUrl,
                            url: '/batches',
                            headers: { 'Content-Type': 'application/octet-stream' },
                            data: batchListBytes
                        })
                        return res
                    } catch (err) {
                        console.log('error', err)
                    }

                }
            }
        }
    }
}

module.exports = {
    leafHash,
    SawtoothClientFactory
}