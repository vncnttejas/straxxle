import { Box, Button, Container, Grid, Typography } from '@mui/material';
import {
  OptionChainModalFull,
  OptionChainRadioModal,
} from '../OptionChain/OptionChainModal';
import { SpeedDial, SpeedDialIcon } from '@mui/material';
import { useSetRecoilState } from 'recoil';

import PositionTable from '../Position/PositionTable';
import Summary from '../Position/Summary';
import useSWR from 'swr';
import { Paper, styled } from '@mui/material';
import { io } from 'socket.io-client';
import { useEffect } from 'react';
import { optionChainModalState, optionChainState } from '../../utils/state';
import ShoppingBasketIcon from '@mui/icons-material/ShoppingBasket';
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';
import RemoveCircleIcon from '@mui/icons-material/RemoveCircle';
import BackspaceIcon from '@mui/icons-material/Backspace';
import ConfirmOrderModal from '../Position/ConfirmOrderModal';

const socket = io('http://developer.vbox');

export const Item = styled(Paper)(({ theme }) => ({
  backgroundColor: theme.palette.mode === 'dark' ? '#1A2027' : '#fff',
  ...theme.typography.body2,
  padding: theme.spacing(2),
  color: theme.palette.text.secondary,
}));

const MainPage = () => {
  const setOptionChain = useSetRecoilState(optionChainState);
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
            <Box
              sx={{ display: 'flex', gap: 5, justifyContent: 'space-between' }}
            >
              <Box>
                <Typography variant="h5" mb={2}>
                  Position
                </Typography>
              </Box>
              <Box>
                <Button sx={{ px: '10px', minWidth: 'unset' }}>
                  <ShoppingBasketIcon />
                </Button>
                <Button sx={{ px: '10px', minWidth: 'unset' }}>
                  <RocketLaunchIcon />
                </Button>
                <Button sx={{ px: '10px', minWidth: 'unset' }}>
                  <RemoveCircleIcon />
                </Button>
                <Button sx={{ px: '10px', minWidth: 'unset' }}>
                  <BackspaceIcon />
                </Button>
              </Box>
            </Box>
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
      <ConfirmOrderModal />
      <SpeedDial
        ariaLabel="Add Order/Basket"
        sx={{ position: 'absolute', bottom: 20, right: 20 }}
        icon={<SpeedDialIcon />}
        onClick={() => setOpen((prev) => ({ ...prev, open: !prev.open }))}
      />
    </Container>
  );
};

export default MainPage;
