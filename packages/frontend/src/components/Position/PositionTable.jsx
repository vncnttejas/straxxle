import Box from '@mui/material/Box';
import {
  DataGrid,
  GridActionsCellItem,
  useGridApiContext,
} from '@mui/x-data-grid';
import useSWR from 'swr';
import { useRecoilValue, useSetRecoilState } from 'recoil';
import { Suspense, useEffect } from 'react';
import Loading from '../Loading/Loading';
import { TextField, Tooltip, styled } from '@mui/material';
import {
  currentInlineEdit,
  inlineEditIndicator,
  inlineEditsSelector,
  optionChainRadioModal,
  positionSelector,
} from '../../utils/state';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import ShoppingBasketIcon from '@mui/icons-material/ShoppingBasket';
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';
import RemoveCircleIcon from '@mui/icons-material/RemoveCircle';
import BackspaceIcon from '@mui/icons-material/Backspace';

const PositionGrid = styled(DataGrid)(() => ({
  '& .stxl-row-inactive': {
    color: '#555',
  },
  '& .stxl-cell-qty-long': {
    color: '#00ff00',
  },
  '& .stxl-cell-qty-short': {
    color: '#ff0000',
  },
  '& .stxl-cell-pnl-positive': {
    color: '#00ff00',
  },
  '& .stxl-cell-pnl-negative': {
    color: '#ff0000',
  },
}));

const CustomQtyField = ({ id, value, row }) => {
  const setVal = useSetRecoilState(inlineEditsSelector(id));
  return (
    <>
      <Box sx={{ position: 'relative ' }}>
        <Tooltip title={row?.prevQty || row?.posQty} placement="left">
          <span>{value}</span>
        </Tooltip>
      </Box>
      {row?.qtyEdited && (
        <Box>
          <DeleteForeverIcon
            sx={{ fontSize: 20, color: 'pink', p: 0, cursor: 'pointer' }}
            onClick={() => setVal({ resetQty: id })}
          />
        </Box>
      )}
    </>
  );
};

const CustomStrikeField = ({ id, value, row }) => {
  const setVal = useSetRecoilState(inlineEditsSelector(id));
  return (
    <>
      <Box sx={{ position: 'relative ' }}>
        <Tooltip title={row?.prevStrike || row?.strike} placement="left">
          <span>{value}</span>
        </Tooltip>
      </Box>
      {row?.strikeEdited && (
        <Box>
          <DeleteForeverIcon
            sx={{ fontSize: 20, color: 'pink', p: 0, cursor: 'pointer' }}
            onClick={() => setVal({ resetStrike: id })}
          />
        </Box>
      )}
    </>
  );
};

const CustomQtyEditField = ({ id, value, field }) => {
  const setInlineEdit = useSetRecoilState(inlineEditsSelector(id));
  const setCurrentEdit = useSetRecoilState(currentInlineEdit);
  const apiRef = useGridApiContext();

  const handleChange = (e) => {
    const newValue = +e.target.value;
    apiRef.current.setEditCellValue({ id, field, value: newValue });
    setCurrentEdit({ symbol: id });
    setInlineEdit((prev) => ({ ...prev, newQty: newValue }));
  };

  const handleRef = (element) => {
    if (element) {
      const input = element.querySelector(`input[value="${value}"]`);
      input?.focus();
    }
  };

  return (
    <Box sx={{ width: '100%' }}>
      <TextField
        name="rating"
        value={value}
        ref={handleRef}
        onChange={handleChange}
        type="number"
      />
    </Box>
  );
};

const columns = [
  {
    field: 'expiry',
    headerName: 'Expiry',
    width: 140,
  },
  {
    field: 'strike',
    headerName: 'Strike',
    width: 100,
    editable: true,
    renderCell: (params) => <CustomStrikeField {...params} />,
  },
  {
    field: 'posQty',
    headerName: 'Qty (lots)',
    type: 'number',
    renderEditCell: (params) => <CustomQtyEditField {...params} />,
    width: 80,
    renderCell: (params) => <CustomQtyField {...params} />,
    editable: true,
  },
  {
    field: 'posAvg',
    headerName: 'Avg',
    type: 'number',
    width: 80,
  },
  {
    field: 'lp',
    headerName: 'LTP',
    type: 'number',
    width: 80,
  },
  {
    field: 'pnl',
    headerName: 'P&L',
    type: 'number',
    width: 80,
  },
  {
    field: 'actions',
    type: 'actions',
    headerName: 'Actions',
    width: 300,
    cellClassName: 'actions',
    getActions: ({ id }) => {
      return [
        <GridActionsCellItem
          key={1}
          icon={<ShoppingBasketIcon />}
          label="Add to Basket"
          onClick={() => alert(`Add to basket: ${id}`)}
        />,
        <GridActionsCellItem
          key={2}
          icon={<RocketLaunchIcon />}
          label="Order Now"
          onClick={() => alert(`${id}`)}
        />,
        <GridActionsCellItem
          key={3}
          icon={<RemoveCircleIcon />}
          label="Delete Strike"
          onClick={() => alert(`${id}`)}
        />,
        <GridActionsCellItem
          key={3}
          icon={<BackspaceIcon />}
          label="Clear changes"
          onClick={() => alert(`${id}`)}
        />,
      ];
    },
  },
];

const PositionTable = () => {
  const { data: positionData } = useSWR('/api/position');
  const setPosition = useSetRecoilState(positionSelector);
  const strikeWiseData = useRecoilValue(inlineEditIndicator);
  const setOpenModal = useSetRecoilState(optionChainRadioModal);
  const setCurrentEdit = useSetRecoilState(currentInlineEdit);

  useEffect(() => {
    setPosition(positionData);
  }, [positionData, setPosition]);

  return (
    <Box sx={{ height: 500, width: '100%' }}>
      <Suspense fallback={<Loading />}>
        <PositionGrid
          rows={strikeWiseData}
          columns={columns}
          paginationModel={{ page: 0, pageSize: 100 }}
          hideFooter
          checkboxSelection
          disableRowSelectionOnClick
          disableColumnMenu
          density="compact"
          onCellEditStart={(params) => {
            switch (params.field) {
              case 'strike':
                setOpenModal({ open: true });
                setCurrentEdit({ symbol: params.id });
                break;
            }
          }}
          getRowClassName={({ row }) => {
            const prefix = 'stxl-row';
            const { posQty } = row;
            if (posQty > 0) {
              return `${prefix}-long`;
            }
            if (posQty < 0) {
              return `${prefix}-short`;
            }
            return `${prefix}-inactive`;
          }}
          getCellClassName={({ field, value, row }) => {
            const prefix = 'stxl-cell';
            const { posQty, strikeEdited, qtyEdited } = row;
            if (posQty) {
              let classList = [];
              switch (field) {
                case 'strike':
                  if (strikeEdited) {
                    classList.push(`${prefix}-edited`);
                  }
                  break;
                case 'posQty':
                  if (value > 0) {
                    classList.push(`${prefix}-qty-long`);
                  }
                  if (value < 0) {
                    classList.push(`${prefix}-qty-short`);
                  }
                  if (qtyEdited) {
                    classList.push(`${prefix}-edited`);
                  }
                  break;
                case 'pnl':
                  if (value > 0) {
                    classList.push(`${prefix}-pnl-positive`);
                  }
                  if (value < 0) {
                    classList.push(`${prefix}-pnl-negative`);
                  }
                  break;
              }
              return classList.join(' ');
            }
          }}
          isRowSelectable={(params) => params.row.posQty !== 0}
        />
      </Suspense>
    </Box>
  );
};

export default PositionTable;
