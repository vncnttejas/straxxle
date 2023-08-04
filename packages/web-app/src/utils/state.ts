import {
  DefaultValue, atom, selector, selectorFamily,
} from 'recoil';
import { produce } from 'immer';
import { flatten, forEach, intersection, keyBy, orderBy, pick, set as setObject } from 'lodash';
import { processSymbol } from './order';
import {
  Basket, ConfirmModalType, IOptionChainRow, IOrder, IOrderRequest, IPosition, IPositionSummary, IdType,
  IndexedOptionSkeletonType, IndexedStrikeContractType, InlineEditType, OrderCreateType,
} from './types';

export const appConstants = atom({
  key: 'appConstants',
  default: {
    freezeQty: 18,
    lotSize: 50,
  },
});

export const optionChainContract = atom({
  key: 'optionChainContract',
  default: 'NSE:NIFTY50-INDEX',
});

// Current option chain, filtered by context from server side
export const tapeState = atom<IOptionChainRow>({
  key: 'tapeState',
  default: {},
});

// current option chain keyed by symbol
export const optionChainSelector = selector({
  key: 'optionChainSelector',
  get: ({ get }) => {
    const tape = get(tapeState);
    return keyBy(tape, 'symbol');
  },
  set: ({ reset }, newValue) => {
    if (newValue instanceof DefaultValue) {
      reset(tapeState);
    }
  },
});

export const optionChainPriceSelector = selectorFamily({
  key: 'optionChainPriceSelector',
  get: (symbol: IdType) => ({ get }) => {
    const optionChain = get(optionChainSelector);
    return optionChain[symbol]?.lp || 0;
  },
});

