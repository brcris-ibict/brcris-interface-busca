/* eslint-disable @typescript-eslint/ban-ts-comment */
import type { SearchDriverOptions } from "@elastic/search-ui";

type OperatorSelectProps = {
  config: SearchDriverOptions;
};

export default function OperatorSelect({ config }: OperatorSelectProps) {
  return (
    <div className="d-flex mt-2 align-items-center">
      <label htmlFor="operator" className="card-title text-h6 me-2">
        Research Operator:
      </label>
      <select
        id="operator"
        onChange={(e) => {
          // @ts-expect-error
          config.searchQuery.operator = e.target.value;
        }}
      >
        <option value="AND">AND</option>
        <option value="OR">OR</option>
      </select>
    </div>
  );
}
