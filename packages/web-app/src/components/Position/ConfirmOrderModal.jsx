import {
  Box, Button, Dialog, Paper, Table, TableBody, TableCell, TableHead, TableRow, Typography,
} from '@mui/material';
import {
  useRecoilState, useRecoilValue, useResetRecoilState, useSetRecoilState,
} from 'recoil';
import { flatten, values } from 'lodash';
import { useCallback } from 'react';
import axios from 'axios';
import {
  confirmOrderModal,
  inlineEditsState,
  newOrderSnackbarState,
  orderViewSelector,
  posGridRowSelectionState,
} from '../../utils/state';

function ConfirmOrderModal() {
  const [{ open, symbols }, setModalOpen] = useRecoilState(confirmOrderModal);
  const inlineEdits = useRecoilValue(orderViewSelector);
  const setRowSelection = useResetRecoilState(posGridRowSelectionState);
  const setNewOrderSnackbar = useSetRecoilState(newOrderSnackbarState);
  const resetInlineEdits = useResetRecoilState(inlineEditsState);
  const orderList = symbols?.length
    ? flatten(symbols.map((symbol) => inlineEdits[symbol]))
    : flatten(values(inlineEdits));

  const handleClick = useCallback(async () => {
    try {
      await axios.post('/api/orders', orderList);
      setNewOrderSnackbar({
        open: true,
        message: 'Order created successfully',
        severity: 'success',
      });
      resetInlineEdits();
      setRowSelection([]);
      setModalOpen({ open: false, symbols: [] });
    } catch (e) {
      const message = `Order creation failed: ${e.message}`;
      setNewOrderSnackbar({ open: true, message, severity: 'error' });
    }
  }, [orderList, resetInlineEdits, setModalOpen, setNewOrderSnackbar]);

  return (
    <Dialog
      open={open}
      onClose={() => {
        setModalOpen({ open: false });
      }}
      variant="permanent"
      maxWidth="md"
      fullWidth
    >
      <Paper sx={{ width: '100%', minHeight: 400, p: 1 }}>
        <Typography variant="h5" p={1}>
          Order Summary
        </Typography>
        <Table sx={{ mb: 3 }}>
          <TableHead>
            <TableRow>
              <TableCell>Symbol</TableCell>
              <TableCell>Strike</TableCell>
              <TableCell>Expiry</TableCell>
              <TableCell>Qty (Contracts)</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {orderList.map((order) => (
              <TableRow
                key={order.symbol}
                className={`stxl-row-${order?.type}`}
              >
                <TableCell>{order.symbol}</TableCell>
                <TableCell>{order.strike}</TableCell>
                <TableCell>{order.expiry}</TableCell>
                <TableCell>{order.qty}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <Box px={5}>
          <Button
            variant="contained"
            color="error"
            onClick={handleClick}
            fullWidth
          >
            Order
          </Button>
        </Box>
      </Paper>
    </Dialog>
  );
}

export default ConfirmOrderModal;
