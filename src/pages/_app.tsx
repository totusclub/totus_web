// pages/_app.tsx
import type { AppProps } from 'next/app';
import { wrapper } from '../store';
// import "slick-carousel/slick/slick.css";
// import "slick-carousel/slick/slick-theme.css";
import '../styles/globals.css';
import Header from "@/components/header";
import Footer from "@/components/footer";

function MyApp({ Component, pageProps }: AppProps) {
    return (
        <div id={'root'}>
            <Header />
                <Component {...pageProps} />
            <Footer />
        </div>
        );
}

export default wrapper.withRedux(MyApp);
