import Script from "next/script";

const NEXT_PUBLIC_GA_TRACKINK = process.env.NEXT_PUBLIC_GA_TRACKINK;
const GA_MEASUREMENT_IDS = [
  NEXT_PUBLIC_GA_TRACKINK,
  "G-KJ8L6GWV50",
].filter((id, index, ids): id is string => Boolean(id) && ids.indexOf(id) === index);

export default function Analitycs() {
  return (
    <>
      <Script
        async
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_IDS[0]}`}
      />
      <Script id="google-analytics">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          ${GA_MEASUREMENT_IDS.map((id) => `gtag('config', '${id}');`).join("\n          ")}
        `}
      </Script>
    </>
  );
}
