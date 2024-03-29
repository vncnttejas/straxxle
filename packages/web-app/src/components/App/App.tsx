import { ThemeProvider, createTheme } from '@mui/material';
import CssBaseline from '@mui/material/CssBaseline';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import './styles.css';
import MainPage from './MainPage';
import useSWR from 'swr';
import Loading from '../Common/Loading';
import { Suspense } from 'react';
import { useLiveData } from './useLiveData';

const theme = createTheme({
  palette: {
    mode: 'dark',
  },
});

const routes = [
  {
    path: '/',
    name: 'Home',
    element: <MainPage />,
  },
];

const App = () => {
  const { data, isLoading } = useSWR('/api/token');
  if (!isLoading && !data.accessToken) {
    window.location.href = 'http://localhost:3030/token/generate';
  }
  useLiveData();

  return (
    <Suspense fallback={<Loading />}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <RouterProvider router={createBrowserRouter(routes)} />
      </ThemeProvider>
    </Suspense>
  );
};

export default App;
