var amqp = require('amqplib/callback_api')
const debug = require('debug')

module.exports = () => {
  return new Promise((resolve, reject) => {
    const URL = 'amqp://' + process.env.RABBIT_USER + ':' + process.env.RABBIT_PASSWORD + '@' + process.env.RABBIT_HOST
    amqp.connect(URL, function (err, conn) {
      if (err) {
        debug.log('conn pa ok')
        reject(new Error('Connection refusée'))
      }
      debug.log('conn ok')
      resolve(conn)
    })
  })
}
