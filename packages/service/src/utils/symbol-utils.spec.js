const { processExpiry } = require('./symbol-utils');

describe('symbol-utils', () => {
  it('should test expiry', () => {
    expect(processExpiry('23JUL')).toEqual({
      expiryDate: 27,
      expiryType: 'monthly',
    });
  });
});
