export class Optiontick {
  high_price: string;
  prev_close_price: number;
  ch: number;
  tt: number;
  description: string;
  short_name: string;
  exchange: string;
  low_price: number;
  cmd: Cmd;
  original_name: string;
  chp: number;
  open_price: number;
  lp: number;
  symbol: string;
  LTQ: number;
  L2_LTT: number;
  ATP: number;
  volume: number;
  tot_buy: number;
  tot_sell: number;
  bid: number;
  ask: number;
  spread: number;
  marketStat: number;
}

export class Cmd {
  c: number;
  h: number;
  l: number;
  o: number;
  t: number;
  v: number;
  tf: string;
}
