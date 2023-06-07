import { DefaultValue, atom, atomFamily, selector, selectorFamily } from 'recoil';
import { produce } from 'immer';
import { set as setObject } from 'lodash';

export const appConstants = atom({
  key: 'appConstants',
  default: {
    freezeQty: 18,
    lotSize: 50,
  },
});

export const optionChainState = atom({
  key: 'optionChainState',
  default: {},
});

export const optionChainPriceSelector = selectorFamily({
  key: 'optionChainPriceSelector',
  get: (symbol) => ({ get }) => {
    const optionChain = get(optionChainState)
    return optionChain[symbol]?.['lp'] || 0;
  },
});

export const optionChainStrikeSelector = selectorFamily({
  key: 'optionChainStrikeSelector',
  get: (symbol) => ({ get }) => {
    const optionChain = get(optionChainState)
    return optionChain[symbol]?.['strike'];
  },
});

export const optionChainListSelector = selector({
  key: 'optionChainListSelector',
  get: ({ get }) => {
    const optionChain = get(optionChainState)
    return Object.values(optionChain);
  },
});

export const optionChainModalState = atom({
  key: 'optionChainModalState',
  default: {
    open: false,
    enable: true,
  },
});

export const optionChainRadioModal = atom({
  key: 'optionChainRadioModal',
  default: {
    open: false,
  }
});

export const confirmOrderModal = atom({
  key: 'confirmOrderModal',
  default: {
    open: false,
    symbol: null,
  }
});

export const positionState = atom({
  key: 'positionState',
  default: {},
});

export const positionSelector = selector({
  key: 'positionSelector',
  get: ({ get }) => {
    return get(positionState);
  },
  set: ({ set }, newValue) => {
    set(positionState, newValue);
  }
});

export const strikeWisePositionState = selector({
  key: 'strikeWisePositionState',
  get: ({ get }) => {
    const positionData = get(positionSelector);
    const optionChain = get(optionChainState);
    const { lotSize } = get(appConstants);

    const optionChainKeys = Object.keys(optionChain);
    const positionDataValues = Object.values(positionData);

    if (!positionDataValues.length || !optionChainKeys.length) {
      return [];
    }

    return produce(positionDataValues, (draft) => {
      for (let pos of draft) {
        const { posQty, posAvg, posVal, symbol } = pos;
        const lp = get(optionChainPriceSelector(symbol));
        let pnl = posQty ? (lp - posAvg) * posQty : 0 - posVal;
        pos['id'] = symbol;
        pos['lp'] = lp;
        pos['pnl'] = pnl;
        pos['posQty'] = posQty / lotSize;
      }
      return draft;
    });
  },
});

export const strikeWiseSelectorFam = selectorFamily({
  key: 'strikeWiseSelectorFam',
  get: (symbol) => ({ get }) => {
    const positionData = get(positionSelector);
    return positionData[symbol];
  },
})

export const positionSummarySelector = selector({
  key: 'positionSummarySelector',
  get: ({ get }) => {
    const position = get(strikeWisePositionState);
    const positionList = Object.values(position);
    const initialState = {
      pnl: 0,
      mtm: 0,
      total: 0,
      fees: {
        brokerage: 0,
        stt: 0,
        txnCharges: 0,
        gst: 0,
        sebi: 0,
        stamp: 0,
        totalFees: 0,
      },
    };
    return positionList.reduce(
      (acc, cur) => {
        const pnl = cur.posQty ? acc.pnl : acc.pnl + cur.pnl;
        const mtm = cur.posQty ? acc.mtm + cur.pnl : acc.mtm;
        const totalFees = cur.posFees.totalFees + acc.fees.totalFees;
        const total = pnl + mtm - totalFees;
        return {
          pnl,
          mtm,
          total,
          fees: {
            brokerage: cur.posFees.brokerage + acc.fees.brokerage,
            stt: cur.posFees.stt + acc.fees.stt,
            txnCharges: cur.posFees.txnCharges + acc.fees.txnCharges,
            gst: cur.posFees.gst + acc.fees.gst,
            sebi: cur.posFees.sebi + acc.fees.sebi,
            stamp: cur.posFees.stamp + acc.fees.stamp,
            totalFees,
          },
        };
      },
      initialState
    );
  },
});

export const openFeesCollapseState = atom({
  key: 'openFeesCollapseState',
  default: false,
});

export const basketState = atomFamily({
  key: 'basket',
  default: {
    orderType: '',
    qty: '0',
    contractType: '',
  },
});

export const selectedStrikesState = atom({
  key: 'selectedStrikes',
  default: {},
});

export const newOrderSnackbarState = atom({
  key: 'newOrderSnackbarState',
  default: {
    open: false,
    message: '',
    severity: 'info',
  },
});

export const basketStateSelector = selectorFamily({
  key: 'selectedStrikes',
  get: (id) => ({ get }) => {
    return get(basketState(id));
  },
  set: (id) => ({ set, reset }, newValue) => {
    if (!id) return;
    if (!newValue) return;
    if (newValue instanceof DefaultValue) {
      reset(basketState(id));
      set(selectedStrikesState, prev => {
        return produce(prev, (draft) => {
          delete draft[id];
          return draft;
        })
      });
      return;
    }
    if (newValue.qty.length) {
      set(basketState(id), newValue);
      set(selectedStrikesState, prev => {
        return produce(prev, (draft) => {
          draft[id] = newValue;
          return draft;
        });
      });
    }
  }
});

