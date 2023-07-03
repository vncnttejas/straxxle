const handler = async () => 'execute-basket';

module.exports = {
  method: 'POST',
  url: '/execute-basket/:id',
  handler,
};
