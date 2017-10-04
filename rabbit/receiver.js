// require('dotenv').config({ path: '.env' })
const debug = require('debug')
const sendText = require('./bot.js')
module.exports = (conn) => {
  conn.createChannel((err, ch) => {
    const ex = process.env.RABBIT_EXCHANGE
    const severity = process.env.RABBIT_BINDING_FACEBOOK

    ch.assertExchange(ex, severity, { durable: true })

    ch.assertQueue('', { exclusive: true }, function (err, q) {

      ch.bindQueue(q.queue, ex, severity)

      ch.consume(q.queue, function (msg) {
        debug.log(' [x] %s: \'%s\'', msg.fields.routingKey, msg.content.toString())
        sendText.send(msg)
      }, { noAck: true })
    })
  })
}
