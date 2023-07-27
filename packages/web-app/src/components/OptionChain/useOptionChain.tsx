import { useEffect } from 'react';
import { useSetRecoilState, useRecoilValue } from 'recoil';
import { tapeState } from '../../utils/state';
import { optionChainStrikesListSelector } from '../../utils/state';
import { produce } from 'immer';
import { forEach, set } from 'lodash';
import { IOptionChainRow } from '../../utils/types';
import { socket } from '../../utils/socket.io';
import { optionChainContract } from '../../utils/state';

const useOptionChain = () => {
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
    socket.emit('live-tape', { indexSymbol });
    socket.on('live-tape', tickUpdate);
    return () => {
      socket.off('live-tape', tickUpdate);
    };
  }, [indexSymbol, setTape]);
  return useRecoilValue(optionChainStrikesListSelector);
};

export default useOptionChain;
