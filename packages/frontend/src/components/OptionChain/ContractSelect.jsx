import { Box, FormControl, InputLabel, MenuItem, Select } from '@mui/material';
import { useEffect, useState } from 'react';
import useSWR from 'swr';
import axios from 'axios';
import { useResetRecoilState } from 'recoil';
import { optionChainSelector } from '../../utils/state';

const ContractSelect = () => {
  const { data: indexedContracts } = useSWR('/api/get-contracts');
  const contracts = Object.values(indexedContracts);
  const [curContract, setCurContract] = useState('NIFTY');
  const [curExpiry, setCurExpiry] = useState(
    indexedContracts[curContract]?.expiries[0].slug
  );
  const resetOptionChain = useResetRecoilState(optionChainSelector);

  useEffect(() => {
    resetOptionChain();
    const body = {
      expiry: curExpiry,
      symbol: curContract,
    };
    axios.post('/api/set-oc-context', body);
    return () => {
      resetOptionChain();
    };
  }, [curContract, curExpiry]);

  const curContractObj = indexedContracts[curContract];

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
          {contracts.map((contract) => {
            return (
              <MenuItem key={contract.symbol} value={contract.shortName}>
                {contract.shortName}
              </MenuItem>
            );
          })}
        </Select>
      </FormControl>
      <FormControl size="small">
        <InputLabel id="expiry-label">Expiry</InputLabel>
        <Select
          labelId="expiry-label"
          id="expiry"
          value={curExpiry}
          onChange={(e) => setCurExpiry(e.target.value)}
        >
          {curContractObj.expiries.map((expiry) => {
            return (
              <MenuItem key={expiry.slug} value={expiry.slug}>
                {expiry.title}
              </MenuItem>
            );
          })}
        </Select>
      </FormControl>
    </Box>
  );
};

export default ContractSelect;
