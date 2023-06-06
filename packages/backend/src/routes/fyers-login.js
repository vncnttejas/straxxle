const config = require('../config');

const handler = async (req, reply) => {
  try {
    const client_id = config.fyersCred.appId;
    const redirect_uri = 'http://developer.vbox/api/fyers-token';
    const redirect = `https://api.fyers.in/api/v2/generate-authcode?client_id=${client_id}&redirect_uri=${redirect_uri}&response_type=code&state=test_env`;
    reply.redirect(redirect);
  }
  catch (e) {
    throw e;
  }
}

module.exports = {
  method: 'GET',
  url: '/fyers-login',
  handler,
};
