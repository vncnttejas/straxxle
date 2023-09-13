import {
  Box, Button, Dialog, Paper, Typography,
} from '@mui/material';
import {
  useRecoilState, useRecoilValue, useResetRecoilState, useSetRecoilState,
} from 'recoil';
import { flatten, values } from 'lodash';
import { useCallback, useMemo } from 'react';
import axios from 'axios';
import {
  confirmOrderModalState,
  disableEscapeOnConfirmModalState,
  inlineEditsState,
  newOrderSnackbarState,
  optionChainModalState,
  optionChainSelector,
  orderBasketSelector,
  posGridRowSelectionState,
} from '../../utils/state';
import { DataGrid, GridRenderEditCellParams } from '@mui/x-data-grid';
import { QtyEditField } from './QtyField';
import { PriceEditField } from './PriceField';
import { IOrderRequest } from '../../utils/types';

function ConfirmOrderModal() {
  const [{ open, symbols }, setModalOpen] = useRecoilState(confirmOrderModalState);
  const optionChain = useRecoilValue(optionChainSelector);
  const disableEscapeOnModal = useRecoilValue(disableEscapeOnConfirmModalState);
  const setOptionChainModal = useSetRecoilState(optionChainModalState);
  const inlineEdits = useRecoilValue(orderBasketSelector) as IOrderRequest;
  const setRowSelection = useResetRecoilState(posGridRowSelectionState);
  const setNewOrderSnackbar = useSetRecoilState(newOrderSnackbarState);
  const resetInlineEdits = useResetRecoilState(inlineEditsState);
  const orders = symbols && symbols?.length
    ? flatten(symbols.map((symbol) => inlineEdits[symbol]))
    : flatten(values(inlineEdits));

  const orderList = orders.map((order) => ({
    ...order,
    price: optionChain[order.symbol as string].lp,
    id: order.symbol,
  }));

  const colunns = useMemo(() => [
    {
      field: 'symbol',
      headerName: 'Symbol',
      width: 200,
    },
    {
      field: 'expiry',
      headerName: 'Expiry',
      width: 150,
    },
    {
      field: 'qty',
      headerName: 'Quantity',
      width: 100,
      editable: true,
      type: 'number',
      renderEditCell: (params: GridRenderEditCellParams) => (
        <QtyEditField {...params} />
      ),
    },
    {
      field: 'price',
      headerName: 'Txn Price',
      width: 100,
      editable: true,
      type: 'number',
      renderEditCell: (params: GridRenderEditCellParams) => (
        <PriceEditField {...params} />
      ),
    },
  ], [disableEscapeOnModal]);

  const handleClick = useCallback(async () => {
    try {
      await axios.post('/api/orders', orderList);
      setNewOrderSnackbar({
        open: true,
        message: 'Order created successfully',
        severity: 'success',
      });
      resetInlineEdits();
      setRowSelection();
      setModalOpen({ open: false, symbols: [], view: null });
      setOptionChainModal({ open: false });
      
    } catch (e) {
      let message = 'Order creation failed';
      if (e instanceof Error) {
        message = `Order creation failed: ${e.message}`;
      }
      setNewOrderSnackbar({ open: true, message, severity: 'error' });
    }
  }, [orderList, resetInlineEdits, setModalOpen, setNewOrderSnackbar]);

  return (
    <Dialog
      open={open}
      disableEscapeKeyDown={disableEscapeOnModal}
      onClose={() => {
        setModalOpen({ open: false, view: null });
      }}
      maxWidth="md"
      fullWidth
    >
      <Paper sx={{ width: '100%', p: 2 }}>
        <Typography variant="h5" p={1}>
          Order Summary
        </Typography>
        <DataGrid
          rows={orderList}
          columns={colunns}
          hideFooter
          density="compact"
          disableColumnMenu
          checkboxSelection
          paginationModel={{ page: 0, pageSize: 100 }}
        />
        <Box pt={5}>
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
