
// require('dotenv').config({ path: '.env' })

module.exports = (conn, message) => {
  conn.createChannel((err, ch) => {


    const ex = process.env.RABBIT_EXCHANGE
    const queue_name = process.env.RABBIT_QUEUE_API
    const severity = process.env.RABBIT_TYPE

    const messageStr = JSON.stringify(message)

    ch.assertExchange(ex, severity, { durable: false })
    ch.bindQueue(queue_name, ex, severity)
    ch.publish(ex, severity, new Buffer(messageStr))
    console.log(' [x] Sent %s: \'%s\'', severity, messageStr)
  })
}
