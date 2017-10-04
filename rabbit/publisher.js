
// require('dotenv').config({ path: '.env' })
const debug = require('debug')
module.exports = (conn, message) => {
  conn.createChannel((err, ch) => {
    debug.log('publish is here')
    debug.log(conn)

    const type = process.env.RABBIT_TYPE
    const ex = process.env.RABBIT_EXCHANGE
    const queue_name = process.env.RABBIT_QUEUE_API_MESSAGE
    const severity = process.env.RABBIT_BINDING_API_MESSAGE

    const messageStr = JSON.stringify(message)

    ch.assertExchange(ex, type, { durable: true })
    ch.bindQueue(queue_name, ex, severity)
    ch.publish(ex, severity, new Buffer(messageStr))
    debug.log(' [x] Sent %s: \'%s\'', severity, messageStr)
  })
}
