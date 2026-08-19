import { CircleAlert, LoaderCircle } from "lucide-react";
import { useTranslation } from "next-i18next";

type Props = {
  height: number;
  loading: boolean;
  error: boolean;
  empty: boolean;
};

export default function ChartFeedback({
  height,
  loading,
  error,
  empty,
}: Props) {
  const { t } = useTranslation("common");

  if (!loading && !error && !empty) return null;

  const message = loading
    ? t("Loading dashboard data")
    : error
      ? t("Unable to load dashboard data")
      : t("No data for selected filters");

  return (
    <div
      className="brcris-chart-card__feedback"
      style={{ height }}
      role={error ? "alert" : "status"}
      aria-live="polite"
    >
      {loading ? (
        <LoaderCircle className="brcris-chart-card__spinner" size={24} />
      ) : (
        <CircleAlert size={24} />
      )}
      <span>{message}</span>
    </div>
  );
}
