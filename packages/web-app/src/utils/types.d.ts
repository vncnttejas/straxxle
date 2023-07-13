export interface TxnWidgetProps {
  basket: {
    qty: string;
    orderType: string;
  };
  contractType: string;
  handleQtyChange: (qty: string) => void;
  handleOrderClick: (e: any) => void;
  disable: boolean;
};

export interface TxnButtonProps {
  orderType: string;
  active: boolean;
  onClick: (e: any) => void;
  disabled: boolean;
};

export interface OptionChainRowProps {
  type: string;
  symbol: string;
  contractType: string;
}

export interface IPosOrderList {
  symbol: string;
  strike: string;
  orderQty: number;
  txnPrice: number;
  tt: number;
  fees: Fees;
};

export interface IFees {
  brokerage: number;
  stt: number;
  txnCharges: number;
  gst: number;
  sebi: number;
  stamp: number;
  totalFees: number;
};

export interface IPositionValue {
  symbol: string;
  id: string;
  posFees: Fees;
  strike: string;
  expiry: string;
  posQty: number;
  posAvg: number;
  posVal: number;
  cumOpenVal: number;
  posOrderList: IPosOrderList[];
  lp: number;
  pnl: number;
  exitFees: IFees;
};

interface IPosition {
  [key: string]: IPositionValue;
};

export interface IPositionSummary {
  pnl: number;
  mtm: number;
  total: number;
  exitTotal: number;
  orderCount: number;
  activeOrderCount: number;
  exitFees: IFees;
  fees: IFees;
};

export interface IOptionChainValues {
  symbol: string;
  index: string;
  strike: string;
  strikeNum: string;
  strikeType: string;
  contractType: string;
  expiryType: string;
  expiryDate: string;
  lp: number;
  short_name: string;
}

export type IOptionChainRow = {
  [key: string]: IOptionChainValues;
}
