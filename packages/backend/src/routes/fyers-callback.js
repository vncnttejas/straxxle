const fyersApiV2 = require('fyers-api-v2');
const config = require('../config');
const { upsertDataStore } = require('../utils/data-store');
const { listenToUpdate } = require('../utils/symbol-utils');

const handler = async (req, reply) => {
  const fyersToken = await fyersApiV2.generate_access_token({
    client_id: config.fyersCred.appId,
    secret_key: config.fyersCred.secretId,
    ...req.query
  });
  const fyersCred = {
    access_token: fyersToken.access_token,
    appId: config.fyersCred.appId,
    secret_key: config.fyersCred.secretId,
    redirect_uri: config.fyersCred.redirectUri,
  };
  await listenToUpdate(fyersCred);
  upsertDataStore({ accessToken: fyersToken.access_token });
  reply.redirect(config.fyersCred.frontendRedirect);
}

module.exports = {
  method: 'GET',
  url: '/fyers-token',
  handler,
};
