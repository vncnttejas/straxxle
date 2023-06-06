const handler = async () => {
  return await fetchCurrent();
};

module.exports = {
  method: 'PUT',
  url: '/config/:name',
  handler,
};
