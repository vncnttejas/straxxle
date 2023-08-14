import { useRecoilValue, useResetRecoilState } from 'recoil';
import { currentInlineEdit, optionChainSelector } from '../../utils/state';
import { useEffect } from 'react';
import axios from 'axios';

export const useOptionChainContext = () => {
  const resetOptionChain = useResetRecoilState(optionChainSelector);
  const { indexSymbol } = useRecoilValue(currentInlineEdit);
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
