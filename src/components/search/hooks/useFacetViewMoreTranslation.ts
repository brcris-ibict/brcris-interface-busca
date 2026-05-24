import { useTranslation } from "next-i18next";
import { useEffect } from "react";

export function useFacetViewMoreTranslation() {
  const { t } = useTranslation("common");

  useEffect(() => {
    const interval = setInterval(() => {
      const buttons = document.querySelectorAll(".sui-facet-view-more");

      buttons.forEach((btn) => {
        if (btn.textContent === "+ More") {
          btn.textContent = t("see more");
        }
        if (btn.textContent === "- Less") {
          btn.textContent = t("see less");
        }
      });
    }, 500);

    return () => clearInterval(interval);
  }, [t]);
}
