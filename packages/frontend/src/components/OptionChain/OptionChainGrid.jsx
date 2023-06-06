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

const OptionChainGrid = () => {
  const optionChainStrikes = useRecoilValue(optionChainStrikesSelector);
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
            {Object.entries(optionChainStrikes).map(
              ([strikeNum, { CE, PE }]) =>
                CE?.['symbol'] &&
                PE?.['symbol'] && (
                  <TableRow key={strikeNum} hover>
                    <OptionChainRow
                      symbol={CE['symbol']}
                      contractType="CE"
                      type={CE['strikeType']}
                    />
                    <StrikeCell align="center">{strikeNum}</StrikeCell>
                    <OptionChainRow
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

export default OptionChainGrid;
