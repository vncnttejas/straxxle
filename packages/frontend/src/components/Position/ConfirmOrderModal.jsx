import { Button, Dialog, Paper, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material'
import { confirmOrderModal, orderViewSelector } from '../../utils/state';
import { useRecoilState, useRecoilValue } from 'recoil';
import { flatten, values } from 'lodash';

const ConfirmOrderModal = () => {
  const [{ open, symbol }, setModalOpen] = useRecoilState(confirmOrderModal);
  const inlineEdits = useRecoilValue(orderViewSelector);
  const orderList = symbol ? inlineEdits[symbol] : flatten(values(inlineEdits));
  return (
    <Dialog
      open={open}
      onClose={() => setModalOpen({ open: false })}
      variant="permanent"
      maxWidth="md"
      fullWidth
    >
      <Paper sx={{ width: '100%', minHeight: 400, p: 1 }}>
        <Typography variant='h5' p={1}>
          Execute Orders
        </Typography>
        <Table sx={{ mb: 3 }}>
          <TableHead>
            <TableCell>
              Symbol
            </TableCell>
            <TableCell>
              Strike
            </TableCell>
            <TableCell>
              Qty
            </TableCell>
            <TableCell>
              Type
            </TableCell>
          </TableHead>
          <TableBody>
            {orderList.map((order) => {
              return (
                <TableRow key={order['symbol']}>
                  <TableCell>
                    {order['symbol']}
                  </TableCell>
                  <TableCell>
                    {order['strike']}
                  </TableCell>
                  <TableCell>
                    {order['qty']}
                  </TableCell>
                  <TableCell>
                    {order['type']}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        <Button variant="contained" color="error" fullWidth>
          Order
      </Button>
      </Paper>
    </Dialog>
  )
};

export default ConfirmOrderModal;
