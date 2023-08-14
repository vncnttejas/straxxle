import Button, { ButtonProps } from '@mui/material/Button';
import { styled } from '@mui/material/styles';
import {
  Autocomplete,
  Box,
  BoxProps,
  Radio,
  TableCell,
  TextField,
} from '@mui/material';
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
  optionChainDiffSelector,
  optionChainOiLenSelector,
  optionChainOiSelector,
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
  paddingTop: 1,
  paddingBottom: 1,
})) as typeof TableCell;

const qtyList = computeQtyOptions();

const ccyFormat = (num: number) => {
  return num ? `${num.toFixed(2)}` : 0;
};

const commaFormatterIn = new Intl.NumberFormat('en-IN');

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

const StrikeRowContainer = styled(Box)(({ ispe }: { ispe: number }) => ({
  display: 'flex',
  flexDirection: ispe ? 'row-reverse' : 'row',
  justifyContent: ispe ? 'end' : 'start',
  position: 'relative',
}));

const OiBar = styled(Box)(
  ({ ispe, oilen }: { ispe: number; oilen: number }) => ({
    position: 'absolute',
    ...(ispe ? { left: 0 } : { right: 0 }),
    top: 5,
    background: ispe ? '#547a547a' : '#8d41417a',
    width: `${oilen * 90}%`,
    height: '50%',
    verticalAlign: 'middle',
  })
);

const OiBarContainer = styled(Box)({
  position: 'absolute',
  width: '100%',
  height: '100%',
});

const OptionInfo = styled(Box)(({ ispe }: { ispe: number }) => ({
  display: 'flex',
  flexDirection: ispe ? 'row' : 'row-reverse',
  cursor: 'default',
  top: 3,
  position: 'absolute',
  visibility: 'hidden',
  fontSize: '0.8rem',
  px: 3,
  ...(ispe ? { left: 0 } : { right: 0 }),
}));

const OptionInfoItem = styled(Box)({
  padding: '0 4px',
  background: '#0000008c',
  margin: '0 4px 0 0',
});

const StrikePriceContainer = styled(Box)(({ ispe }: { ispe: number }) => ({
  textAlign: ispe ? 'right' : 'left',
  width: 80,
}));

const StrikePriceBox = styled(Box)({
  width: 65,
  textAlign: 'right',
});

const TxnButton = memo(
  ({
    orderType,
    active,
    visible,
    ...restProps
  }: TxnButtonProps & ButtonProps) => {
    const btnName = orderType === 'BUY' ? 'B' : 'S';
    return (
      <Button
        className="stxl-txn-btn"
        variant={active ? 'contained' : 'outlined'}
        color={orderType === 'BUY' ? 'success' : 'error'}
        size="small"
        data-order-type={orderType}
        sx={{
          mr: orderType === 'SELL' ? 0 : 2,
          p: 0,
          minWidth: 25,
          visibility: visible ? 'visible' : 'hidden',
        }}
        {...restProps}
      >
        {btnName}
      </Button>
    );
  }
);

const TxnWidgetBox = ({
  basket,
  handleOrderClick,
  contractType,
  handleQtyChange,
  disable,
  ...props
}: TxnWidgetProps & BoxProps) => {
  return (
    <Box {...props}>
      <Box>
        <TxnButton
          orderType="BUY"
          active={basket?.orderType === 'BUY'}
          onClick={handleOrderClick}
          disabled={disable}
          visible={!!basket?.qty}
        />
        <TxnButton
          orderType="SELL"
          active={basket?.orderType === 'SELL'}
          onClick={handleOrderClick}
          disabled={disable}
          visible={!!basket?.qty}
        />
      </Box>
      <Box>
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
      </Box>
    </Box>
  );
};

export const OptionChainRow = memo(function OptionChainRow({
  type = 'disabled',
  symbol = '',
  contractType,
}: OptionChainRowProps) {
  const price = useRecoilValue(optionChainPriceSelector(symbol)) || 0;
  const oiLen = useRecoilValue(optionChainOiLenSelector(symbol)) || 0;
  const oi = useRecoilValue(optionChainOiSelector(symbol)) || 0;
  const ptsDiff = useRecoilValue(optionChainDiffSelector(symbol)) || 0;
  const [basket, setBasket] = useRecoilState(basketStateSelector(symbol));
  const resetBasket = useResetRecoilState(basketStateSelector(symbol));
  const isPe = contractType === 'PE';
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
  return (
    <StrikeCell className={`stxl-${type}-strike`}>
      <StrikeRowContainer ispe={+isPe}>
        <OiBarContainer>
          <OiBar ispe={+isPe} oilen={oiLen}></OiBar>
        </OiBarContainer>
        <OptionInfo ispe={+isPe} className="stxl-oi-number">
          <OptionInfoItem>DIFF = {ptsDiff}</OptionInfoItem>
          <OptionInfoItem>OI = {commaFormatterIn.format(oi)}</OptionInfoItem>
        </OptionInfo>
        <StrikePriceContainer ispe={+isPe}>
          <StrikePriceBox>{ccyFormat(price)}</StrikePriceBox>
        </StrikePriceContainer>
        <TxnWidgetBox
          basket={basket}
          contractType={contractType}
          handleQtyChange={handleQtyChange}
          handleOrderClick={handleOrderClick}
          disable={!price}
        />
      </StrikeRowContainer>
    </StrikeCell>
  );
});

export const OptionChainRadioRow = memo(function OptionChainRadioRow({
  type,
  symbol,
  contractType,
}: OptionChainRowProps) {
  const price = useRecoilValue(optionChainPriceSelector(symbol)) || 0;
  const oiLen = useRecoilValue(optionChainOiLenSelector(symbol)) || 0;
  const oi = useRecoilValue(optionChainOiSelector(symbol)) || 0;
  const ptsDiff = useRecoilValue(optionChainDiffSelector(symbol)) || 0;
  const setOpenModal = useSetRecoilState(optionChainRadioModal);
  const { symbol: editSymbol } = useRecoilValue(currentInlineEdit);
  const [selection, setSelection] = useRecoilState(
    inlineEditsSelector(editSymbol)
  );
  const isPe = contractType === 'PE';
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
  return (
    <StrikeCell
      className={`stxl-${type}-strike ${
        editSymbol === symbol ? 'stxl-disabled-strike' : ''
      }`}
    >
      <StrikeRowContainer ispe={+isPe}>
        <OiBarContainer>
          <OiBar ispe={+isPe} oilen={oiLen}></OiBar>
        </OiBarContainer>
        <OptionInfo ispe={+isPe} className="stxl-oi-number">
          <OptionInfoItem>DIFF = {ptsDiff}</OptionInfoItem>
          <OptionInfoItem>OI = {commaFormatterIn.format(oi)}</OptionInfoItem>
        </OptionInfo>
        <StrikePriceContainer ispe={+isPe}>
          <StrikePriceBox>{ccyFormat(price)}</StrikePriceBox>
        </StrikePriceContainer>
        <Radio
          checked={selection?.newStrike === symbol}
          onChange={handleSelection}
          value={symbol}
          name="strike"
          inputProps={{ 'aria-label': symbol as string }}
          sx={{ p: 0 }}
          disabled={editSymbol === symbol}
        />
      </StrikeRowContainer>
    </StrikeCell>
  );
});
