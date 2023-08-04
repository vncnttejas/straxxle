export default () => ({
  port: parseInt(process.env.APP_PORT, 10) || 3000,
  database: {
    type: 'postgres',
    database: process.env.DATABASE_NAME || 'stxl_db',
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT, 10) || 5432,
    username: process.env.DB_USERNAME || 'stxl_user',
    synchronize: true,
    entities: ['dist/**/*.entity{.ts,.js}'],
  },
  broker: {
    authHost: 'https://api.fyers.in/api/v2/generate-authcode',
    clientId: process.env.CLIENT_ID,
    appSecret: process.env.SECRET_ID,
    redirectUri: process.env.CALLBACK,
  },
  session: {
    secret: process.env.SESSION_SECRET,
    salt: process.env.SESSION_SALT,
  },
  maxWatchItems: 50,
  webApp: process.env.FE_REDIRECT,
  defaultSymbols: {
    'NSE:NIFTY50-INDEX': {
      shortName: 'NIFTY',
      prefix: 'NSE:NIFTY',
      symbol: 'NSE:NIFTY50-INDEX',
      lotSize: 50,
      strikeDiff: 50,
      strikeExtreme: 1000,
    },
    'NSE:FINNIFTY-INDEX': {
      shortName: 'FINNIFTY',
      prefix: 'NSE:FINNIFTY',
      symbol: 'NSE:FINNIFTY-INDEX',
      lotSize: 50,
      strikeDiff: 50,
      strikeExtreme: 1000,
    },
    'NSE:NIFTYBANK-INDEX': {
      shortName: 'BANKNIFTY',
      prefix: 'NSE:BANKNIFTY',
      symbol: 'NSE:NIFTYBANK-INDEX',
      lotSize: 50,
      strikeDiff: 100,
      strikeExtreme: 2000,
    },
  },
  symbolRegexStr: '^NSE:(NIFTY|BANKNIFTY|FINNIFTY)([0-9]{2}[A-Z0-9]{3})([0-9]{3,6})([A-Z]{2})$', // eslint-disable-line
});
