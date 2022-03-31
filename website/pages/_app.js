import { ProvideState } from '../utils/state';
import { ProvideAuth } from '../utils/auth';
import { ThemeProvider, createTheme } from '@mui/material/styles'
import Header from '../components/Header/Header';

import '../styles/globals.css'
import { CssBaseline } from '@mui/material';
import { Toaster } from 'react-hot-toast';
import Head from 'next/head';

const themeOptions = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#47BE68',
    },
    success: {
      main: '#47be68',
    },
    background: {
      default: 'rgb(28, 27, 31)',
      paper: '#201f23',
    },
    secondary: {
      main: '#00601a',
    },
    info: {
      main: '#05dbe7',
    },
    appbar: {
      main: '#121214',
    }
  },
  typography: {
    fontFamily: [
      'Roboto Mono'
    ]
  }
});

function MyApp({ Component, pageProps }) {

  return <>
    <Head>
      <title>Giga Bridge</title>
      <link rel="shortcut icon" href="/logog.png" />
      <meta name="description" content="Generated by create next app" />
      <link
        rel="preload"
        href="/fonts/retro_computer_personal_use.ttf"
        as="font"
        crossOrigin=""
      />
    </Head>
    <ProvideAuth>
      <ProvideState>
        <ThemeProvider theme={themeOptions}>
          <Header />
          <CssBaseline />
          <Toaster />
          <Component {...pageProps} />
        </ThemeProvider>
      </ProvideState>
    </ProvideAuth>
  </>
}

export default MyApp