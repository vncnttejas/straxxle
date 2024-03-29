import { useRecoilValue } from 'recoil';
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
  optionChainStrikesListSelector,
} from '../../utils/state';
import { OptionChainRadioRow } from './OptionChainRow';
import { useOptionChainContext } from './useOptionChainContext';

export const StrikeCell = styled(TableCell)(() => ({
  paddingTop: 2,
  paddingBottom: 2,
}));

const OptionChainRadioGrid = () => {
  const optionChain = useRecoilValue(optionChainStrikesListSelector);
  const { indexSymbol } = useRecoilValue(currentInlineEdit);
  useOptionChainContext(indexSymbol);
  return (
    <Paper sx={{ width: '100%' }}>
      <TableContainer>
        <Table aria-label="sticky table">
          <TableHead>
            <TableRow>
              <TableCell align="center">PUTS</TableCell>
              <TableCell align="center" sx={{ width: 110 }}>
                Strikes ({optionChain.length})
              </TableCell>
              <TableCell align="center">CALLS</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {optionChain.map(
              ([strikePrice, { CE, PE }]) =>
                CE?.['symbol'] &&
                PE?.['symbol'] && (
                  <TableRow key={strikePrice} hover>
                    <OptionChainRadioRow
                      symbol={CE['symbol']}
                      contractType="CE"
                      type={CE['strikeType']}
                    />
                    <StrikeCell align="center">{strikePrice}</StrikeCell>
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
