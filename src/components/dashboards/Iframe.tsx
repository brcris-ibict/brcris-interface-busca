/** biome-ignore-all lint/a11y/useIframeTitle: <explanation> */
type IframeProps = {
  url: string;
};

const Iframe = ({ url }: IframeProps) => {
  return <iframe id="idIframe" src={url} width="100%" height="1200px"></iframe>;
};

export default Iframe;
