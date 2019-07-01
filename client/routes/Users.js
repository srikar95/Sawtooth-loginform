'use strict'
let jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')
const User = require('../models/User')
const mongoose = require('mongoose')
process.env.SECRET_KEY = 'secret'
const { EnclaveFactory } = require('../enclave')
const { SawtoothClientFactory } = require('../sawtooth-client')
const argv = require('yargs')
const request = require('request')
const env = require('../env')

const enclave = EnclaveFactory(Buffer.from('288a2021f68a78f4ae41c249a0b5a47a5b3656f88629b326943cfe60b7b0c818', 'hex'))

const intkeyClient = SawtoothClientFactory({
    enclave: enclave,
    restApiUrl: env.restApiUrl
})

const intkeyTransactor = intkeyClient.newTransactor({
    familyName: env.familyName,
    familyVersion: env.familyVersion
})


process.env.SECRET_KEY = 'secret'

const newPayload = {
    register: (server, options, next) => {
        server.route({
                method: 'POST',
                path: '/register',
                handler: async(req, h) => {
                    const today = new Date()
                    const userData = {
                        first_name: req.payload.first_name,
                        last_name: req.payload.last_name,
                        email: req.payload.email,
                        password: req.payload.password,
                        created: today
                    }
                    const payload = userData
                    const postpayload = await intkeyTransactor.post(payload)
                    console.log('Response from the sawtooth client', postpayload.status, postpayload.statusText)

                    return User.findOne({
                            email: req.payload.email
                        })
                        .then(user => {
                            if (!user) {
                                bcrypt.hash(req.payload.password, 10, (err, hash) => {
                                    userData.password = hash
                                    return User.create(userData)
                                        .then(user => {
                                            return { status: user.email + ' Registered!' }
                                        })
                                        .catch(err => {
                                            return 'error: ' + err
                                        })
                                })
                                return userData
                            } else {
                                return { error: 'User already exists' }

                            }
                        })
                        .catch(err => {
                            return 'error: ' + err
                        })
                }
            }),
            server.route({
                method: 'POST',
                path: '/login',
                handler: (req, h) => {
                    return User.findOne({
                            email: req.payload.email
                        })
                        .then(user => {
                            if (user) {
                                if (bcrypt.compareSync(req.payload.password, user.password)) {
                                    const payload = {
                                        id: user._id,
                                        first_name: user.first_name,
                                        last_name: user.last_name,
                                        email: user.email
                                    }
                                    let token = jwt.sign(payload, process.env.SECRET_KEY, {
                                        expiresIn: 1440
                                    })
                                    return { token: token }
                                } else {
                                    return { error: 'User does not exist' }
                                }
                            } else {
                                return { error: 'User does not exist' }
                            }
                        })
                        .catch(err => {
                            return { error: err }
                        })
                }
            }),
            server.route({
                method: 'GET',
                path: '/profile',
                handler: (req, h) => {
                    var decoded = jwt.verify(
                        req.headers.authorization,
                        process.env.SECRET_KEY
                    )

                    return User.findOne({
                            _id: mongoose.Types.ObjectId(decoded.id)
                        })
                        .then(user => {
                            console.log(user)
                            if (user) {
                                return user
                            } else {
                                return 'User does not exist'
                            }
                        })
                        .catch(err => {
                            return 'error: ' + err
                        }),

                        request.post({
                            url: '/batches',
                            body: batchListBytes,
                            headers: { 'Content-Type': 'application/octet-stream' }
                        }, (err, response) => {
                            if (err) return console.log(err)
                            console.log(response.body)
                        })


                }
            })
    },
    name: 'users'
}



exports.plugin = newPayload;