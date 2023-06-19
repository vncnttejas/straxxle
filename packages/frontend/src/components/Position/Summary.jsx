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
import { openFeesCollapseState, positionSummaryState } from '../../utils/state';
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
                {ccyFormat(fees?.brokerage)}
              </SummaryCell>
            </TableRow>
            <TableRow>
              <SummaryCell>STT</SummaryCell>
              <SummaryCell align="right">{ccyFormat(fees?.stt)}</SummaryCell>
            </TableRow>
            <TableRow>
              <SummaryCell>Exch. Txn. Charges</SummaryCell>
              <SummaryCell align="right">
                {ccyFormat(fees?.txnCharges)}
              </SummaryCell>
            </TableRow>
            <TableRow>
              <SummaryCell>GST</SummaryCell>
              <SummaryCell align="right">{ccyFormat(fees?.gst)}</SummaryCell>
            </TableRow>
            <TableRow>
              <SummaryCell>SEBI</SummaryCell>
              <SummaryCell align="right">{ccyFormat(fees?.sebi)}</SummaryCell>
            </TableRow>
            <TableRow>
              <SummaryCell>Stamp</SummaryCell>
              <SummaryCell align="right">{ccyFormat(fees?.stamp)}</SummaryCell>
            </TableRow>
          </TableBody>
        </Table>
      </Box>
    </Collapse>
  );
};

const Summary = memo(function Summary() {
  const setCollapse = useSetRecoilState(openFeesCollapseState);
  const summaryData = useRecoilValue(positionSummaryState);
  const { exitTotal, total, pnl, mtm, fees, orderCount, exitFees } =
    summaryData;
  return (
    <TableContainer component={Paper} sx={{ mt: 2, height: 500 }}>
      <Table stickyHeader aria-label="sticky table">
        <TableBody>
          <TableRow>
            <SummaryCell>Final (Exit Total)</SummaryCell>
            <SummaryCell
              align="right"
              className={
                total === 0 ? '' : total > 0 ? 'stxl-green' : 'stxl-red'
              }
            >
              {ccyFormat(exitTotal)}
            </SummaryCell>
          </TableRow>
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
          <TableRow>
            <SummaryCell>Order Count</SummaryCell>
            <SummaryCell align="right">{orderCount || 0}</SummaryCell>
          </TableRow>
          <TableRow>
            <SummaryCell>Order Count</SummaryCell>
            <SummaryCell align="right">{orderCount || 0}</SummaryCell>
          </TableRow>
          <TableRow>
            <SummaryCell>Exit Fees</SummaryCell>
            <SummaryCell
              align="right"
              className={exitFees?.exitTotalFees && 'stxl-red'}
            >
              {ccyFormat(0 - exitFees?.exitTotalFees)}
            </SummaryCell>
          </TableRow>
          <TableRow
            sx={{ cursor: 'pointer' }}
            onClick={() => setCollapse((prev) => !prev)}
          >
            <SummaryCell>Fees &raquo;</SummaryCell>
            <SummaryCell
              align="right"
              className={fees?.totalFees && 'stxl-red'}
            >
              {ccyFormat(0 - fees?.totalFees)}
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
