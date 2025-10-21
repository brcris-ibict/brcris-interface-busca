import Script from "next/script";
import type { CSSProperties } from "react";

export default function Barra() {
  const barraStyle: CSSProperties = {
    background: "#7F7F7F",
    height: "20px",
    padding: "0 0 0 10px",
    display: "none",
  };
  const ulStyle = {
    listStyle: "none",
  };
  const liStyle: CSSProperties = {
    display: "inline",
    float: "left",
    paddingRight: "10px",
    marginRight: "10px",
    borderRight: "1px solid #EDEDED",
  };

  const linkStyle: CSSProperties = {
    fontFamily: "sans, sans-serif",
    textDecoration: "none",
    color: "white",
  };

  return (
    <>
      <Script
        src="https://barra.brasil.gov.br/barra_2.0.js"
        strategy="lazyOnload"
      />
      <div id="barra-brasil" style={barraStyle}>
        <ul id="menu-barra-temp" style={ulStyle}>
          <li style={liStyle}>
            <a href="http://brasil.gov.br" style={linkStyle}>
              Portal do Governo Brasileiro
            </a>
          </li>
        </ul>
      </div>
    </>
  );
}
