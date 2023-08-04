import { Box, FormControl, InputLabel, MenuItem, Select } from '@mui/material';
import { memo, useEffect } from 'react';
import useSWR from 'swr';
import { useRecoilState, useResetRecoilState } from 'recoil';
import { optionChainContract, optionChainSelector } from '../../utils/state';
import axios from 'axios';

type ContractType = {
  symbol: string;
  shortName: string;
};

const ContractSelect = memo(() => {
  const { data: indexedContracts } = useSWR('/api/tape/index-objects');
  const contracts = Object.values(indexedContracts) as ContractType[];
  const [curContract, setCurContract] = useRecoilState(optionChainContract);
  const resetOptionChain = useResetRecoilState(optionChainSelector);

  useEffect(() => {
    resetOptionChain();
    axios.post('/api/tape/set-live-context', {
      indexSymbol: curContract,
    });
    return () => {
      axios
        .post('/api/tape/set-live-context', {
          reset: true,
        })
        .then(resetOptionChain);
    };
  }, [curContract]);

  return (
    <Box sx={{ pt: 2, pr: 2, textAlign: 'right' }}>
      <FormControl size="small" sx={{ pr: 2 }}>
        <InputLabel id="contract-label">Contract</InputLabel>
        <Select
          labelId="contract-label"
          id="contract"
          value={curContract}
          onChange={(e) => setCurContract(e.target.value)}
        >
          {contracts.map((contract: ContractType) => {
            return (
              <MenuItem key={contract.symbol} value={contract.symbol}>
                {contract.shortName}
              </MenuItem>
            );
          })}
        </Select>
      </FormControl>
    </Box>
  );
});

export default ContractSelect;
