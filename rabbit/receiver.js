// require('dotenv').config({ path: '.env' })
const debug = require('debug')
const sendTextMessage = require('./sendTextMessage')

module.exports = (conn) => {
  conn.createChannel((err, ch) => {
    const type = process.env.RABBIT_TYPE
    const ex = process.env.RABBIT_EXCHANGE
    const severity = process.env.RABBIT_BINDING_FACEBOOK
    const queue_name = process.env.RABBIT_QUEUE_FACEBOOK

    ch.assertExchange(ex, type, { durable: true })

    ch.assertQueue(queue_name, { durable: false }, function (err, ok) {

      ch.bindQueue(queue_name, ex, severity)

      ch.consume(queue_name, function (msg) {
        let message = JSON.parse(msg.content.toString())
        sendTextMessage(message.userid, message.content)
      }, { noAck: true })
    })
  })
}
