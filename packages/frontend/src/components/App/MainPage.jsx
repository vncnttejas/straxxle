import {
  Container,
  Typography,
  SpeedDial,
  SpeedDialIcon,
  Paper,
  styled,
  Alert,
  Grid,
  Snackbar,
  Slide,
} from '@mui/material';
import { useRecoilValue, useResetRecoilState, useSetRecoilState } from 'recoil';
import useSWR from 'swr';
import {
  OptionChainModalFull,
  OptionChainRadioModal,
} from '../OptionChain/OptionChainModal';
import PositionTable from '../Position/PositionTable';
import Summary from '../Position/Summary';
import {
  confirmOrderModal,
  newOrderSnackbarState,
  optionChainModalState,
  optionChainRadioModal,
} from '../../utils/state';
import ConfirmOrderModal from '../Position/ConfirmOrderModal';

export const Item = styled(Paper)(({ theme }) => ({
  backgroundColor: theme.palette.mode === 'dark' ? '#1A2027' : '#fff',
  ...theme.typography.body2,
  padding: theme.spacing(2),
  color: theme.palette.text.secondary,
}));

const Transition = (props) => <Slide {...props} direction="up" />;

function MainPage() {
  useSWR('/api/trigger-ticker-socket');
  useSWR('/api/trigger-position-socket');

  const { open: openConfirmModal } = useRecoilValue(confirmOrderModal);
  const { open: openRadioModal } = useRecoilValue(optionChainRadioModal);
  const { open: openChainModal } = useRecoilValue(optionChainModalState);

  // Alert states
  const orderSnackBar = useRecoilValue(newOrderSnackbarState);
  const { open: snackOpen, severity, message } = orderSnackBar;
  const resetOrderSnackbar = useResetRecoilState(newOrderSnackbarState);

  const setOpen = useSetRecoilState(optionChainModalState);

  return (
    <Container maxWidth="xl">
      <Grid container spacing={2} mt={1}>
        <Grid item md={8} xs={12}>
          <Item>
            <PositionTable />
          </Item>
        </Grid>
        <Grid item md={4} xs={12}>
          <Item>
            <Typography variant="h5" mb={2}>
              Summary
            </Typography>
            <Summary />
          </Item>
        </Grid>
      </Grid>
      {openChainModal && <OptionChainModalFull />}
      {openRadioModal && <OptionChainRadioModal />}
      {openConfirmModal && <ConfirmOrderModal />}
      <SpeedDial
        ariaLabel="Add Order/Basket"
        sx={{ position: 'absolute', bottom: 20, right: 20 }}
        icon={<SpeedDialIcon />}
        onClick={() => setOpen((prev) => ({ ...prev, open: !prev.open }))}
      />
      <Snackbar
        open={snackOpen}
        autoHideDuration={5 * 1000}
        onClose={resetOrderSnackbar}
        TransitionComponent={Transition}
        anchorOrigin={{ vertical: 'top', horizontal: 'left' }}
      >
        <Alert severity={severity}>{message}</Alert>
      </Snackbar>
    </Container>
  );
}

export default MainPage;
