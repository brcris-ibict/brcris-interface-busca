/** biome-ignore-all lint/suspicious/noArrayIndexKey: <explanation> */
type ShowItemProps = {
  label: string;
  value: string | string[];
  urlLink?: string;
};

const ShowItem = ({ label, value, urlLink }: ShowItemProps) => {
  return value === undefined || value === null || value === "" ? null : (
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
          value?.map((v: string, index: number) => (
            <span key={index}>
              {urlLink ? <a href={urlLink}>{value}</a> : v}
            </span>
          ))
        )}
      </span>
    </li>
  );
};

export default ShowItem;
