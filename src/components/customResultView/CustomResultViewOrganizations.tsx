import type { ResultViewProps } from "@elastic/react-search-ui-views";

const CustomResultViewOrganizations = ({
  result,
  onClickLink,
}: ResultViewProps) => {
  return (
    <li className="sui-result">
      <a onClick={onClickLink} href={`/organizations/${result.id.raw}`}>
        <h2
          dangerouslySetInnerHTML={{
            __html:
              (result.name.snippet || result.name.raw) +
              (result.acronym?.raw ? ` (${result.acronym?.raw})` : ""),
          }}
        ></h2>
        <div className="result-metadata">
          {result.city?.raw && <span>{result.city?.raw}</span>}
          {result.state?.raw && <span>{result.state?.raw}</span>}
          {result.country?.raw && <span>{result.country?.raw}</span>}
        </div>
      </a>
    </li>
  );
};

export default CustomResultViewOrganizations;
