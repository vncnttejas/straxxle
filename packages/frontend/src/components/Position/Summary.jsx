import {
  Paper,
  Table,
  TableContainer,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  styled,
  Collapse,
  Box,
} from '@mui/material';
import { useRecoilValue, useSetRecoilState } from 'recoil';
import {
  openFeesCollapseState,
  positionSummarySelector,
} from '../../utils/state';
import { memo } from 'react';

const ccyFormat = (num) => {
  return num ? `₹ ${num.toFixed(2)}` : 0;
};

export const SummaryCell = styled(TableCell)(() => ({
  paddingTop: 5,
  paddingBottom: 5,
}));

const FeeBreakup = ({ fees }) => {
  const collapse = useRecoilValue(openFeesCollapseState);
  return (
    <Collapse in={collapse} timeout="auto" unmountOnExit>
      <Box sx={{ pl: 3 }}>
        <Table size="small">
          <TableBody>
            <TableRow>
              <SummaryCell>Brokerage</SummaryCell>
              <SummaryCell align="right">
                {ccyFormat(fees.brokerage)}
              </SummaryCell>
            </TableRow>
            <TableRow>
              <SummaryCell>STT</SummaryCell>
              <SummaryCell align="right">{ccyFormat(fees.stt)}</SummaryCell>
            </TableRow>
            <TableRow>
              <SummaryCell>Exch. Txn. Charges</SummaryCell>
              <SummaryCell align="right">
                {ccyFormat(fees.txnCharges)}
              </SummaryCell>
            </TableRow>
            <TableRow>
              <SummaryCell>GST</SummaryCell>
              <SummaryCell align="right">{ccyFormat(fees.gst)}</SummaryCell>
            </TableRow>
            <TableRow>
              <SummaryCell>SEBI</SummaryCell>
              <SummaryCell align="right">{ccyFormat(fees.sebi)}</SummaryCell>
            </TableRow>
            <TableRow>
              <SummaryCell>Stamp</SummaryCell>
              <SummaryCell align="right">{ccyFormat(fees.stamp)}</SummaryCell>
            </TableRow>
          </TableBody>
        </Table>
      </Box>
    </Collapse>
  );
};

const Summary = memo(function Summary() {
  const setCollapse = useSetRecoilState(openFeesCollapseState);
  const { total, pnl, mtm, fees } = useRecoilValue(positionSummarySelector);
  return (
    <TableContainer component={Paper} sx={{ mt: 2, height: 500 }}>
      <Table stickyHeader aria-label="sticky table">
        <TableHead>
          <TableRow>
            <SummaryCell>Overall</SummaryCell>
            <SummaryCell
              align="right"
              className={
                total === 0 ? '' : total > 0 ? 'stxl-green' : 'stxl-red'
              }
            >
              {ccyFormat(total)}
            </SummaryCell>
          </TableRow>
        </TableHead>
        <TableBody>
          <TableRow>
            <SummaryCell>MTM</SummaryCell>
            <SummaryCell
              align="right"
              className={mtm === 0 ? '' : mtm > 0 ? 'stxl-green' : 'stxl-red'}
            >
              {ccyFormat(mtm)}
            </SummaryCell>
          </TableRow>
          <TableRow>
            <SummaryCell>Gross P&L</SummaryCell>
            <SummaryCell
              align="right"
              className={pnl === 0 ? '' : pnl > 0 ? 'stxl-green' : 'stxl-red'}
            >
              {ccyFormat(pnl)}
            </SummaryCell>
          </TableRow>
          <TableRow
            sx={{ cursor: 'pointer' }}
            onClick={() => setCollapse((prev) => !prev)}
          >
            <SummaryCell>Fees &raquo;</SummaryCell>
            <SummaryCell align="right" className={fees.totalFees && 'stxl-red'}>
              {ccyFormat(0 - fees.totalFees)}
            </SummaryCell>
          </TableRow>
          <TableRow>
            <SummaryCell colSpan={2} sx={{ p: 0, borderBottom: 0 }}>
              <FeeBreakup fees={fees} />
            </SummaryCell>
          </TableRow>
        </TableBody>
      </Table>
    </TableContainer>
  );
});

export default Summary;
