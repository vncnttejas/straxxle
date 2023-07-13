import { Box, FormControl, InputLabel, MenuItem, Select } from '@mui/material';
import { memo, useEffect, useState } from 'react';
import useSWR from 'swr';
import axios from 'axios';
import { useResetRecoilState } from 'recoil';
import { optionChainSelector } from '../../utils/state';

type ContractType = {
  symbol: string;
  shortName: string;
};

const ContractSelect = memo(() => {
  const { data: indexedContracts } = useSWR('/api/get-contracts');
  const contracts = Object.values(indexedContracts) as ContractType[];
  const [curContract, setCurContract] = useState('NIFTY');
  const resetOptionChain = useResetRecoilState(optionChainSelector);

  useEffect(() => {
    resetOptionChain();
    const body = {
      symbol: curContract,
    };
    axios.post('/api/set-oc-context', body);
    return () => {
      axios.post('/api/set-oc-context', {
        reset: true,
      });
      resetOptionChain();
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
              <MenuItem key={contract.symbol} value={contract.shortName}>
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
