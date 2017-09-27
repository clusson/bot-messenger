//
// This is main file containing code implementing the Express server and functionality for the Express echo bot.
//
'use strict'
const express = require('express')
const bodyParser = require('body-parser')
const request = require('request')
const receiver = require('./rabbit/receiver')
const publisher = require('./rabbit/publisher')
const conn = require('./rabbit/connectionService')

// The rest of the code implements the routes for our Express server.
const app = express()

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({
  extended: true
}))

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
        } else if (event.postback) {
          if (event.postback.payload === 'get_started') {
            receivedPostback(event)
          }
        } else {
          console.log('Webhook received unknown event: ', event)
        }
      })
    })

    // Assume all went well.
    //
    // You must send back a 200, within 20 seconds, to let us know
    // you've successfully received the callback. Otherwise, the request
    // will time out and we will keep trying to resend.
    res.sendStatus(200)
  }
})

function getUser(response) {
  var usersPublicProfile = 'https://graph.facebook.com/v2.6/' + response.user + '?fields=first_name,last_name,&access_token=' + process.env.page_token
  request({
    url: usersPublicProfile,
    json: true // parse
  }, function (error, response) {
    if (!error && response.statusCode === 200) {
      return usersPublicProfile
    }
  })
}

// Incoming events handling
function receivedMessage(event) {
  var senderID = event.sender.id
  var message = event.message

  var messageText = message.text
  var messageAttachments = message.attachments
  var user = getUser()
  if (messageText) {
    console.log('text message ok')
    // If we receive a text message, check to see if it matches a keyword
    // and send back the template example. Otherwise, just echo the text we received.
    switch (messageText) {
      case 'generic':
        sendGenericMessage(senderID)
        break

      default:
        conn.then(
          console.log('conn publish OK'),
          publisher(conn, message)
        )
        sendTextMessage(senderID, messageText)
    }
  } else if (messageAttachments) {
    sendTextMessage(senderID, user, 'Message with attachment received')
  }
}

function receivedPostback(event) {
  var senderID = event.sender.id
  var user = getUser()
  // When a postback is called, we'll send a message back to the sender to
  // let them know it was successful
  sendFirstMessage(senderID, user, 'Postback called')
}

function sendFirstMessage(recipientId, user, messageText) {

  var messageData = {
    user: {
      id: recipientId,
      lastname: user.lastname,
      firstname: user.firstname
    },
    message: {
      text: messageText
    },
    timestamp: {
      time: user.timestamp
    }
  }

  callSendAPI(messageData)
}


//////////////////////////
// Sending helpers
//////////////////////////
function sendTextMessage(recipientId, user, messageText) {

  var messageData = {
    userId: {
      id: recipientId
    },
    message: {
      text: messageText
    },
    timestamp: {
      time: user.timestamp
    }
  }
  callSendAPI(messageData)
}

function sendGenericMessage(recipientId) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      attachment: {
        type: 'template',
        payload: {
          template_type: 'generic',
          elements: [{
            title: 'epsi',
            subtitle: ' ',
            item_url: 'http://epsi.fr',
            image_url: 'https://pbs.twimg.com/profile_images/690614801651859456/HBZe85Sz.png',
            buttons: [{
              type: 'web_url',
              url: 'http://epsi.fr',
              title: 'Accèder à la page de l\'EPSI'
            }, {
              type: 'postback',
              title: 'Call Postback',
              payload: 'Payload for first bubble',
            }],
          }]
        }
      }
    }
  }

  callSendAPI(messageData)
}

function callSendAPI(messageData) {

  console.log(messageData)
}

// Set Express to listen out for HTTP requests
var server = app.listen(process.env.PORT, function () {
  console.log('Listening on port %s', server.address().port)
})
