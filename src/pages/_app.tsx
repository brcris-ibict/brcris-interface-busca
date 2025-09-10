import 'bootstrap/dist/css/bootstrap.min.css'; // Import bootstrap CSS
import 'bootstrap-icons/font/bootstrap-icons.css';

import { appWithTranslation } from 'next-i18next';
import type { AppProps } from 'next/app';
import { useEffect } from 'react';
import Analytics from '../components/analytics';
import Layout from '../components/layouts/Layout';
import '../styles/globals.scss';

import { Roboto } from 'next/font/google';

const roboto = Roboto({
  subsets: ['latin'],
  weight: ['100', '300', '400', '500', '700', '900'],
  style: ['normal', 'italic'],
});

function MyApp({ Component, pageProps }: AppProps) {
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require('bootstrap/dist/js/bootstrap.bundle.min.js');
  }, []);
  return (
    <>
      {/* <Barra /> */}
      <Analytics />
      <Layout fontFamily={roboto.className}>
        <Component {...pageProps} />
      </Layout>
    </>
  );
}

export default appWithTranslation(MyApp);
