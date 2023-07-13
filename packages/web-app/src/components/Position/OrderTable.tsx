import Box from '@mui/material/Box';
import { DataGrid } from '@mui/x-data-grid';
import { useRecoilValue } from 'recoil';
import Loading from '../Loading/Loading';
import { orderListSelector } from '../../utils/state';
import { Suspense, useMemo } from 'react';

function OrdersTable() {
  const orderList = useRecoilValue(orderListSelector);
  const columns = useMemo(() => [
    {
      field: 'time',
      headerName: 'Order Time',
      type: 'string',
      width: 200,
      valueGetter: (params) => {
        const date = new Date(params.row.time);
        const dateString = date.toLocaleDateString('en-GB', {
          day: 'numeric',
          month: 'long',
        });
        const timeString = date.toLocaleTimeString('en-IN');
        return `${dateString}, ${timeString}`;
      },
    },
    {
      field: 'expiry',
      headerName: 'Expiry',
      width: 200,
    },
    {
      field: 'strike',
      headerName: 'Strike',
      width: 120,
    },
    {
      field: 'qty',
      headerName: 'Qty (lots)',
      type: 'number',
      width: 120,
    },
    {
      field: 'txnPrice',
      headerName: 'Txn Price',
      type: 'number',
      width: 120,
    },
  ]);

  return (
    <>
      <Box sx={{ height: 500, width: '100%' }}>
        <Suspense fallback={<Loading />}>
          <DataGrid
            rows={orderList}
            columns={columns}
            disableSelectionOnClick
            hideFooter
            paginationModel={{ page: 0, pageSize: 100 }}
          />
        </Suspense>
      </Box>
    </>
  );
}

export default OrdersTable;
