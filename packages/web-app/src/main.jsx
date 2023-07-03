import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './components/App/App'
import { RecoilRoot } from 'recoil';
import { SWRConfig } from 'swr';

const fetcher = (url) => fetch(url).then((r) => r.json());

const config = {
  fetcher,
  suspense: true,
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <RecoilRoot>
      <SWRConfig value={config}>
        <App />
      </SWRConfig>
    </RecoilRoot>
  </React.StrictMode>
);
