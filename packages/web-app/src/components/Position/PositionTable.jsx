import Box from '@mui/material/Box';
import {
  DataGrid,
  GridActionsCellItem,
  useGridApiContext,
} from '@mui/x-data-grid';
import { io } from 'socket.io-client';
import { useRecoilState, useRecoilValue, useSetRecoilState } from 'recoil';
import { Suspense, useCallback, useEffect, useMemo } from 'react';
import { Button, TextField, Tooltip, Typography, styled } from '@mui/material';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';
import RemoveCircleIcon from '@mui/icons-material/RemoveCircle';
import BackspaceIcon from '@mui/icons-material/Backspace';
import { produce } from 'immer';
import {
  actionDisplaySelector,
  confirmOrderModal,
  currentInlineEdit,
  inlineEditIndicator,
  inlineEditsSelector,
  inlineEditsState,
  optionChainRadioModal,
  posGridRowSelectionState,
  positionState,
  positionSummaryState,
} from '../../utils/state';
import Loading from '../Loading/Loading';
import { set } from 'lodash';

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

const socket = io('http://developer.vbox');

function CustomQtyField({ id, value, row }) {
  const setVal = useSetRecoilState(inlineEditsSelector(id));
  return (
    <>
      <Box>
        <Tooltip title={row?.prevQty || row?.posQty} placement="left">
          <span>{value}</span>
        </Tooltip>
      </Box>
      {row?.qtyEdited && (
        <Box>
          <DeleteForeverIcon
            sx={{
              fontSize: 20,
              color: 'pink',
              p: 0,
              cursor: 'pointer',
            }}
            onClick={() => setVal({ resetQty: id })}
          />
        </Box>
      )}
    </>
  );
}

function CustomStrikeField({ id, value, row }) {
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
            sx={{
              fontSize: 20,
              color: 'pink',
              p: 0,
              cursor: 'pointer',
            }}
            onClick={() => setVal({ resetStrike: id })}
          />
        </Box>
      )}
    </>
  );
}

function CustomQtyEditField({ id, value, field }) {
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
}

function PositionTable() {
  const setPositionSummary = useSetRecoilState(positionSummaryState);
  const setPosition = useSetRecoilState(positionState);
  useEffect(() => {
    const positionUpdate = ({ position, summary }) => {
      setPosition(position);
      setPositionSummary(summary);
    };
    socket.on('position', positionUpdate);
    return () => {
      socket.off('position', positionUpdate);
    };
  }, [setPosition, setPositionSummary]);
  const [rowSelectionModel, setRowSelectionModel] = useRecoilState(
    posGridRowSelectionState
  );
  const { enableOrder, enableDelete, enableClear } = useRecoilValue(
    actionDisplaySelector
  );
  const strikeWiseData = useRecoilValue(inlineEditIndicator);
  const setOpenModal = useSetRecoilState(optionChainRadioModal);
  const setCurrentEdit = useSetRecoilState(currentInlineEdit);
  const setSelection = useSetRecoilState(inlineEditsState);
  const setConfirmModal = useSetRecoilState(confirmOrderModal);
  const resetChanges = useCallback(
    (ids) => {
      setSelection((prev) => {
        const data = produce(prev, (draft) => {
          if (ids.length) {
            for (const id of ids) {
              delete draft[id];
            }
          }
          return draft;
        });
        return data;
      });
    },
    [setSelection]
  );

  const triggerOrder = useCallback(
    (symbols) => {
      setConfirmModal({ open: true, symbols });
    },
    [setConfirmModal]
  );

  const closePosition = useCallback(
    (symbols) => {
      setSelection((prev) =>
        produce(prev, (draft) => {
          symbols.forEach((symbol) => {
            set(draft, `${symbol}.newQty`, 0);
          });
          return draft;
        })
      );
      setConfirmModal({ open: true, symbols });
    },
    [setConfirmModal, setSelection]
  );

  const handleRowSelection = useCallback(
    (newSelection) => {
      setRowSelectionModel(newSelection);
    },
    [setRowSelectionModel]
  );

  const columns = useMemo(
    () => [
      {
        field: 'expiry',
        headerName: 'Expiry',
        width: 200,
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
        getActions: ({ id, row }) => {
          let actions = [];
          const orderNow = (
            <GridActionsCellItem
              key="RocketLaunchIcon"
              icon={<RocketLaunchIcon />}
              label="Order Now"
              onClick={() => triggerOrder([id])}
            />
          );
          const deleteOrder = (
            <GridActionsCellItem
              key="RemoveCircleIcon"
              icon={<RemoveCircleIcon />}
              label="Delete Strike"
              onClick={() => closePosition([id])}
            />
          );
          const resetOrder = (
            <GridActionsCellItem
              key="BackspaceIcon"
              icon={<BackspaceIcon />}
              label="Clear changes"
              onClick={() => resetChanges([id])}
            />
          );
          if (row.strikeEdited || row.qtyEdited) {
            actions = [orderNow, resetOrder];
          } else if (row.posQty) {
            actions = [deleteOrder];
          }
          return actions;
        },
      },
    ],
    [closePosition, resetChanges, triggerOrder]
  );

  return (
    <>
      <Box sx={{ display: 'flex', gap: 5, justifyContent: 'space-between' }}>
        <Box>
          <Typography variant="h5" mb={2}>
            Position
          </Typography>
        </Box>
        <Box>
          {enableOrder && (
            <Button
              sx={{ px: '10px', minWidth: 'unset' }}
              onClick={() => triggerOrder()}
            >
              <RocketLaunchIcon />
            </Button>
          )}
          {enableDelete && (
            <Button
              sx={{ px: '10px', minWidth: 'unset' }}
              onClick={() => closePosition(rowSelectionModel)}
            >
              <RemoveCircleIcon />
            </Button>
          )}
          {enableClear && (
            <Button
              sx={{ px: '10px', minWidth: 'unset' }}
              onClick={() => resetChanges(rowSelectionModel)}
            >
              <BackspaceIcon />
            </Button>
          )}
        </Box>
      </Box>
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
            onRowSelectionModelChange={handleRowSelection}
            rowSelectionModel={rowSelectionModel}
            onCellEditStart={(params) => {
              switch (params.field) {
                case 'strike':
                  setOpenModal({ open: true });
                  setCurrentEdit({ symbol: params.id });
                  break;
                default:
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
                const classList = [];
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
                  default:
                    break;
                }
                return classList.join(' ');
              }
            }}
            isRowSelectable={(params) => params.row.posQty !== 0}
          />
        </Suspense>
      </Box>
    </>
  );
}

export default PositionTable;
