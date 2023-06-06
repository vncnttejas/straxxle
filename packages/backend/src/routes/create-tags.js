const handler = async () => {
  return await fetchCurrent();
};

module.exports = {
  method: 'POST',
  url: '/tags',
  handler,
};