export const optionChainStrikeSelector = selectorFamily({
  key: 'optionChainStrikeSelector',
  get: (symbol: IdType) => ({ get }) => {
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

export const confirmOrderModal = atom<ConfirmModalType>({
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

export const positionState = atom<IPosition>({
  key: 'positionState',
  default: {},
});

export const orderListSelector = selector({
  key: 'orderListSelector',
  get: ({ get }) => {
    const positions = Object.values(get(positionState));
    const orders: IOrder[][] = [];
    forEach(positions, ({ expiry, posOrderList }) => {
      const orderItem = posOrderList.map((order) => ({
        id: `${order.tt}:${order.symbol}`,
        expiry,
        strike: order.strike,
        qty: order.orderQty / 50,
        txnPrice: order.txnPrice,
        time: order.tt * 1000,
      }))
      orders.push(orderItem);
    });
    return orderBy(flatten(orders), 'id', 'desc');
  },
});

export const positionSummaryState = atom<IPositionSummary>({
  key: 'positionSummaryState',
  default: {
    pnl: 0,
    mtm: 0,
    total: 0,
    exitTotal: 0,
    orderCount: 0,
    activeOrderCount: 0,
    exitFees: {
      brokerage: 0,
      stt: 0,
      txnCharges: 0,
      gst: 0,
      sebi: 0,
      stamp: 0,
      totalFees: 0,
    },
    fees: {
      brokerage: 0,
      stt: 0,
      txnCharges: 0,
      gst: 0,
      sebi: 0,
      stamp: 0,
      totalFees: 0,
    },
  }
});

export const openFeesCollapseState = atom({
  key: 'openFeesCollapseState',
  default: false,
});

export const basketState = atom<Basket>({
  key: 'basket',
  default: {},
});

export const basketSelector = selectorFamily({
  key: 'basketSelector',
  get: (id: IdType) => ({ get }) => {
    const basket = get(basketState);
    return basket[id];
  },
  set: (id: IdType) => ({ set }, newValue) => {
    if (newValue instanceof DefaultValue) {
      set(basketState, (prev) => produce(prev, (draft) => {
        delete draft[id];
        return draft;
      }));
      return;
    }
    set(basketState, (prev) => produce(prev, (draft) => {
      draft[id] = newValue;
      return draft;
    }));
  },
});

export const selectedStrikesState = atom<Basket>({
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
  key: 'basketStateSelector',
  get: (id: IdType) => ({ get }) => get(basketSelector(id)),
  set: (id: IdType) => ({ set, reset }, newValue) => {
    if (!id) return;
    if (!newValue) return;
    if (newValue instanceof DefaultValue) {
      reset(basketSelector(id));
      set(selectedStrikesState, (prev) => produce(prev, (draft) => {
        delete draft[id];
        return draft;
      }));
      return;
    }
    if (+newValue.qty) {
      set(basketSelector(id), newValue);
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
      forEach(draft, (order) => {
        const sign = order.orderType === 'BUY' ? 1 : -1;
        delete order.orderType;
        delete order.contractType;
        order.qty = +order.qty * sign;
      });
      return draft;
    });
  },
  set: ({ get, set, reset }, newValue) => {
    if (newValue instanceof DefaultValue) {
      const selectedStriles = get(selectedStrikesState);
      forEach(selectedStriles, (_val, key) => {
        reset(basketSelector(key));
      });
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
    const prepList = {};
    forEach(optionChain, (strike) => {
      const trimmedData = pick(strike, ['symbol', 'strike', 'contractType', 'strikeNum', 'strikeType']);
      const { contractType, strikeNum } = trimmedData;
      setObject<IndexedOptionSkeletonType>(prepList, `${strikeNum}.${contractType}`, trimmedData);
    });
    return prepList;
  },
});

export const optionChainStrikesListSelector = selector<[IdType, IndexedStrikeContractType][]>({
  key: 'optionChainStrikesListSelector',
  get: ({ get }) => {
    return Object.entries(get(trimmedOptionFields));
  },
});

export const currentInlineEdit = atom<{ symbol: IdType }>({
  key: 'currentInlineEdit',
  default: {
    symbol: '',
  },
});

export const inlineEditsState = atom<InlineEditType>({
  key: 'inlineEdits',
  default: {},
});

export const inlineEditsSelector = selectorFamily({
  key: 'inlineEditsSelector',
  get: (symbol: IdType) => ({ get }) => {
    const inlineEdit = get(inlineEditsState);
    return inlineEdit[symbol];
  },
  set: (symbol: IdType) => ({ get, set }, newValue) => {
    const inlineEdits = get(inlineEditsState);
    let id: IdType;

    if (newValue instanceof DefaultValue) {
      const updatedEdits = produce(inlineEdits, (draft) => {
        delete draft[symbol];
        return draft;
      });
      set(inlineEditsState, updatedEdits);
      return;
    }

    if (newValue?.resetQty) {
      id = newValue?.resetQty;
      const updatedEdits = produce(inlineEdits, (draft) => {
        delete draft[id].newQty;
        if (!draft[id].newSymbol) {
          delete draft[id];
        }
        return draft;
      });
      set(inlineEditsState, updatedEdits);
      return;
    }

    if (newValue?.resetStrike) {
      id = newValue?.resetStrike;
      const updatedEdits = produce(inlineEdits, (draft) => {
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

export const strikeWiseDataSelector = selector({
  key: 'strikeWiseDataSelector',
  get: ({ get }) => {
    const strikeWisePosition = get(positionState);
    return produce(strikeWisePosition, (draft) => {
      forEach(draft, (pos, symbol) => {
        const inlineEdit = get(inlineEditsSelector(symbol));
        if (!inlineEdit) {
          return;
        }
        const { strikeNum, contractType } = processSymbol(inlineEdit.newSymbol || symbol);
        pos.prevStrike = pos.strike;
        pos.prevQty = pos.posQty;
        pos.strike = `${strikeNum}${contractType}` || pos.strike;
        pos.newSymbol = inlineEdit.newSymbol;
        pos.posQty = inlineEdit.newQty ?? pos.posQty;
        pos.strikeEdited = pos.strike !== pos.prevStrike;
        pos.qtyEdited = pos.posQty !== pos.prevQty;
      });
      return draft;
    });
  },
});

export const orderViewSelector = selector({
  key: 'orderViewSelector',
  get: ({ get }) => {
    const inlineEdits = get(strikeWiseDataSelector);
    const { lotSize } = get(appConstants);
    const positionList = Object.values(inlineEdits);
    const orderList: IOrderRequest = {};
    forEach(positionList, (item) => {
      const inineEditData = get(inlineEditsSelector(item.symbol));
      if (!inineEditData) {
        return;
      }

      let list;
      if (!item.prevQty) {
        return;
      }
      if (item.strikeEdited) {
        list = [
          {
            symbol: item.id,
            qty: (0 - item.prevQty) * lotSize,
            expiry: item.expiry,
            type: 'remove' as OrderCreateType,
          },
          {
            symbol: item.newSymbol,
            qty: item.posQty * lotSize,
            expiry: item.expiry,
            type: 'add' as OrderCreateType,
          },
        ];
      } else {
        list = [
          {
            symbol: item.symbol,
            qty: (item.posQty - item.prevQty) * lotSize,
            expiry: item.expiry,
            type: 'add' as OrderCreateType,
          },
        ];
      }
      orderList[item.id] = list;
    });
    return orderList;
  },
});

export const posGridRowSelectionState = atom<IdType[]>({
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
      enableMove: false,
    };
    const selectedLength = positionsSelected.length;
    const inlineEdits = get(inlineEditsState);
    const inlineEditSymbols = Object.keys(inlineEdits);
    const commonItemLength = intersection(inlineEditSymbols, positionsSelected).length;
    btnDisplayState.enableClear = commonItemLength > 0;
    btnDisplayState.enableDelete = selectedLength > 0 && commonItemLength <= 0;
    btnDisplayState.enableOrder = commonItemLength > 0;
    btnDisplayState.enableMove = selectedLength > 0;
    return btnDisplayState;
  },
});
