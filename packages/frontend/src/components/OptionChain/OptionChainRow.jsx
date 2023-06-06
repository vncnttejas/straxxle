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
import { memo, useCallback, useEffect } from 'react';
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

export const StrikeCell = styled(TableCell)(() => ({
  paddingTop: 2,
  paddingBottom: 2,
}));

const qtyList = computeQtyOptions();

const QtyDD = styled(Autocomplete)(({ contracttype }) => ({
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
}));

const TxnButton = ({ orderType, active, ...props }) => {
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
      {...props}
    >
      {btnName}
    </Button>
  );
};

const TxnWidget = ({
  basket,
  handleOrderClick,
  contractType,
  handleQtyChange,
}) => {
  return (
    <>
      <TxnButton
        orderType="BUY"
        active={basket['orderType'] === 'BUY'}
        onClick={handleOrderClick}
      />
      <TxnButton
        orderType="SELL"
        active={basket['orderType'] === 'SELL'}
        onClick={handleOrderClick}
      />
      <br />
      {basket['qty'] !== '0' && (
        <QtyDD
          contracttype={contractType}
          autoHighlight
          autoSelect
          size="small"
          value={basket['qty']}
          options={qtyList}
          popupIcon={null}
          clearIcon={null}
          renderInput={(params) => <TextField {...params} />}
          onChange={(_, newValue) => handleQtyChange(newValue)}
        />
      )}
    </>
  );
};

export const OptionChainRow = memo(function OptionChainRow({
  type,
  symbol,
  contractType,
}) {
  const price = useRecoilValue(optionChainPriceSelector(symbol));
  const [basket, setBasket] = useRecoilState(basketStateSelector(symbol));
  const resetBasket = useResetRecoilState(basketStateSelector(symbol));

  // Reset basket on unmount
  useEffect(() => {
    return resetBasket;
  }, [resetBasket]);

  const handleOrderClick = useCallback(
    (e) => {
      if (basket['qty'] === '0') {
        setBasket({
          qty: '1',
          contractType,
          orderType: e.target.dataset.orderType,
        });
      } else if (basket['orderType'] === e.target.dataset.orderType) {
        resetBasket();
      } else if (
        basket['orderType'] === flipOrderType(e.target.dataset.orderType)
      ) {
        setBasket({
          ...basket,
          orderType: e.target.dataset.orderType,
        });
      }
    },
    [basket, setBasket, resetBasket, contractType]
  );

  const handleQtyChange = useCallback(
    (qty) => {
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
        />
      </StrikeCell>
    </>
  );
});

export const OptionChainRadioRow = memo(function OptionChainRadioRow({
  type,
  symbol,
  contractType,
}) {
  const price = useRecoilValue(optionChainPriceSelector(symbol));
  const setOpenModal = useSetRecoilState(optionChainRadioModal);
  const { symbol: editSymbol } = useRecoilValue(currentInlineEdit);
  const [selection, setSelection] = useRecoilState(
    inlineEditsSelector(editSymbol)
  );
  const inlineEditStrike = useRecoilValue(optionChainStrikeSelector(symbol));
  const handleSelection = useCallback(
    (e) => {
      setOpenModal({ open: false });
      setSelection((prev) => ({
        ...prev,
        newSymbol: e.target.value,
        strike: inlineEditStrike,
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
          inputProps={{ 'aria-label': symbol }}
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
          inputProps={{ 'aria-label': symbol }}
          sx={{ p: 0 }}
          disabled={editSymbol === symbol}
        />
      </StrikeCell>
    </>
  );
});
