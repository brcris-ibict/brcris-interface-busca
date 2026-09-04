import { useTranslation } from "next-i18next";
import type {
  PublicationsDashboardFilterOptions,
  PublicationsDashboardFilters,
} from "../../types/PublicationsDashboard";
import BrcrisSelect from "./BrcrisSelect";

type Props = {
  value: PublicationsDashboardFilters;
  options: PublicationsDashboardFilterOptions;
  onChange: (filters: PublicationsDashboardFilters) => void;
};

export default function PublicationsFilters({
  value,
  options,
  onChange,
}: Props) {
  const { t } = useTranslation("common");

  const handleChange = (
    field: keyof PublicationsDashboardFilters,
    nextValue: string,
  ) => {
    onChange({ ...value, [field]: nextValue });
  };

  return (
    <div className="brcris-filters">
      <div className="brcris-filters__fields">
        <BrcrisSelect
          id="pub-year"
          label={t("Year")}
          value={value.publicationDate}
          onChange={(value) => handleChange("publicationDate", value)}
          options={[
            { value: "", label: t("All") },
            ...options.publicationDates.map((year) => ({
              value: year,
              label: year,
            })),
          ]}
        />

        <BrcrisSelect
          id="pub-type"
          label={t("Publication type")}
          value={value.type}
          onChange={(value) => handleChange("type", value)}
          options={[
            { value: "", label: t("All") },
            ...options.types.map((type) => ({
              value: type,
              label: t(type),
            })),
          ]}
        />

        <BrcrisSelect
          id="pub-language"
          label={t("Language")}
          value={value.language}
          onChange={(value) => handleChange("language", value)}
          options={[
            { value: "", label: t("All") },
            ...options.languages.map((language) => ({
              value: language,
              label: language,
            })),
          ]}
        />

        <BrcrisSelect
          id="pub-institution"
          label={t("Institution")}
          value={value.institution}
          onChange={(value) => handleChange("institution", value)}
          options={[
            { value: "", label: t("All") },
            ...options.institutions.map((institution) => ({
              value: institution,
              label: institution,
            })),
          ]}
        />
      </div>
    </div>
  );
}
