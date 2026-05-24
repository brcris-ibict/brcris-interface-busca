import { useTranslation } from "next-i18next";
import { useCallback } from "react";

export function useTranslateSortLabel() {
  const { t } = useTranslation("common");

  return useCallback(
    (label: string) => {
      switch (label) {
        case "Relevance":
          return t("Relevance");
        case "Nome ASC":
          return t("Name — alphabetical order from A to Z");
        case "Nome DESC":
          return t("Name — alphabetical order from Z to A");
        case "Ano ASC":
          return t("Year (oldest → newest)");
        case "Ano DESC":
          return t("Year (newest → oldest)");
        case "Title ASC":
          return t("Title — alphabetical order from A to Z");
        case "Title DESC":
          return t("Title — alphabetical order from Z to A");
        default:
          return label;
      }
    },
    [t],
  );
}
