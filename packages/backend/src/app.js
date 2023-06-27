const fastify = require('fastify');
const AutoLoad = require('@fastify/autoload');
const fastifySwagger = require('@fastify/swagger');
const fastifyCors = require('@fastify/cors');
const fastifyIO = require('fastify-socket.io');

const { join } = require('path');

let app;

const createApp = async (appConfig) => {
  app = fastify(appConfig);

  app.register(fastifyCors, {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  });

  // register swagger at route
  app.register(fastifySwagger, {
    exposeRoute: true,
    routePrefix: '/docs',
    swagger: {
      info: { title: 'Straxxle' },
    },
  });

  // register autoload for routes
  app.register(AutoLoad, {
    dir: join(__dirname, 'routes'),
    autoHooks: true,
    autoHooksPattern: /^[_.]?auto_?hooks(\.js|\.cjs|\.mjs)$/i,
  });

  app.register(fastifyIO, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    },
  });

  return app;
};

const getApp = () => app;

module.exports = {
  createApp,
  getApp,
};
