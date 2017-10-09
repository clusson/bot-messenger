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

establishConnection.then((connectionEstablished) => {
  receiver(connectionEstablished)
})

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({
  extended: true
}))

function setGetStartedButton(res){
  const messageData = {
    'get_started':{
      'payload':'get_started'
    }
  }

  // Start the request
  request({
      url: 'https://graph.facebook.com/v2.6/me/messenger_profile?access_token='+ process.env.PAGE_ACCESS_TOKEN,
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      form: messageData
  },
  function (error, response, body) {
      if (!error && response.statusCode == 200) {
          // Print out the response body
          res.send(body)

      } else { 
          // TODO: Handle errors
          res.send(body)
      }
  })
}     

app.get('/setup',function(req,res){
  setGetStartedButton(res)
})

// Webhook validation.
app.get('/webhook', function (req, res) {
  if (req.query['hub.mode'] === 'subscribe' &&
    req.query['hub.verify_token'] === process.env.VERIFY_TOKEN) {
    res.status(200).send(req.query['hub.challenge'])
  } else {
    res.sendStatus(403)
  }
})

// Message processing
app.post('/webhook', function (req, res) {
  const data = req.body

  // Make sure this is a page subscription
  if (data.object === 'page') {

    // Iterate over each entry - there may be multiple if batched
    data.entry.forEach(function (entry) {

      // Iterate over each messaging event
      entry.messaging.forEach(function (event) {
        if (event.message) {
          receivedMessage(event)
        } else if (event.postback && event.postback.payload === 'get_started') {
          receivedPostback(event)
        } else {
          debug.log('Webhook received unknown event: ', event)
        }
      })
    })

    // Assume all went well.
    //
    // You must send back a 200, within 20 seconds, to let us know
    // you've successfully  the callback. Otherwise, the request
    // will time out and we will keep trying to resend.
    res.sendStatus(200)
  }
})

// Incoming events handling
function receivedMessage(event) {
  const senderID = event.sender.id
  const message = event.message
  const messageText = message.text
  const timestamp = event.timestamp.toString()
  const messageAttachments = message.attachments
  const messageId = message.mid

  const messageData = {
    'messageid': messageId,
    'content': messageText,
    'timestamp': timestamp,
    'userid': senderID
  }

  if (messageText) {
    establishConnection.then((connectionEstablished) => {
      publisher(connectionEstablished, messageData)
    })
  }
}

function receivedPostback(event) {

  // When a postback is called, we'll send a message back to the sender to
  // let them know it was successful
  sendFirst(event, event.user)
}

function sendFirst(event, user) {
  const messageData = {
    message: {
      'messageid': event.message.mid,
      'content': event.message.text,
      'timestamp': event.timestamp.toString(),
      'userid': event.sender.id
    },
    user: {
      //NOT SURE
      'nom': user.last_name,
      'prenom': user.first_name,
      'userid': event.senderID
    }
  }

  establishConnection.then((connectionEstablished) => {
    publisher(connectionEstablished, messageData, user)
  })
}


//////////////////////////
// Sending helpers
//////////////////////////



// Set Express to listen out for HTTP requests
const server = app.listen(process.env.PORT, function () {
  debug.log('Listening on port %s', server.address().port)
})
