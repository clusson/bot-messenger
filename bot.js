//
// This is main file containing code implementing the Express server and functionality for the Express echo bot.
//
'use strict'
const express = require('express')
const debug = require('debug')
const bodyParser = require('body-parser')
const request = require('request')
const receiver = require('./rabbit/receiver')
const publisher = require('./rabbit/publisher')
const conn = require('./rabbit/connectionService')

// The rest of the code implements the routes for our Express server.
const app = express()
const establishConnection = conn()
let userFName = ''
let userLName = ''

establishConnection.then((connectionEstablished) => {
    receiver(connectionEstablished)
})

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({
    extended: true
}))

function setGetStartedButton(res) {
    const messageData = {
        'get_started': {
            'payload': 'get_started'
        }
    }

    // Start the request
    request({
            url: 'https://graph.facebook.com/v2.6/me/messenger_profile?access_token=' + process.env.PAGE_ACCESS_TOKEN,
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            form: messageData
        },
        function(error, response, body) {
            if (!error && response.statusCode == 200) {
                // Print out the response body
                res.send('Bienvenue sur la page Thoune !')

            } else {
                // TODO: Handle errors
                res.send(body)
            }
        })
}

app.get('/setup', function(req, res) {
    setGetStartedButton(res)
})

// Webhook validation.
app.get('/webhook', function(req, res) {
    if (req.query['hub.mode'] === 'subscribe' &&
        req.query['hub.verify_token'] === process.env.VERIFY_TOKEN) {
        res.status(200).send(req.query['hub.challenge'])
    } else {
        res.sendStatus(403)
    }
})

// Message processing
app.post('/webhook', function(req, res) {
    const data = req.body

    // Make sure this is a page subscription
    if (data.object === 'page') {
        console.log(data)
        // Iterate over each entry - there may be multiple if batched
        data.entry.forEach(function(entry) {

            // Iterate over each messaging event
            entry.messaging.forEach(function(event) {
                if (event.message) {
                    receivedMessage(event)
                } else if (event.postback.payload == 'get_started') {
                    receivedPostback(event)
                } else {
                    debug.log('Webhook received unknown event: ', event)
                }
            })
        })

        res.sendStatus(200)
    }
})

// Incoming events handling
function receivedMessage(event) {
    console.log(event)
    const senderID = event.sender.id
    const recipientID = event.recipient.id
    const message = event.message
    const messageText = message.text
    const timestamp = event.timestamp
    const messageAttachments = message.attachments
    const messageId = message.mid

    const messageData = {
        'messageid': messageId,
        'content': messageText,
        'timestamp': timestamp.toString(),
        'userid': senderID,
        'recipient' : recipientID
    }

    if (messageText) {
        establishConnection.then((connectionEstablished) => {
            publisher(connectionEstablished, messageData)
        })
    }
}

function receivedPostback(event) {
    const userid = event.sender.id
    getProfile(userid).then(userData => {
        const senderID = userid
        const recipientID = event.recipient.id
        const messageText = event.postback.title
        const timestamp = Math.trunc(event.timestamp / 1000)
        const messageId = event.postback.title

        debug.log('Get user works ' + userData.last_name)

        const messageData = {
            'messageid': messageId,
            'content': messageText,
            'timestamp': timestamp.toString(),
            'userid': senderID,
            'recipient' : recipientID
        }
        const user = {
            'userid': userid,
            'nom': userData.last_name,
            'prenom': userData.first_name
        }

        establishConnection.then((connectionEstablished) => {
            publisher(connectionEstablished, messageData, user)
        })
    })
}


function getProfile(id) {
    return new Promise((resolve) => {
        const userPublicInfo = 'https://graph.facebook.com/v2.6/' + id + '?fields=first_name,last_name&access_token=' + process.env.PAGE_ACCESS_TOKEN
        request({
            method: 'GET',
            url: userPublicInfo,
            json: true,
            body: {}
        }, (error, response, body) => {
            if (!error && response.statusCode === 200) {

                resolve({
                    first_name: body.first_name,
                    last_name: body.last_name
                })
            }
        })
    })
}

//////////////////////////
// Sending helpers
//////////////////////////

// Set Express to listen out for HTTP requests
const server = app.listen(process.env.PORT, function() {
    debug.log('Listening on port %s', server.address().port)
})
