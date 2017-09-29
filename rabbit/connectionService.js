var amqp = require('amqplib/callback_api')

module.exports = () => {
  return new Promise((resolve, reject) => {
    const URL = 'amqp://' + process.env.RABBIT_USER + ':' +
      process.env.RABBIT_PASSWORD + '@' + process.env.RABBIT_HOST + ':' + process.env.RABBIT_PORT
    amqp.connect(URL, function (err, conn) {
      if (err) {
        reject(new Error('Connection refusée'))
      }
      resolve(conn)
    })
  })
}
