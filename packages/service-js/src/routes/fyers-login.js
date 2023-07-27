const config = require('../config');

const handler = async (req, reply) => {
  // eslint-disable-next-line no-useless-catch
  try {
    const clientId = config.fyersCred.appId;
    const redirectUri = 'http://developer.vbox/api/fyers-token';
    const redirect = `https://api.fyers.in/api/v2/generate-authcode?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&state=test_env`;
    reply.redirect(redirect);
  } catch (e) {
    throw e;
  }
};

module.exports = {
  method: 'GET',
  url: '/fyers-login',
  handler,
};
