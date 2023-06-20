const ajvKeywords = require('ajv-keywords');

require('dotenv-safe').config({
  allowEmptyValues: true,
});

module.exports = {
  env: process.env.NODE_ENV,
  port: process.env.APP_PORT,
  host: process.env.NODE_HOST,
  app: {
    logger: {
      file: './app.log',
      transport: {
        target: 'pino-pretty',
      },
    },
    ajv: {
      customOptions: {
        removeAdditional: true,
        coerceTypes: true,
        allErrors: true,
      },
      plugins: [ajvKeywords],
    },
  },
  fyersCred: {
    appId: process.env.APP_ID,
    secretId: process.env.SECRET_ID,
    redirectUri: process.env.REDIRECT_URI,
    frontendRedirect: process.env.FE_REDIRECT,
  },
  mongo: {
    uri: process.env.MONGO_URI,
    orderLogCollectionName: process.env.LOG_COLL || 'Orders',
    configCollectionName: process.env.CONFIG_COLL || 'Config',
    tickCollectionName: process.env.TICKSNAP_COLL || 'TickSnapshot',
    basketCollectionName: process.env.BASKET_COLL || 'Baskets',
    tagsCollectionName: process.env.TAG_COLL || 'Tags',
  },
  appConstants: {
    lotSize: 50,
  },
};
