import { Dialog, Paper, Typography } from '@mui/material';
import { useRecoilState } from 'recoil';
import { orderListModal } from '../../utils/state';
import OrdersTable from './OrderTable';

function OrderListModal() {
  const [{ open }, setModalOpen] = useRecoilState(orderListModal);
  return (
    <Dialog
      open={open}
      onClose={() => {
        setModalOpen({ open: false });
      }}
      maxWidth="lg"
      fullWidth
    >
      <Paper sx={{ width: '100%', p: 1 }}>
        <Typography variant="h5" p={1}>
          Order List
        </Typography>
        <OrdersTable />
      </Paper>
    </Dialog>
  );
}

export default OrderListModal;
