import {
  Container, Grid, Typography, SpeedDial, SpeedDialIcon, Paper, styled,
} from '@mui/material';
import { useRecoilValue, useSetRecoilState } from 'recoil';
import useSWR from 'swr';
import { io } from 'socket.io-client';
import { useEffect } from 'react';
import {
  OptionChainModalFull,
  OptionChainRadioModal,
} from '../OptionChain/OptionChainModal';
import PositionTable from '../Position/PositionTable';
import Summary from '../Position/Summary';
import {
  confirmOrderModal,
  optionChainModalState,
  optionChainState,
} from '../../utils/state';
import ConfirmOrderModal from '../Position/ConfirmOrderModal';

const socket = io('http://developer.vbox');

export const Item = styled(Paper)(({ theme }) => ({
  backgroundColor: theme.palette.mode === 'dark' ? '#1A2027' : '#fff',
  ...theme.typography.body2,
  padding: theme.spacing(2),
  color: theme.palette.text.secondary,
}));

function MainPage() {
  const setOptionChain = useSetRecoilState(optionChainState);
  const { open: openConfirmModal } = useRecoilValue(confirmOrderModal);
  useSWR('/api/trigger-ticker-socket');
  useEffect(() => {
    const tickUpdate = (data) => {
      setOptionChain((oc) => ({
        ...oc,
        ...data,
      }));
    };
    socket.on('tick', tickUpdate);
    return () => socket.off('tick', tickUpdate);
  }, [setOptionChain]);

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
        <Grid item md={8} xs={12}>
          <Item>
            <Typography variant="h5" mb={2}>
              Baskets
            </Typography>
          </Item>
        </Grid>
      </Grid>
      <OptionChainModalFull />
      <OptionChainRadioModal />
      {openConfirmModal && <ConfirmOrderModal />}
      <SpeedDial
        ariaLabel="Add Order/Basket"
        sx={{ position: 'absolute', bottom: 20, right: 20 }}
        icon={<SpeedDialIcon />}
        onClick={() => setOpen((prev) => ({ ...prev, open: !prev.open }))}
      />
    </Container>
  );
}

export default MainPage;
