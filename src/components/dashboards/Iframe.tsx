type IframeProps = {
  url: string;
};

const Iframe = ({ url }: IframeProps) => {
  return (
    <iframe
      id="idIframe"
      title="Conteúdo incorporado"
      src={url}
      width="100%"
      height="1200px"
    ></iframe>
  );
};

export default Iframe;
