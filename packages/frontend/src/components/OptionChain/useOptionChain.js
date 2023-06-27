import { tapeState } from '../../utils/state';
import { io } from 'socket.io-client';
import { useEffect } from 'react';
import { useSetRecoilState } from 'recoil';
import { keyBy } from 'lodash';

const socket = io('http://developer.vbox');

const useOptionChain = () => {
  const setTape = useSetRecoilState(tapeState);
  useEffect(() => {
    const tickUpdate = (data) => {
      const newOCData = keyBy(data, 'isOption')['true'];
      setTape((oc) => {
        return {
          ...oc,
          ...newOCData,
        };
      });
    };
    socket.on('tick', tickUpdate);
    return () => {
      socket.off('tick', tickUpdate);
    };
  }, [setTape]);
};

export default useOptionChain;