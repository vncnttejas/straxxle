import Box from '@mui/material/Box';
import {
  DataGrid,
  GridActionsCellItem,
  GridColDef,
  GridRenderCellParams,
  GridRenderEditCellParams,
  GridRowParams,
  useGridApiContext,
} from '@mui/x-data-grid';
import { useRecoilState, useRecoilValue, useSetRecoilState } from 'recoil';
import React, { Suspense, useCallback, useMemo } from 'react';
import { Button, TextField, Tooltip, Typography, styled } from '@mui/material';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';
import RemoveCircleIcon from '@mui/icons-material/RemoveCircle';
import BackspaceIcon from '@mui/icons-material/Backspace';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import { produce } from 'immer';
import {
  actionDisplaySelector,
  confirmOrderModal,
  currentInlineEdit,
  strikeWiseDataSelector,
  inlineEditsSelector,
  inlineEditsState,
  optionChainRadioModal,
  posGridRowSelectionState,
} from '../../utils/state';
import Loading from '../Common/Loading';
import { set } from 'lodash';
import { getNextStrikeSymbol } from '../../utils/order';
import { IdType } from '../../utils/types';

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

function CustomQtyField(props: GridRenderCellParams): JSX.Element {
  const { id, value, row } = props;
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

function StrikeField(props: GridRenderCellParams): JSX.Element {
  const { id, value, row } = props;
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

function QtyEditField({
  id,
  value,
  field,
  row,
}: GridRenderEditCellParams): JSX.Element {
  const setInlineEdit = useSetRecoilState(inlineEditsSelector(id));
  const setCurrentEdit = useSetRecoilState(currentInlineEdit);
  const apiRef = useGridApiContext();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = +e.target.value;
    apiRef.current.setEditCellValue({ id, field, value: newValue });
    setCurrentEdit({ symbol: id, indexSymbol: row.indexSymbol });
    setInlineEdit((prev) => ({ ...prev, newQty: newValue }));
  };

  const handleRef = (element: HTMLDivElement | null) => {
    if (element) {
      const input = element.querySelector(`input[value="${value}"]`);
      (input as HTMLElement)?.focus();
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

function PositionTable(): JSX.Element {
  const strikeData = useRecoilValue(strikeWiseDataSelector);
  const strikeDataList = Object.values(strikeData);
  const setOpenModal = useSetRecoilState(optionChainRadioModal);
  const setCurrentEdit = useSetRecoilState(currentInlineEdit);
  const setSelection = useSetRecoilState(inlineEditsState);
  const setConfirmModal = useSetRecoilState(confirmOrderModal);
  const [rowSelectionModel, setRowSelectionModel] = useRecoilState(
    posGridRowSelectionState
  );
  const { enableOrder, enableDelete, enableClear, enableMove } = useRecoilValue(
    actionDisplaySelector
  );

  const resetChanges = useCallback(
    (ids: IdType[]) => () => {
      ids.forEach((id) => {
        setSelection((prev) => {
          return produce(prev, (draft) => {
            if (ids.length) {
              delete draft[id];
            }
            return draft;
          });
        });
      });
    },
    [setSelection]
  );

  const triggerOrder = useCallback(
    (symbols: IdType[]) => () => {
      setConfirmModal({ open: true, symbols });
    },
    [setConfirmModal]
  );

  const closePosition = useCallback(
    (symbols: IdType[]) => () => {
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
    (newSelection: IdType[]) => {
      setRowSelectionModel(newSelection);
    },
    [setRowSelectionModel]
  );

  const setNextStrike = useCallback(
    (symbols: IdType[], dir: number) => (): void => {
      symbols.forEach((symbol) => {
        const row = strikeData[symbol];
        const symToUpdate = row?.newSymbol || symbol;
        const nextStrike = getNextStrikeSymbol(symToUpdate, dir);
        setSelection((prev) =>
          produce(prev, (draft) => {
            set(draft, `${symbol}.newSymbol`, nextStrike);
            return draft;
          })
        );
      });
    },
    [strikeData, setSelection]
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
        renderCell: (params: GridRenderCellParams) => (
          <StrikeField {...params} />
        ),
      },
      {
        field: 'posQty',
        headerName: 'Qty (lots)',
        type: 'number',
        renderEditCell: (params: GridRenderEditCellParams) => (
          <QtyEditField {...params} />
        ),
        width: 80,
        renderCell: (params: GridRenderCellParams) => (
          <CustomQtyField {...params} />
        ),
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
        width: 200,
        align: 'left',
        cellClassName: 'actions',
        getActions: ({ id, row }: GridRowParams) => {
          const orderNow = (
            <GridActionsCellItem
              key="RocketLaunchIcon"
              icon={<RocketLaunchIcon />}
              label="Order Now"
              onClick={triggerOrder([id])}
            />
          );
          const deleteOrder = (
            <GridActionsCellItem
              key="RemoveCircleIcon"
              icon={<RemoveCircleIcon />}
              label="Delete Strike"
              onClick={closePosition([id])}
            />
          );
          const resetOrder = (
            <GridActionsCellItem
              key="BackspaceIcon"
              icon={<BackspaceIcon />}
              label="Clear changes"
              onClick={resetChanges([id])}
            />
          );
          const increaseStrike = (
            <GridActionsCellItem
              key="KeyboardArrowUpIcon"
              icon={<KeyboardArrowUpIcon />}
              label="Clear changes"
              onClick={setNextStrike([id], 1)}
            />
          );
          const decreaseStrike = (
            <GridActionsCellItem
              key="KeyboardArrowDownIcon"
              icon={<KeyboardArrowDownIcon />}
              label="Clear changes"
              onClick={setNextStrike([id], -1)}
            />
          );
          let actions: JSX.Element[] = [];
          if (row.strikeEdited || row.qtyEdited) {
            actions = [increaseStrike, decreaseStrike, resetOrder, orderNow];
          } else if (row.posQty) {
            actions = [increaseStrike, decreaseStrike, deleteOrder];
          }
          return actions;
        },
      },
    ],
    [closePosition, resetChanges, triggerOrder, strikeData, setNextStrike]
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
              onClick={triggerOrder([])}
            >
              <RocketLaunchIcon />
            </Button>
          )}
          {enableDelete && (
            <Button
              sx={{ px: '10px', minWidth: 'unset' }}
              onClick={closePosition(rowSelectionModel)}
            >
              <RemoveCircleIcon />
            </Button>
          )}
          {enableClear && (
            <Button
              sx={{ px: '10px', minWidth: 'unset' }}
              onClick={resetChanges(rowSelectionModel)}
            >
              <BackspaceIcon />
            </Button>
          )}
          {enableMove && (
            <>
              <Button
                sx={{ px: '10px', minWidth: 'unset' }}
                onClick={setNextStrike(rowSelectionModel, 1)}
              >
                <KeyboardArrowUpIcon />
              </Button>
              <Button
                sx={{ px: '10px', minWidth: 'unset' }}
                onClick={setNextStrike(rowSelectionModel, -1)}
              >
                <KeyboardArrowDownIcon />
              </Button>
            </>
          )}
        </Box>
      </Box>
      <Box sx={{ height: 500, width: '100%' }}>
        <Suspense fallback={<Loading />}>
          <PositionGrid
            rows={strikeDataList}
            columns={columns as GridColDef[]}
            hideFooter
            paginationModel={{ page: 0, pageSize: 100 }}
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
                  setCurrentEdit({
                    symbol: params.id,
                    indexSymbol: params.row.indexSymbol,
                  });
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
                    if (typeof value === 'number') {
                      if (value > 0) {
                        classList.push(`${prefix}-qty-long`);
                      }
                      if (value < 0) {
                        classList.push(`${prefix}-qty-short`);
                      }
                    }
                    if (qtyEdited) {
                      classList.push(`${prefix}-edited`);
                    }
                    break;
                  case 'pnl':
                    if (typeof value === 'number') {
                      if (value > 0) {
                        classList.push(`${prefix}-pnl-positive`);
                      }
                      if (value < 0) {
                        classList.push(`${prefix}-pnl-negative`);
                      }
                    }
                    break;
                  default:
                    break;
                }
                return classList.join(' ');
              }
              return '';
            }}
            isRowSelectable={(params) => {
              const { posQty, prevQty } = params.row;
              return !!prevQty || !!posQty;
            }}
          />
        </Suspense>
      </Box>
    </>
  );
}

export default PositionTable;
