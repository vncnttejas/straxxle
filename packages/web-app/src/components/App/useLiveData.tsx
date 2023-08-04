import { useEffect } from 'react';
import { useSetRecoilState, useRecoilValue } from 'recoil';
import {
  positionState,
  positionSummaryState,
  tapeState,
} from '../../utils/state';
import { produce } from 'immer';
import { forEach, set } from 'lodash';
import { IOptionChainRow, PositionResponse } from '../../utils/types';
import { socket } from '../../utils/socket.io';
import { optionChainContract } from '../../utils/state';

export const useLiveData = () => {
  useEffect(() => {
    socket.connect();
    socket.emit('live-tape');
    socket.emit('live-position');
    return () => {
      socket.off();
      socket.disconnect();
    };
  }, []);

  // Listen to tape update
  const setTape = useSetRecoilState(tapeState);
  const indexSymbol = useRecoilValue(optionChainContract);
  useEffect(() => {
    const tickUpdate = (data: IOptionChainRow) => {
      setTape((oc) =>
        produce(oc, (draft) => {
          forEach(data, (value, key) => {
            set(draft, key, value);
          });
          return draft;
        })
      );
    };
    socket.on('live-tape', tickUpdate);
    return () => {
      socket.off('live-tape', tickUpdate);
    };
  }, [indexSymbol, setTape]);

  // Listen to position update
  const setPositionSummary = useSetRecoilState(positionSummaryState);
  const setPosition = useSetRecoilState(positionState);
  useEffect(() => {
    const positionUpdate = ({ position, summary }: PositionResponse) => {
      setPosition(position);
      setPositionSummary(summary);
    };
    socket.on('live-position', positionUpdate);
    return () => {
      socket.off('live-position', positionUpdate);
    };
  }, []);
};
