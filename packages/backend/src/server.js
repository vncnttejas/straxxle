const config = require('./config');
const { createApp } = require('./app');
const { initMongo } = require('./utils/mongo');
require('./log-process-exit');

const start = async (serverConfig) => {
  const app = await createApp(serverConfig.app);
  await initMongo(serverConfig.mongo);
  await app.ready();
  let connections = 0;
  app.io.on("connection", (socket) => {
    connections += 1;
    console.log(`socket connected (${connections}) - ${socket.id}`);
    socket.on("disconnect", () => {
      connections -= 1;
      console.log(`socket disconnected (${connections}) - ${socket.id}`);
    });
  });
  app.listen({ port: serverConfig.port });
  return app;
}

const app = start(config);

module.exports = {
  app,
};
