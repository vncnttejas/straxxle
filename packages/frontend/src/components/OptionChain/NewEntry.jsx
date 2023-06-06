import { useRecoilValue, useResetRecoilState, useSetRecoilState } from 'recoil';

import { Box, Button } from '@mui/material';
import axios from 'axios';
import { mutate } from 'swr';
import {
  appConstants,
  newOrderSnackbarState,
  selectedStrikesSelector,
} from '../../utils/state';

const NewEntry = () => {
  const { lotSize } = useRecoilValue(appConstants);
  const setNewOrderSnackbar = useSetRecoilState(newOrderSnackbarState);
  const selectedStrikes = useRecoilValue(selectedStrikesSelector);
  const resetSelectedStrikes = useResetRecoilState(selectedStrikesSelector);
  const createOrder = async () => {
    const orders = Object.entries(selectedStrikes).map(([key, value]) => ({
      ...value,
      qty: +value.qty * lotSize,
      symbol: key,
    }));

    try {
      await axios.post('/api/orders', orders);
      const message = 'Order created successfully';
      setNewOrderSnackbar({
        open: true,
        message,
        severity: 'success',
      });
      resetSelectedStrikes();
      mutate('/api/position');
    } catch (e) {
      const message = `Order creation failed: ${e.message}`;
      setNewOrderSnackbar({ open: true, message, severity: 'error' });
    }
  };

  return (
    <>
      {Object.keys(selectedStrikes).length > 0 && (
        <Box m={2}>
          <Button
            variant="contained"
            size="small"
            color="success"
            onClick={createOrder}
            fullWidth
          >
            Order
          </Button>
          <hr />
        </Box>
      )}
    </>
  );
};

export default NewEntry;
