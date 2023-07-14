import Box from '@mui/material/Box';
import { DataGrid, GridValueGetterParams } from '@mui/x-data-grid';
import { useRecoilValue } from 'recoil';
import Loading from '../Common/Loading';
import { orderListSelector } from '../../utils/state';
import { Suspense, useMemo } from 'react';
import { getReadableDate } from '../../utils/date';

function OrdersTable() {
  const orderList = useRecoilValue(orderListSelector);
  const columns = useMemo(
    () => [
      {
        field: 'time',
        headerName: 'Order Time',
        type: 'string',
        width: 200,
        valueGetter: (params: GridValueGetterParams) =>
          getReadableDate(params.row.time),
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
    ],
    []
  );

  return (
    <>
      <Box sx={{ height: 500, width: '100%' }}>
        <Suspense fallback={<Loading />}>
          <DataGrid
            rows={orderList}
            columns={columns}
            hideFooter
            paginationModel={{ page: 0, pageSize: 100 }}
          />
        </Suspense>
      </Box>
    </>
  );
}

export default OrdersTable;
