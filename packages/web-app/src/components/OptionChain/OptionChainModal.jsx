import { Dialog } from '@mui/material';
import styled from '@emotion/styled';
import { useRecoilState } from 'recoil';
import OptionChainGrid from './OptionChainGrid';
import {
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

export const OptionChainModalFull = () => {
  const [modalOpen, setModalOpen] = useRecoilState(optionChainModalState);

  return (
    <Dialog
      open={modalOpen.open}
      onClose={() => setModalOpen((param) => ({ ...param, open: false }))}
      variant="permanent"
      maxWidth="lg"
      fullWidth={true}
    >
      <OptionChainGrid />
    </Dialog>
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
