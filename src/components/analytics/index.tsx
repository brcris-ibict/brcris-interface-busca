import Script from "next/script";

const NEXT_PUBLIC_GA_TRACKINK = process.env.NEXT_PUBLIC_GA_TRACKINK;
const CLARITY_PROJECT_ID = "z4164ecuqt";

export default function Analitycs() {
  return (
    <>
      {NEXT_PUBLIC_GA_TRACKINK ? (
        <>
          <Script
            async
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
      ) : null}
      <Script id="microsoft-clarity" strategy="afterInteractive">
        {`
          (function(c,l,a,r,i,t,y){
            c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
            t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
            y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
          })(window, document, "clarity", "script", "${CLARITY_PROJECT_ID}");
        `}
      </Script>
    </>
  );
}
