import { useEffect, useState } from "react";
import { useTranslation } from "next-i18next";
import BrcrisSelect from "./BrcrisSelect";

export type FiltrosPublicacoesState = {
  publicationDate: string;
  type: string;
  language: string;
};

const YEARS = ["2019", "2020", "2021", "2022", "2023", "2024", "2025", "2026"];
const TYPES = [
  "Artigo",
  "Trabalho em Evento",
  "Dissertação",
  "Tese",
  "Capítulo de Livro",
  "Livro",
];
const LANGUAGES = ["Português", "Inglês", "Espanhol"];

type Props = {
  onChange?: (filtros: FiltrosPublicacoesState) => void;
};

export default function FiltrosPublicacoes({ onChange }: Props) {
  const { t } = useTranslation("common");
  const [filtros, setFiltros] = useState<FiltrosPublicacoesState>({
    publicationDate: "",
    type: "",
    language: "",
  });

  useEffect(() => {
    console.log(filtros);
    onChange?.(filtros);
  }, [filtros, onChange]);

  const handleChange = (
    field: keyof FiltrosPublicacoesState,
    value: string,
  ) => {
    setFiltros((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="brcris-filtros">
      <div className="brcris-filtros__fields">
        <BrcrisSelect
          id="pub-ano"
          label={t("Year")}
          value={filtros.publicationDate}
          onChange={(value) => handleChange("publicationDate", value)}
          options={[
            { value: "", label: t("All") },
            ...YEARS.map((y) => ({ value: y, label: y })),
          ]}
        />

        <BrcrisSelect
          id="pub-tipo"
          label={t("Publication type")}
          value={filtros.type}
          onChange={(value) => handleChange("type", value)}
          options={[
            { value: "", label: t("All") },
            ...TYPES.map((tipo) => ({ value: tipo, label: tipo })),
          ]}
        />

        <BrcrisSelect
          id="pub-idioma"
          label={t("Language")}
          value={filtros.language}
          onChange={(value) => handleChange("language", value)}
          options={[
            { value: "", label: t("All") },
            ...LANGUAGES.map((lang) => ({ value: lang, label: lang })),
          ]}
        />
      </div>
    </div>
  );
}
