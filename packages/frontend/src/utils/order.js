// Compute qty option list

export const freezeQty = 18;

export const computeQtyOptions = (qty = freezeQty * 5) => {
  const options = [];
  for (let i = 1; i <= qty; i++) {
    const iStr = i.toString();
    // const fqStr = i && i % freezeQty === 0 ? `${parseInt(i / freezeQty)}FQ` : false;
    // const aka = fqStr ? `${i} ${fqStr}` : iStr;

    options.push(iStr);
  }
  return options;
};


export const flipOrderType = (orderType) => {
  return orderType === 'BUY' ? 'SELL' : 'BUY';
}