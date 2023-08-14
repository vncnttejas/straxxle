import { useResetRecoilState } from 'recoil';
import { optionChainSelector } from '../../utils/state';
import { useEffect } from 'react';
import axios from 'axios';

export const useOptionChainContext = (indexSymbol: string) => {
  const resetOptionChain = useResetRecoilState(optionChainSelector);
  useEffect(() => {
    resetOptionChain();
    axios.post('/api/tape/set-live-context', {
      indexSymbol,
    });
    return () => {
      axios
        .post('/api/tape/set-live-context', {
          reset: true,
        })
        .then(resetOptionChain);
    };
  }, [indexSymbol]);
};
