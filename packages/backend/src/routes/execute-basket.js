const handler = async () => {
  return await fetchCurrent();
};

module.exports = {
  method: 'POST',
  url: '/execute-basket/:id',
  handler,
};
