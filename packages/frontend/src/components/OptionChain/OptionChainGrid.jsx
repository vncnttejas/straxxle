import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import { Paper } from '@mui/material';
import { useRecoilValue } from 'recoil';
import './OptionChain.css';
import { optionChainStrikesSelector } from '../../utils/state';
import { OptionChainRow, StrikeCell } from './OptionChainRow';
import ContractSelect from './ContractSelect';
// import useOptionChain from './useOptionChain';
import { tapeState } from '../../utils/state';
import { io } from 'socket.io-client';
import { useEffect } from 'react';
import { useSetRecoilState } from 'recoil';

const socket = io('http://developer.vbox');

const OptionChainGrid = () => {
  const setTape = useSetRecoilState(tapeState);
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
      <ContractSelect />
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
              <TableCell align="center">
                Strikes ({optionChain.length})
              </TableCell>
              <TableCell>Actions</TableCell>
              <TableCell align="center">LTP</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {optionChain.map(([strikeNum, { CE, PE }]) => (
              <TableRow key={strikeNum} hover>
                <OptionChainRow
                  symbol={CE?.['symbol']}
                  contractType="CE"
                  type={CE?.['strikeType']}
                />
                <StrikeCell align="center">{strikeNum}</StrikeCell>
                <OptionChainRow
                  symbol={PE?.['symbol']}
                  contractType="PE"
                  type={PE?.['strikeType']}
                />
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
};

export default OptionChainGrid;
