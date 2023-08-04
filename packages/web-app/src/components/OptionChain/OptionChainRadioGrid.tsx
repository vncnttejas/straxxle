import { useEffect } from 'react';
import axios from 'axios';
import { useRecoilValue, useResetRecoilState } from 'recoil';
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
  optionChainStrikesListSelector,
} from '../../utils/state';
import { OptionChainRadioRow } from './OptionChainRow';
import { processSymbol } from '../../utils/order';

export const StrikeCell = styled(TableCell)(() => ({
  paddingTop: 2,
  paddingBottom: 2,
}));

const OptionChainRadioGrid = () => {
  const optionChain = useRecoilValue(optionChainStrikesListSelector);
  const resetOptionChain = useResetRecoilState(optionChainSelector);
  const { symbol } = useRecoilValue(currentInlineEdit);
  useEffect(() => {
    // const { index } = processSymbol(symbol);
    resetOptionChain();
    // TODO: set the oc context from symbol
    return () => {
      resetOptionChain();
    };
  }, [resetOptionChain]);

  return (
    <Paper sx={{ width: '100%' }}>
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
