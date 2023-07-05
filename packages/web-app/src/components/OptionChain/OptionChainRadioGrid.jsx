import { useEffect } from 'react';
import { io } from 'socket.io-client';
import axios from 'axios';
import { useRecoilValue, useResetRecoilState, useSetRecoilState } from 'recoil';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import { styled } from '@mui/material/styles';
import { Paper } from '@mui/material';
import './OptionChain.css';
import {
  currentInlineEdit,
  optionChainSelector,
  optionChainStrikesSelector,
  tapeState,
} from '../../utils/state';
import { OptionChainRadioRow } from './OptionChainRow';

export const StrikeCell = styled(TableCell)(() => ({
  paddingTop: 2,
  paddingBottom: 2,
}));

const processSymbol = (symbol) => {
  const [_, index, rawExpiry, strikeNum, contractType] =
    optSymbolRegex.exec(symbol);
  return {
    index,
    rawExpiry,
    strikeNum,
    contractType,
  };
};

const symbolRegexStr =
  '^NSE:(NIFTY|BANKNIFTY|FINNIFTY)([0-9]{2}[A-Z0-9]{3})([0-9]{3,6})([A-Z]{2})$';
const optSymbolRegex = new RegExp(symbolRegexStr);
const socket = io('http://developer.vbox');

const OptionChainRadioGrid = () => {
  const setTape = useSetRecoilState(tapeState);
  const resetOptionChain = useResetRecoilState(optionChainSelector);
  const { symbol } = useRecoilValue(currentInlineEdit);
  useEffect(() => {
    const { index } = processSymbol(symbol);
    resetOptionChain();
    const body = {
      symbol: index,
    };
    axios.post('/api/set-oc-context', body);
    return () => {
      axios.post('/api/set-oc-context', {
        reset: true,
      });
      resetOptionChain();
    };
  }, []);
  useEffect(() => {
    const tickUpdate = (data) => {
      setTape((oc) => {
        return {
          ...oc,
          ...data,
        };
      });
    };
    socket.on('tick', tickUpdate);
    return () => {
      socket.off('tick', tickUpdate);
    };
  }, [setTape]);
  const optionChainStrikes = useRecoilValue(optionChainStrikesSelector);
  const optionChain = Object.entries(optionChainStrikes);

  return (
    <Paper sx={{ width: '100%', minHeight: 400 }}>
      <TableContainer>
        <Table aria-label="sticky table">
          <TableHead>
            <TableRow>
              <TableCell colSpan={2} align="center">
                CALLS
              </TableCell>
              <TableCell colSpan={1}></TableCell>
              <TableCell colSpan={2} align="center">
                PUTS
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell align="center">LTP</TableCell>
              <TableCell align="right">Actions</TableCell>
              <TableCell align="center">Strikes</TableCell>
              <TableCell>Actions</TableCell>
              <TableCell align="center">LTP</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {optionChain.map(
              ([strikeNum, { CE, PE }]) =>
                CE?.['symbol'] &&
                PE?.['symbol'] && (
                  <TableRow key={strikeNum} hover>
                    <OptionChainRadioRow
                      symbol={CE['symbol']}
                      contractType="CE"
                      type={CE['strikeType']}
                    />
                    <StrikeCell align="center">{strikeNum}</StrikeCell>
                    <OptionChainRadioRow
                      symbol={PE['symbol']}
                      contractType="PE"
                      type={PE['strikeType']}
                    />
                  </TableRow>
                )
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
};

export default OptionChainRadioGrid;
