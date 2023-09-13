import { GridRenderEditCellParams, useGridApiContext } from '@mui/x-data-grid';
import { useSetRecoilState } from 'recoil';
import {
  currentInlineEdit,
  disableEscapeOnConfirmModalState,
  inlineEditsSelector,
} from '../../utils/state';
import { Box, TextField } from '@mui/material';
import { useEffect } from 'react';

export function PriceEditField({
  id,
  value,
  field,
  row,
}: GridRenderEditCellParams): JSX.Element {
  const setInlineEdit = useSetRecoilState(inlineEditsSelector(id));
  const setCurrentEdit = useSetRecoilState(currentInlineEdit);
  const apiRef = useGridApiContext();
  const setDisableEscapeOnModal = useSetRecoilState(disableEscapeOnConfirmModalState);
  useEffect(() => {
    setDisableEscapeOnModal(true);
    return () => setDisableEscapeOnModal(false);
  }, [setDisableEscapeOnModal]);

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
