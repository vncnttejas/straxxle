export interface TxnWidgetProps {
  basket: IBasketValue;
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
  visible: boolean;
}

export type IdType = string | number;

export interface OptionChainRowProps {
  type: string;
  symbol: IdType;
  contractType: string;
}

export interface IPosOrderList {
  symbol: IdType;
  strike: string;
  orderQty: number;
  txnPrice: number;
  tt: number;
  fees: Fees;
}

export interface IFees {
  brokerage: number;
  stt: number;
  txnCharges: number;
  gst: number;
  sebi: number;
  stamp: number;
  totalFees: number;
}

export interface IPositionValue {
  symbol: IdType;
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
  prevStrike?: string;
  prevQty?: number;
  newSymbol?: IdType;
  strikeEdited?: boolean;
  qtyEdited?: boolean;
}

export type IPosition = Record<string, IPositionValue>;

export interface IPositionSummary {
  pnl: number;
  mtm: number;
  total: number;
  exitTotal: number;
  orderCount: number;
  activeOrderCount: number;
  exitFees: IFees;
  fees: IFees;
}

export interface PositionResponse {
  position: IPosition;
  summary: IPositionSummary;
}

export type ContractType = 'CE' | 'PE';

export interface IOptionChainValues {
  index: string;
  symbol: IdType;
  strike: string;
  strikeNum: string;
  strikeType: string;
  contractType: ContractType;
  expiryType: string;
  expiryDate: string;
  lp: number;
  short_name: string;
  openInterest: number;
  oiPercentile: number;
  changeinOpenInterest: number;
  strikeDiffPts: number;
}

export interface IOrder {
  id: string;
  expiry: string;
  strike: string;
  qty: number;
  txnPrice: number;
  time: number;
}

export type IOptionChainRow = Record<IdType, IOptionChainValues>;

export interface IEditRowValue {
  newSymbol?: IdType;
  newQty?: number;
  resetQty?: IdType;
  resetStrike?: IdType;
  newStrike?: IdType;
}

export type InlineEditType = Record<IdType, IEditRowValue>;

export interface IBasketValue {
  qty: string | number;
  orderType?: string;
  contractType?: string;
}

export type OrderCreateType = 'add' | 'remove';

export interface IOrderValue {
  symbol: IdType | undefined;
  qty: number;
  type: OrderCreateType;
  expiry: string;
}

export type IOrderRequest = Record<IdType, IOrderValue[]>;

export type Basket = Record<IdType, IBasketValue>;

export type ConfirmModalType = { open: boolean, symbols?: IdType[] };

export type TrimmedOptionType = Pick<IOptionChainValues, "symbol" | "contractType" | "strike" | "strikeNum" | "strikeType">

export type IndexedStrikeContractType = Record<ContractType, TrimmedOptionType>;

export type IndexedOptionSkeletonType = Record<IdType, IndexedStrikeContractType>
