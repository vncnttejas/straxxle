import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import { styled } from '@mui/material/styles';
import { Paper } from '@mui/material';
import { useRecoilValue, useResetRecoilState, useSetRecoilState } from 'recoil';
import './OptionChain.css';
import {
  currentInlineEdit,
  inlineEditsState,
  optionChainSelector,
  optionChainStrikesSelector,
  positionState,
  tapeState,
} from '../../utils/state';
import { OptionChainRadioRow } from './OptionChainRow';
import { useEffect } from 'react';
import { io } from 'socket.io-client';
import axios from 'axios';

export const StrikeCell = styled(TableCell)(() => ({
  paddingTop: 2,
  paddingBottom: 2,
}));

const socket = io('http://developer.vbox');

const OptionChainRadioGrid = () => {
  const setTape = useSetRecoilState(tapeState);
  const resetOptionChain = useResetRecoilState(optionChainSelector);
  const inlineEdits = useRecoilValue(currentInlineEdit);
  const position = useRecoilValue(positionState);
  useEffect(() => {
    console.log(inlineEdits);
    console.log(position);
    resetOptionChain();
    const body = {
      symbol: 'NIFTY',
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
