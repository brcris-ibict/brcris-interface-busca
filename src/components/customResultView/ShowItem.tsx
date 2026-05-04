type ShowItemProps = {
  label: string;
  value: string | string[];
  urlLink?: string;
};

const ShowItem = ({ label, value, urlLink }: ShowItemProps) => {
  if (!value || value === "") return null;

  return (
    <li>
      <span className="sui-result__key">{label}</span>

      <span className="sui-result__value">
        {typeof value === "string" ? (
          urlLink ? (
            <a href={urlLink}>{value}</a>
          ) : (
            value
          )
        ) : (
          value.map((v: string, i: number) => (
            <span key={v}>
              {urlLink ? <a href={urlLink}>{v}</a> : v}
              {i < value.length - 1 && ", "}
            </span>
          ))
        )}
      </span>
    </li>
  );
};

export default ShowItem;
