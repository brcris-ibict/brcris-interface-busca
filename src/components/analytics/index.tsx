import Script from "next/script";

const NEXT_PUBLIC_GA_TRACKINK = process.env.NEXT_PUBLIC_GA_TRACKINK;

export default function Analitycs() {
  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${NEXT_PUBLIC_GA_TRACKINK}`}
      />
      <Script id="google-analytics">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
 
          gtag('config', '${NEXT_PUBLIC_GA_TRACKINK}');
        `}
      </Script>
    </>
  );
}
