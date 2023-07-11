import { io } from 'socket.io-client';
import { useEffect } from 'react';
import { useSetRecoilState, useRecoilValue } from 'recoil';
import { tapeState } from '../../utils/state';
import { optionChainStrikesListSelector } from '../../utils/state';
import { produce } from 'immer';
import { forEach, set } from 'lodash';

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
  return useRecoilValue(optionChainStrikesListSelector);
};

export default useOptionChain;
