import { ProvideState } from '../utils/state';
import { ProvideAuth } from '../utils/auth';
import { ThemeProvider, createTheme } from '@mui/material/styles'

import '../styles/globals.css'
import { CssBaseline } from '@mui/material';
import { Toaster } from 'react-hot-toast';
import Head from 'next/head';

const darkTheme = createTheme({
  palette: {
    type: 'light',
    // primary: {
    //   main: '#308C24',
    // },
    // secondary: {
    //   main: '#f50057',
    // },
    // background: {
    //   default: '#233022',
    //   paper: '#263d23',
    // },
    // text: {
    //   primary: 'rgba(255,254,254,1)',
    //   secondary: 'rgba(255,254,254,0.87)',
    //   disabled: 'rgba(0, 0, 0, 0.38)',
    //   hint: 'rgba(255,254,254,0.87)',
    // },

    // neutral: {
    //   main: '#ffffff',
    //   contrastText: '#000',
    // },
  },
});

function MyApp({ Component, pageProps }) {

  return <>
    <Head>
        <title>Crypto4Meadow</title>
        <link rel="shortcut icon" href="/favicon.png" />
      </Head>
    <ProvideAuth>
      <ProvideState>
        <ThemeProvider theme={darkTheme}>
          <CssBaseline />
          <Toaster />
          
          <Component {...pageProps} />
        </ThemeProvider>
      </ProvideState>
    </ProvideAuth>
  </>
}

export default MyApp
