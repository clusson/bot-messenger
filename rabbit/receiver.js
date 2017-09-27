// require('dotenv').config({ path: '.env' })

module.exports = (conn) => {
  conn.createChannel((err, ch) => {
    const ex = process.env.RABBIT_QUEUE_API
    const severity = process.env.RABBIT_TYPE

    ch.assertExchange(ex, severity, { durable: false })

    ch.assertQueue('', { exclusive: true }, function (err, q) {

      ch.bindQueue(q.queue, ex, severity)

      ch.consume(q.queue, function (msg) {
        console.log(' [x] %s: \'%s\'', msg.fields.routingKey, msg.content.toString())
      }, { noAck: true })
    })
  })
}
