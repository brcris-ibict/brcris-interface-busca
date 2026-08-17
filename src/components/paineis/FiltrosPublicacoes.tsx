import { useTranslation } from "next-i18next";
import type {
  PublicationsDashboardFilterOptions,
  PublicationsDashboardFilters,
} from "../../types/PublicationsDashboard";
import BrcrisSelect from "./BrcrisSelect";

export type FiltrosPublicacoesState = PublicationsDashboardFilters;

type Props = {
  value: FiltrosPublicacoesState;
  options: PublicationsDashboardFilterOptions;
  onChange: (filtros: FiltrosPublicacoesState) => void;
};

export default function FiltrosPublicacoes({
  value,
  options,
  onChange,
}: Props) {
  const { t } = useTranslation("common");

  const handleChange = (
    field: keyof FiltrosPublicacoesState,
    nextValue: string,
  ) => {
    onChange({ ...value, [field]: nextValue });
  };

  return (
    <div className="brcris-filtros">
      <div className="brcris-filtros__fields">
        <BrcrisSelect
          id="pub-ano"
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
          id="pub-tipo"
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
          id="pub-idioma"
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
      </div>
    </div>
  );
}
