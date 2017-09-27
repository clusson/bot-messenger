var mochaAsync = (fn) => {
    return async (done) => {
      try {
        await fn();
        done();
      } catch (err) {
        done(err);
      }
    };
  };
  
  module.exports = {
    mochaAsync,
  };