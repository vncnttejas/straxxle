jest.useFakeTimers();

const ordersMock = require('./orders-mock.json');
const { computeRawPosition } = require('./position');

describe('#position', () => {
  let mockOrders = [];
  beforeAll(() => {
    mockOrders = ordersMock.map((order) => ({
      toObject() {
        return order;
      },
    }));
  });

  it('should test computeRawPosition()', () => {
    const pos = computeRawPosition(mockOrders);
    expect(pos).toBeDefined();
  });

});
