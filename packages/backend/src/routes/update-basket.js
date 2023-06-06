const handler = async () => {
  return await fetchCurrent();
};

module.exports = {
  method: 'PUT',
  url: '/basket',
  handler,
};
