import {
  DefaultValue, atom, atomFamily, selector, selectorFamily,
} from 'recoil';
import { produce } from 'immer';
import { flatten, intersection, keyBy, orderBy, pick, set as setObject, sortBy } from 'lodash';

export const appConstants = atom({
  key: 'appConstants',
  default: {
    freezeQty: 18,
    lotSize: 50,
  },
});

export const tapeState = atom({
  key: 'tapeState',
  default: {},
});

export const optionChainSelector = selector({
  key: 'optionChainSelector',
  get: ({ get }) => {
    const tape = get(tapeState);
    return keyBy(tape, 'symbol');
  },
  set: ({ get, set }) => {
    const tape = get(tapeState);
    const optionStrikeKeys = Object.keys(tape);
    const newTape = produce(tape, (draft) => {
      optionStrikeKeys.forEach((strike) => {
        delete draft[strike];
      });
    });
    set(tapeState, newTape);
  },
});

export const optionChainPriceSelector = selectorFamily({
  key: 'optionChainPriceSelector',
  get: (symbol) => ({ get }) => {
    const optionChain = get(optionChainSelector);
    return optionChain[symbol]?.lp || 0;
  },
});

export const optionChainStrikeSelector = selectorFamily({
  key: 'optionChainStrikeSelector',
  get: (symbol) => ({ get }) => {
    const optionChain = get(optionChainSelector);
    return optionChain[symbol]?.strike;
  },
});

export const optionChainListSelector = selector({
  key: 'optionChainListSelector',
  get: ({ get }) => {
    const optionChain = get(optionChainSelector);
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
  },
});

export const confirmOrderModal = atom({
  key: 'confirmOrderModal',
  default: {
    open: false,
    symbols: [],
  },
});

export const orderListModal = atom({
  key: 'orderListModal',
  default: {
    open: false,
  },
});

export const positionState = atom({
  key: 'positionState',
  default: [],
});

export const orderListSelector = selector({
  key: 'orderListSelector',
  get: ({ get }) => {
    const positions = Object.values(get(positionState));
    let orders = [];
    positions.forEach(({ expiry, posOrderList }) => {
      orders.push(posOrderList.map(order => {
        const prepOrder = {
          id: `${order.tt}:${order.symbol}`,
          expiry,
          strike: order.strike,
          qty: order.orderQty / 50,
          txnPrice: order.txnPrice,
          time: order.tt * 1000,
        };
        return prepOrder;
      }));
    });
    return orderBy(flatten(orders), 'id', 'desc');
  },
});

export const positionSummaryState = atom({
  key: 'positionSummaryState',
  default: {}
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
  get: (id) => ({ get }) => get(basketState(id)),
  set: (id) => ({ set, reset }, newValue) => {
    if (!id) return;
    if (!newValue) return;
    if (newValue instanceof DefaultValue) {
      reset(basketState(id));
      set(selectedStrikesState, (prev) => produce(prev, (draft) => {
        delete draft[id];
        return draft;
      }));
      return;
    }
    if (newValue.qty.length) {
      set(basketState(id), newValue);
      set(selectedStrikesState, (prev) => produce(prev, (draft) => {
        draft[id] = newValue;
        return draft;
      }));
    }
  },
});

