import { Alert, Dialog, Grid, Slide, Snackbar } from '@mui/material';
import styled from '@emotion/styled';
import NewEntry from './NewEntry';
import { useRecoilState, useRecoilValue, useResetRecoilState } from 'recoil';
import OptionChainGrid from './OptionChainGrid';
import {
  newOrderSnackbarState,
  optionChainModalState,
  optionChainRadioModal,
} from '../../utils/state';
import OptionChainRadioGrid from './OptionChainRadioGrid';

export const DrawerHeader = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-end',
  padding: theme.spacing(0, 1),
  ...theme.mixins.toolbar,
}));

const Transition = (props) => <Slide {...props} direction="up" />;

export const OptionChainModalFull = () => {
  const [modalOpen, setModalOpen] = useRecoilState(optionChainModalState);
  const orderSnackBar = useRecoilValue(newOrderSnackbarState);
  const { open: snackOpen, severity, message } = orderSnackBar;
  const resetOrderSnackbar = useResetRecoilState(newOrderSnackbarState);
  return (
    <>
      <Snackbar
        open={snackOpen}
        autoHideDuration={5 * 1000}
        onClose={resetOrderSnackbar}
        TransitionComponent={Transition}
        anchorOrigin={{ vertical: 'top', horizontal: 'left' }}
      >
        <Alert severity={severity}>{message}</Alert>
      </Snackbar>
      <Dialog
        open={modalOpen.open}
        onClose={() => setModalOpen((param) => ({ ...param, open: false }))}
        variant="permanent"
        maxWidth="xl"
        fullWidth={true}
      >
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <OptionChainGrid />
          </Grid>
          <Grid item xs={12} md={6}>
            <NewEntry />
          </Grid>
        </Grid>
      </Dialog>
    </>
  );
};

export const OptionChainRadioModal = () => {
  const [modalOpen, setModalOpen] = useRecoilState(optionChainRadioModal);
  return (
    <Dialog
      open={modalOpen.open}
      onClose={() => setModalOpen({ open: false })}
      variant="permanent"
      maxWidth="xs"
      fullWidth={true}
    >
      <OptionChainRadioGrid />
    </Dialog>
  );
};