export const selectedStrikesSelector = selector({
  key: 'selectedStrikesSelector',
  get: ({ get }) => {
    const strikes = get(selectedStrikesState);
    return produce(strikes, (draft) => {
      const sign = draft['orderType'] === 'BUY' ? 1 : -1;
      delete draft['orderType'];
      draft['qty'] *= sign;
    });
  },
  set: ({ get, set, reset }, newValue) => {
    if (newValue instanceof DefaultValue) {
      const selectedStriles = get(selectedStrikesState);
      for (const key in selectedStriles) {
        reset(basketState(key));
      }
      set(optionChainModalState, {
        ...get(optionChainModalState),
        open: false,
      });
    }
    set(selectedStrikesState, newValue);
  }
});

export const trimmedOptionFields = selector({
  key: 'trimmedOptionFields',
  get: ({ get }) => {
    const optionChain = get(optionChainState);
    return produce(optionChain, (draft) => {
      for (let option in draft) {
        const optionData = draft[option];
        delete optionData?.['lp'];
        delete optionData?.['strikeDiffPts'];
        delete optionData?.['strikeDiff'];
        delete optionData?.['expiryType'];
        delete optionData?.['expiryDate'];
      }
    });
  }
});

export const optionChainStrikesSelector = selector({
  key: 'optionChainStrikesSelector',
  get: ({ get }) => {
    const trimmedOptionData = get(trimmedOptionFields);
    return produce(trimmedOptionData, (draft) => {
      const prepList = {};
      for (let option in draft) {
        const optionData = draft[option];
        const contractType = optionData['contractType'];
        const strikeNum = optionData['strikeNum'];
        setObject(prepList, `${strikeNum}.${contractType}`, optionData)
      }
      return prepList;
    });
  }
});

export const currentInlineEdit = atom({
  key: 'currentInlineEdit',
  default: {
    symbol: '',
  },
})

export const inlineEditsState = atom({
  key: 'inlineEdits',
  default: {},
});

export const inlineEditsSelector = selectorFamily({
  key: 'inlineEditsSelector',
  get: (symbol) => ({ get }) => {
    const inlineEdit = get(inlineEditsState);
    return inlineEdit[symbol];
  },
  set: (symbol) => ({ get, set }, newValue) => {
    const inlineEdits = get(inlineEditsState);
    let id;

    id = newValue?.resetQty;
    if (id) {
      const updatedEdits = produce(inlineEdits, (draft) => {
        delete draft[id]['newQty'];
        return draft;
      })
      set(inlineEditsState, updatedEdits);
      return;
    }

    id = newValue?.resetStrike;
    if (id) {
      const updatedEdits = produce(inlineEdits, (draft) => {
        delete draft[id]['strike'];
        delete draft[id]['newSymbol'];
        return draft;
      })
      set(inlineEditsState, updatedEdits);
      return;
    }

    const updatedEdits = produce(inlineEdits, (draft) => {
      draft[symbol] = newValue;
      return draft;
    });
    set(inlineEditsState, updatedEdits);
  },
});

export const inlineEditIndicator = selector({
  key: 'inlineEditIndicator',
  get: ({ get }) => {
    const strikeWisePosition = get(strikeWisePositionState);
    return produce(strikeWisePosition, (draft) => {
      for (let pos of draft) {
        const inlineEdit = get(inlineEditsSelector(pos['symbol']));
        if (!inlineEdit) {
          continue;
        }
        pos['prevStrike'] = pos['strike'];
        pos['prevQty'] = pos['posQty'];
        pos['strike'] = inlineEdit['strike'] || pos['strike'];
        pos['newSymbol'] = inlineEdit['newSymbol'];
        pos['posQty'] = inlineEdit['newQty'] || pos['posQty'];
        pos['strikeEdited'] = pos['strike'] !== pos['prevStrike'];
        pos['qtyEdited'] = pos['posQty'] !== pos['prevQty'];
      }
      return draft;
    });
  },
});

export const orderViewSelector = selector({
  key: 'orderViewSelector',
  get: ({ get }) => {
    const inlineEdits = get(inlineEditIndicator);
    return produce(inlineEdits, (draft) => {
      let orderList = {};
      for (let item of draft) {
        let list;
        if (item['strikeEdited']) {
          list = [
            {
              symbol: item['id'],
              strike: item['prevStrike'],
              qty: 0 - item['prevQty'],
              type: 'remove'
            },
            {
              symbol: item['newSymbol'],
              strike: item['strike'],
              qty: item['posQty'],
              type: 'add'
            },
          ];
        } else {
          list = [
            {
              symbol: item['newSymbol'],
              strike: item['strike'],
              qty: item['posQty'] - item['prevQty'],
              type: 'add'
            },
          ];
        }
        orderList[item['id']] = list;
      }
      return orderList;
    });
  },
});
