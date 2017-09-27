var amqp = require('amqplib/callback_api')
const debug = require('debug')

module.exports = () => {
  return new Promise((resolve, reject) => {
    amqp.connect(process.env.RABBIT_HOST, function (err, conn) {
      if (err) {
        debug.log('conn pa ok')
        reject(new Error('Connection refusée'))
      }
      debug.log('conn ok')
      resolve(conn)
    })
  })
}
