import { ThemeProvider, createTheme } from '@mui/material';
import CssBaseline from '@mui/material/CssBaseline';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import './styles.css';
import MainPage from './MainPage';
import useSWR from 'swr';
import Loading from '../Loading/Loading';
import { Suspense } from 'react';

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
  const { data, isLoading } = useSWR('/api/auth');
  if (!isLoading && !data.accessToken) {
    window.location.href = 'http://localhost:3030/fyers-login';
  }

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
