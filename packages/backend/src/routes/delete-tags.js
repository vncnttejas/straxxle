const handler = async () => {
  return await fetchCurrent();
};

module.exports = {
  method: 'DELETE',
  url: '/tags',
  handler,
};
