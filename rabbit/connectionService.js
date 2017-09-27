var amqp = require('amqplib/callback_api')

module.exports = () => {
  return new Promise((resolve, reject) => {
    amqp.connect(process.env.URL + '?heartbeat=60', function (err, conn) {
      if (err) {
        reject(new Error('Connection refusée'))
      }
      resolve(conn)
    })
  })
}
