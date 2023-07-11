import { Dialog } from '@mui/material';
import styled from '@emotion/styled';
import { io } from 'socket.io-client';
import { useEffect } from 'react';
import { useRecoilState, useSetRecoilState, useRecoilValue } from 'recoil';
import OptionChainGrid from './OptionChainGrid';
import {
  optionChainModalState,
  optionChainRadioModal,
} from '../../utils/state';
import OptionChainRadioGrid from './OptionChainRadioGrid';
import { tapeState } from '../../utils/state';
import { optionChainStrikesListSelector } from '../../utils/state';
import { produce } from 'immer';
import { forEach, set } from 'lodash';

export const DrawerHeader = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-end',
  padding: theme.spacing(0, 1),
  ...theme.mixins.toolbar,
}));

const socket = io('http://developer.vbox');

const useOptionChain = () => {
  const setTape = useSetRecoilState(tapeState);
  useEffect(() => {
    const tickUpdate = (data) => {
      setTape((oc) => {
        return produce(oc, (draft) => {
          forEach(data, (value, key) => {
            set(draft, key, value);
          });
          return draft;
        });
      });
    };
    socket.on('tick', tickUpdate);
    return () => {
      socket.off('tick', tickUpdate);
    };
  }, [setTape]);
  const optionChain = useRecoilValue(optionChainStrikesListSelector);
  return { optionChain };
};

export const OptionChainModalFull = () => {
  const [modalOpen, setModalOpen] = useRecoilState(optionChainModalState);
  const { optionChain } = useOptionChain();
  return (
    <Dialog
      open={modalOpen.open}
      onClose={() => setModalOpen((param) => ({ ...param, open: false }))}
      variant="permanent"
      maxWidth="lg"
      fullWidth={true}
    >
      <OptionChainGrid optionChain={optionChain} />
    </Dialog>
  );
};

export const OptionChainRadioModal = () => {
  const [modalOpen, setModalOpen] = useRecoilState(optionChainRadioModal);
  const { optionChain } = useOptionChain();
  return (
    <Dialog
      open={modalOpen.open}
      onClose={() => setModalOpen({ open: false })}
      variant="permanent"
      maxWidth="xs"
      fullWidth={true}
    >
      <OptionChainRadioGrid optionChain={optionChain} />
    </Dialog>
  );
};
