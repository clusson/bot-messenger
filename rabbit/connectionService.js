var amqp = require('amqplib/callback_api')

module.exports = () => {
  return new Promise((resolve, reject) => {
    amqp.connect(process.env.URL + '?heartbeat=60', function (err, conn) {
      if (err) {
        console.log('conn pa ok')
        reject(new Error('Connection refusée'))
      }
      console.log('conn ok')
      resolve(conn)
    })
  })
}
