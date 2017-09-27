/**
 * Tests.
 */

describe('main.js', function () {
    
      it('must connect', function (done) {
        listen(function (addr, server) {
          var cl = client(addr);
          cl.on('open', function () {
            cl.close();
            server.close();
            done();
          });
        });
      });
    
      it('must handle upgrade requests of a normal http server', function (done) {
        var httpServer = http.createServer(function (req, res) {
          res.writeHead(200);
          res.end('Hello World');
        })
    })
});