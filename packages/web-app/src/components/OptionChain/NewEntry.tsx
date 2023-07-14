import { useRecoilValue, useResetRecoilState, useSetRecoilState } from 'recoil';
import { Box, Button } from '@mui/material';
import axios from 'axios';
import { useCallback } from 'react';
import {
  appConstants,
  newOrderSnackbarState,
  selectedStrikesSelector,
} from '../../utils/state';

function NewEntry() {
  const { lotSize } = useRecoilValue(appConstants);
  const setNewOrderSnackbar = useSetRecoilState(newOrderSnackbarState);
  const selectedStrikes = useRecoilValue(selectedStrikesSelector);
  const resetSelectedStrikes = useResetRecoilState(selectedStrikesSelector);
  const createOrder = useCallback(async () => {
    const orderEntries = Object.entries(selectedStrikes);
    const orders = orderEntries.map(([key, value]) => ({
      ...value,
      qty: +value.qty * lotSize,
      symbol: key,
    }));

    try {
      await axios.post('/api/orders', orders);
      setNewOrderSnackbar({
        open: true,
        message: 'Order created successfully',
        severity: 'success',
      });
      resetSelectedStrikes();
    } catch (e: unknown) {
      let message = 'Order creation failed';
      if (e instanceof Error) {
        message = `Order creation failed: ${e.message}`;
      }
      setNewOrderSnackbar({ open: true, message, severity: 'error' });
    }
  }, [lotSize, resetSelectedStrikes, selectedStrikes, setNewOrderSnackbar]);

  if (Object.keys(selectedStrikes).length <= 0) {
    return null;
  }

  return (
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
    </Box>
  );
}

export default NewEntry;
