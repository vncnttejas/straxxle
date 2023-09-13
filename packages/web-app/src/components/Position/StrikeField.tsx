import { useSetRecoilState } from 'recoil';
import { inlineEditsSelector } from '../../utils/state';
import { Box, Tooltip } from '@mui/material';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import { GridRenderCellParams } from '@mui/x-data-grid';

export function StrikeField(props: GridRenderCellParams): JSX.Element {
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