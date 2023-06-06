const handler = async () => {
  return await fetchCurrent();
};

module.exports = {
  method: 'GET',
  url: '/tags',
  handler,
};
