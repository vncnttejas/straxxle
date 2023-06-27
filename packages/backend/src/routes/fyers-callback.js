const fyersApiV2 = require('fyers-api-v2');
const config = require('../config');
const { setDataStore, getStoreData } = require('../utils/data-store');
const { triggerListen } = require('../utils/ticker-tape');

const handler = async (req, reply) => {
  const fyersToken = await fyersApiV2.generate_access_token({
    client_id: config.fyersCred.appId,
    secret_key: config.fyersCred.secretId,
    ...req.query,
  });
  const fyersCred = {
    access_token: fyersToken.access_token,
    appId: config.fyersCred.appId,
    secret_key: config.fyersCred.secretId,
    redirect_uri: config.fyersCred.redirectUri,
  };
  fyersApiV2.setAppId(fyersCred.appId);
  fyersApiV2.setRedirectUrl(fyersCred.redirect_uri);
  fyersApiV2.setAccessToken(fyersCred.access_token);
  setDataStore('fyersCred', fyersCred);
  // Listen to default symbols
  const defaultWatchSymbols = Object.values(getStoreData('defaultSymbols')).map(({ symbol }) => (symbol));
  setDataStore('watchList.defaultWatchSymbols', defaultWatchSymbols);
  triggerListen();
  reply.redirect(config.fyersCred.frontendRedirect);
};

module.exports = {
  method: 'GET',
  url: '/fyers-token',
  handler,
};
