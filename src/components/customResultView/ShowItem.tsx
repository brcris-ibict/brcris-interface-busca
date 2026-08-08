import { normalizeText } from "../../../utils/Utils";

type ShowItemProps = {
  label: string;
  value: any;
  urlLink?: string;
};

function shouldNormalize(value: string) {
  if (!value) return false;
  if (/^https?:\/\//i.test(value)) return false;
  if (/^10\.\d{4,}/.test(value)) return false;
  if (/^\d{4}([/-]\d{2}){0,2}$/.test(value)) return false;
  if (/^\d{4}-\d{3}[\dXx]$/i.test(value)) return false;
  if (/^[A-Z]{2}$/.test(value)) return false;
  if (/^[A-Z]\d+$/.test(value)) return false;
  if (!/\p{L}{3,}/u.test(value)) return false;
  return true;
}

function formatValue(value: unknown) {
  if (typeof value !== "string") return value;
  return shouldNormalize(value) ? normalizeText(value) : value;
}

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
            formatValue(value)
          )
        ) : Array.isArray(value) ? (
          value.map((v: any, i: number) => (
            <span key={typeof v === "string" ? v : i}>
              {urlLink ? (
                <a href={urlLink}>{v}</a>
              ) : typeof v === "string" ? (
                formatValue(v)
              ) : (
                v
              )}
              {i < value.length - 1 && ", "}
            </span>
          ))
        ) : (
          value
        )}
      </span>
    </li>
  );
};

export default ShowItem;
