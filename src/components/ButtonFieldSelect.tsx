import type { SearchDriverOptions } from "@elastic/search-ui";

type ButtonFieldSelectProps = {
  title: string;
  active: boolean;
  config: SearchDriverOptions;
  searchField: string;
};

export default function ButtonFieldSelect({
  title,
  active,
  config,
  searchField,
}: ButtonFieldSelectProps) {
  return (
    <button
      className={active ? "nav-link active" : "nav-link"}
      data-bs-toggle="tab"
      data-bs-target="#home"
      type="button"
      role="tab"
      aria-controls="home"
      data-field="title"
      aria-selected="true"
      onClick={() => {
        if (config.searchQuery) {
          config.searchQuery.search_fields = {
            [searchField]: {},
          };
        }
      }}
    >
      {title}
    </button>
  );
}