export const selectedStrikesSelector = selector({
  key: 'selectedStrikesSelector',
  get: ({ get }) => {
    const orders = get(selectedStrikesState);
    return produce(orders, (draft) => {
      // eslint-disable-next-line no-restricted-syntax
      for (const symbol in draft) {
        const order = draft[symbol];
        const sign = order.orderType === 'BUY' ? 1 : -1;
        delete order.orderType;
        delete order.contractType;
        order.qty = +order.qty * sign;
      }
      return draft;
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
  },
});

export const trimmedOptionFields = selector({
  key: 'trimmedOptionFields',
  get: ({ get }) => {
    const optionChain = get(optionChainSelector);
    return produce(optionChain, (draft) => {
      for (const option in draft) {
        const optionData = draft[option];
        delete optionData?.lp;
        delete optionData?.strikeDiffPts;
        delete optionData?.strikeDiff;
        delete optionData?.expiryType;
        delete optionData?.expiryDate;
      }
    });
  },
});

export const optionChainStrikesSelector = selector({
  key: 'optionChainStrikesSelector',
  get: ({ get }) => {
    const trimmedOptionData = get(trimmedOptionFields);
    return produce(trimmedOptionData, (draft) => {
      const prepList = {};
      for (const option in draft) {
        const optionData = draft[option];
        const { contractType } = optionData;
        const { strikeNum } = optionData;
        setObject(prepList, `${strikeNum}.${contractType}`, optionData);
      }
      return prepList;
    });
  },
});

export const currentInlineEdit = atom({
  key: 'currentInlineEdit',
  default: {
    symbol: '',
  },
});

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
        delete draft[id].newQty;
        if (!draft[id].strike && !draft[id].newSymbol) {
          delete draft[id];
        }
        return draft;
      });
      set(inlineEditsState, updatedEdits);
      return;
    }

    id = newValue?.resetStrike;
    if (id) {
      const updatedEdits = produce(inlineEdits, (draft) => {
        delete draft[id].strike;
        delete draft[id].newSymbol;
        if (!draft[id].newQty) {
          delete draft[id];
        }
        return draft;
      });
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
    const strikeWisePosition = get(positionState);
    return produce(Object.values(strikeWisePosition), (draft) => {
      // eslint-disable-next-line no-restricted-syntax
      for (const pos of draft) {
        const inlineEdit = get(inlineEditsSelector(pos.symbol));
        if (!inlineEdit) {
          // eslint-disable-next-line no-continue
          continue;
        }
        pos.prevStrike = pos.strike;
        pos.prevQty = pos.posQty;
        pos.strike = inlineEdit.strike || pos.strike;
        pos.newSymbol = inlineEdit.newSymbol;
        pos.posQty = inlineEdit.newQty ?? pos.posQty;
        pos.strikeEdited = pos.strike !== pos.prevStrike;
        pos.qtyEdited = pos.posQty !== pos.prevQty;
      }
      return draft;
    });
  },
});

export const orderViewSelector = selector({
  key: 'orderViewSelector',
  get: ({ get }) => {
    const inlineEdits = get(inlineEditIndicator);
    const { lotSize } = get(appConstants);

    return produce(inlineEdits, (draft) => {
      const orderList = {};
      // eslint-disable-next-line no-restricted-syntax
      for (const item of draft) {
        const inineEditData = get(inlineEditsSelector(item.symbol));
        if (!inineEditData) {
          // eslint-disable-next-line no-continue
          continue;
        }

        let list;
        if (item.strikeEdited) {
          list = [
            {
              symbol: item.id,
              strike: item.prevStrike,
              qty: (0 - item.prevQty) * lotSize,
              expiry: item.expiry,
              type: 'remove',
            },
            {
              symbol: item.newSymbol,
              strike: item.strike,
              qty: item.posQty * lotSize,
              expiry: item.expiry,
              type: 'add',
            },
          ];
        } else {
          list = [
            {
              symbol: item.symbol,
              strike: item.strike,
              qty: (item.posQty - item.prevQty) * lotSize,
              expiry: item.expiry,
              type: 'add',
            },
          ];
        }
        orderList[item.id] = list;
      }
      return orderList;
    });
  },
});

export const posGridRowSelectionState = atom({
  key: 'posGridRowSelectionState',
  default: [],
});

export const actionDisplaySelector = selector({
  key: 'actionDisplaySelector',
  get: ({ get }) => {
    const positionsSelected = get(posGridRowSelectionState);
    const btnDisplayState = {
      enableOrder: false,
      enableDelete: false,
      enableClear: false,
    };
    const selectedLength = positionsSelected.length;
    const inlineEdits = get(inlineEditsState);
    const inlineEditSymbols = Object.keys(inlineEdits);
    const commonItemLength = intersection(inlineEditSymbols, positionsSelected).length;
    btnDisplayState.enableClear = commonItemLength > 0;
    btnDisplayState.enableDelete = selectedLength > 0 && commonItemLength <= 0;
    btnDisplayState.enableOrder = commonItemLength > 0;
    return btnDisplayState;
  },
});
