const { getStoreData } = require('../utils/data-store');

const escapeRoutes = ['/ping', '/auth', '/fyers-login', '/fyers-token'];

module.exports = (app, opt, next) => {
  app.addHook('preHandler', (req, reply, done) => {
    const match = req.headers.authorization && req.headers.authorization.match(/Bearer (.+)/);
    const token = match?.[1];
    if (escapeRoutes.includes(req.routerPath)) {
      return done();
    }
    if (token === undefined || token !== getStoreData('accessToken')) {
      return done({ error: 'Invalid token' });
    }
    done();
  });
  next();
};
