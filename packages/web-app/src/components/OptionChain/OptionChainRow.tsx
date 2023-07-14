import Button from '@mui/material/Button';
import { styled } from '@mui/material/styles';
import { Autocomplete, Radio, TableCell, TextField } from '@mui/material';
import { flipOrderType } from '../../utils/order';
import {
  useRecoilState,
  useRecoilValue,
  useResetRecoilState,
  useSetRecoilState,
} from 'recoil';
import React, { memo, useCallback, useEffect } from 'react';
import './OptionChain.css';
import {
  basketStateSelector,
  currentInlineEdit,
  inlineEditsSelector,
  optionChainPriceSelector,
  optionChainRadioModal,
  optionChainStrikeSelector,
} from '../../utils/state';
import { computeQtyOptions } from '../../utils/order';
import {
  OptionChainRowProps,
  TxnButtonProps,
  TxnWidgetProps,
} from '../../utils/types';

export const StrikeCell = styled(TableCell)(() => ({
  paddingTop: 2,
  paddingBottom: 2,
}));

const qtyList = computeQtyOptions();

const QtyDD = styled(Autocomplete)(
  ({ contracttype }: { contracttype: string }) => ({
    width: 70,
    float: contracttype === 'PE' ? 'left' : 'right',
    mr: 3,
    '& .MuiInputBase-sizeSmall': {
      padding: '0 !important',
    },
    '& input.MuiInputBase-input': {
      textAlign: 'right',
      paddingRight: '15px !important',
    },
  })
);

const TxnButton = memo(
  ({ orderType, active, ...restProps }: TxnButtonProps) => {
    const btnName = orderType === 'BUY' ? 'B' : 'S';
    return (
      <Button
        variant={active ? 'contained' : 'outlined'}
        color={orderType === 'BUY' ? 'success' : 'error'}
        size="small"
        data-order-type={orderType}
        sx={{
          mr: orderType === 'SELL' ? 0 : 2,
          p: 0,
          minWidth: 25,
        }}
        {...restProps}
      >
        {btnName}
      </Button>
    );
  }
);

const TxnWidget = ({
  basket,
  handleOrderClick,
  contractType,
  handleQtyChange,
  disable,
}: TxnWidgetProps) => {
  return (
    <>
      <TxnButton
        orderType="BUY"
        active={basket?.orderType === 'BUY'}
        onClick={handleOrderClick}
        disabled={disable}
      />
      <TxnButton
        orderType="SELL"
        active={basket?.orderType === 'SELL'}
        onClick={handleOrderClick}
        disabled={disable}
      />
      <br />
      {basket?.qty && (
        <QtyDD
          contracttype={contractType}
          autoHighlight
          autoSelect
          size="small"
          value={basket?.qty}
          options={qtyList}
          popupIcon={null}
          clearIcon={null}
          renderInput={(params) => <TextField {...params} />}
          onChange={(_event, newValue) => handleQtyChange(newValue as string)}
        />
      )}
    </>
  );
};

export const OptionChainRow = memo(function OptionChainRow({
  type = 'disabled',
  symbol = '',
  contractType,
}: OptionChainRowProps) {
  const price = useRecoilValue(optionChainPriceSelector(symbol)) || 0;
  const [basket, setBasket] = useRecoilState(basketStateSelector(symbol));
  const resetBasket = useResetRecoilState(basketStateSelector(symbol));

  // Reset basket on unmount
  useEffect(() => {
    return resetBasket;
  }, [resetBasket]);

  const handleOrderClick = useCallback(
    (e: React.SyntheticEvent) => {
      if (!(e.target instanceof HTMLButtonElement)) {
        return;
      }
      if (!basket?.qty) {
        setBasket({
          qty: '1',
          contractType,
          orderType: e.target.dataset?.orderType as string,
        });
      } else if (basket.orderType === e.target.dataset.orderType) {
        resetBasket();
      } else if (
        typeof e.target.dataset?.orderType === 'string' &&
        basket.orderType === flipOrderType(e.target.dataset?.orderType)
      ) {
        setBasket({
          ...basket,
          orderType: e.target.dataset?.orderType as string,
        });
      }
    },
    [basket, setBasket, resetBasket, contractType]
  );

  const handleQtyChange = useCallback(
    (qty: string) => {
      return setBasket({
        ...basket,
        qty,
      });
    },
    [basket, setBasket]
  );

  return contractType === 'PE' ? (
    <>
      <StrikeCell
        align="left"
        sx={{ align: 'left' }}
        className={`${type}-strike`}
      >
        <TxnWidget
          basket={basket}
          contractType={contractType}
          handleQtyChange={handleQtyChange}
          handleOrderClick={handleOrderClick}
          disable={!price}
        />
      </StrikeCell>
      <StrikeCell align="center" className={`${type}-strike`}>
        {price}
      </StrikeCell>
    </>
  ) : (
    <>
      <StrikeCell align="center" className={`${type}-strike`}>
        {price}
      </StrikeCell>
      <StrikeCell
        align="right"
        sx={{ align: 'right' }}
        className={`${type}-strike`}
      >
        <TxnWidget
          basket={basket}
          contractType={contractType}
          handleQtyChange={handleQtyChange}
          handleOrderClick={handleOrderClick}
          disable={!price}
        />
      </StrikeCell>
    </>
  );
});

export const OptionChainRadioRow = memo(function OptionChainRadioRow({
  type,
  symbol,
  contractType,
}: OptionChainRowProps) {
  const price = useRecoilValue(optionChainPriceSelector(symbol));
  const setOpenModal = useSetRecoilState(optionChainRadioModal);
  const { symbol: editSymbol } = useRecoilValue(currentInlineEdit);
  const [selection, setSelection] = useRecoilState(
    inlineEditsSelector(editSymbol)
  );
  const inlineEditStrike = useRecoilValue(optionChainStrikeSelector(symbol));
  const handleSelection = useCallback(
    (e: React.SyntheticEvent<HTMLInputElement>) => {
      setOpenModal({ open: false });
      setSelection((prev) => ({
        ...prev,
        newSymbol: (e.target as HTMLInputElement).value,
      }));
    },
    [inlineEditStrike, setOpenModal, setSelection]
  );

  return contractType === 'PE' ? (
    <>
      <StrikeCell
        align="left"
        sx={{ align: 'left' }}
        className={`${type}-strike`}
      >
        <Radio
          checked={selection?.newStrike === symbol}
          onChange={handleSelection}
          value={symbol}
          name="strike"
          inputProps={{ 'aria-label': symbol as string }}
          sx={{ p: 0 }}
          disabled={editSymbol === symbol}
        />
      </StrikeCell>
      <StrikeCell align="center" className={`${type}-strike`}>
        {price}
      </StrikeCell>
    </>
  ) : (
    <>
      <StrikeCell align="center" className={`${type}-strike`}>
        {price}
      </StrikeCell>
      <StrikeCell
        align="right"
        sx={{ align: 'right' }}
        className={`${type}-strike`}
      >
        <Radio
          checked={selection?.newStrike === symbol}
          onChange={handleSelection}
          value={symbol}
          name="strike"
          inputProps={{ 'aria-label': symbol as string }}
          sx={{ p: 0 }}
          disabled={editSymbol === symbol}
        />
      </StrikeCell>
    </>
  );
});
