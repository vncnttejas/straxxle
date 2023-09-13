import { useRecoilValue, useSetRecoilState } from 'recoil';
import { Box, Button } from '@mui/material';
import { useCallback } from 'react';
import { confirmOrderModalState, selectedStrikesSelector } from '../../utils/state';

function NewEntry() {
  const setModalOpen = useSetRecoilState(confirmOrderModalState);
  const selectedStrikes = useRecoilValue(selectedStrikesSelector);
  const createOrder = useCallback(async () => {
    setModalOpen({ open: true, view: 'fresh' });
  }, []);

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
