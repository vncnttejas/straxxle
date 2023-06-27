import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import { styled } from '@mui/material/styles';
import { Paper } from '@mui/material';
import { useRecoilValue } from 'recoil';
import './OptionChain.css';
import { optionChainStrikesSelector } from '../../utils/state';
import { OptionChainRadioRow } from './OptionChainRow';
import ContractSelect from './ContractSelect';
import useOptionChain from './useOptionChain';

export const StrikeCell = styled(TableCell)(() => ({
  paddingTop: 2,
  paddingBottom: 2,
}));

const OptionChainRadioGrid = () => {
  useOptionChain();
  const optionChainStrikes = useRecoilValue(optionChainStrikesSelector);
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
