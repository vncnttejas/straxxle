import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import { Grid, Paper } from '@mui/material';
import NewEntry from './NewEntry';
import { OptionChainRow, StrikeCell } from './OptionChainRow';
import ContractSelect from './ContractSelect';
import './OptionChain.css';
import { useRecoilValue } from 'recoil';
import { optionChainStrikesListSelector } from '../../utils/state';

const OptionChainGrid = () => {
  const optionChain = useRecoilValue(optionChainStrikesListSelector);
  return (
    <Paper sx={{ width: '100%' }}>
      <Grid container spacing={2}>
        <Grid item xs={10}>
          <NewEntry />
        </Grid>
        <Grid item xs={2}>
          <ContractSelect />
        </Grid>
      </Grid>
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
