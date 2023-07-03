const { flatten } = require('lodash');
const fyersApiV2 = require('fyers-api-v2');
const config = require('../config');
const { setStoreData, getStoreData } = require('../utils/data-store');
const { triggerListen, fetchCurrent } = require('../utils/ticker-tape');
const { prepareSymbolList, getATMStrikeNumfromCur } = require('../utils/symbol-utils');

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
  setStoreData('fyersCred', fyersCred);
  // Listen to default symbols
  const defaultSymbolObjs = Object.values(getStoreData('defaultSymbols'));
  const watchList = await Promise.all(defaultSymbolObjs.map(async (symbolObj) => {
    const current = await fetchCurrent(symbolObj.shortName);
    setStoreData(`defaultSymbols.${symbolObj.shortName}.current`, current);
    const atm = getATMStrikeNumfromCur(current, symbolObj);
    return prepareSymbolList(atm, symbolObj.shortName, symbolObj.expiry);
  }));
  setStoreData('watchList', flatten(watchList));
  triggerListen();
  reply.redirect(config.fyersCred.frontendRedirect);
};

module.exports = {
  method: 'GET',
  url: '/fyers-token',
  handler,
};
