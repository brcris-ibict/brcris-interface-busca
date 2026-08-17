import { useEffect, useState } from "react";
import type {
  PublicationsDashboardErrorResponse,
  PublicationsDashboardFilterOptions,
  PublicationsDashboardFilters,
  PublicationsDashboardResponse,
} from "../types/PublicationsDashboard";

const EMPTY_FILTER_OPTIONS: PublicationsDashboardFilterOptions = {
  publicationDates: [],
  types: [],
  languages: [],
};

function buildDashboardUrl(filters: PublicationsDashboardFilters): string {
  const params = new URLSearchParams();

  Object.entries(filters).forEach(([field, value]) => {
    if (value) params.set(field, value);
  });

  const query = params.toString();
  return query
    ? `/api/dashboard/publications?${query}`
    : "/api/dashboard/publications";
}

export default function usePublicationsDashboard(
  filters: PublicationsDashboardFilters,
) {
  const requestUrl = buildDashboardUrl(filters);
  const [data, setData] = useState<PublicationsDashboardResponse | null>(null);
  const [filterOptions, setFilterOptions] =
    useState<PublicationsDashboardFilterOptions>(EMPTY_FILTER_OPTIONS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    async function loadDashboard() {
      setLoading(true);
      setError(false);

      try {
        const response = await fetch(requestUrl, {
          method: "GET",
          headers: { Accept: "application/json" },
          signal: controller.signal,
        });

        if (!response.ok) {
          const body = (await response
            .json()
            .catch(() => null)) as PublicationsDashboardErrorResponse | null;

          throw new Error(body?.error || `HTTP ${response.status}`);
        }

        const result = (await response.json()) as PublicationsDashboardResponse;
        setData(result);
        setFilterOptions(result.filterOptions);
      } catch (requestError: unknown) {
        if (controller.signal.aborted) return;

        console.error("Failed to load publications dashboard", requestError);
        setData(null);
        setError(true);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    void loadDashboard();

    return () => controller.abort();
  }, [requestUrl]);

  return {
    data,
    loading,
    error,
    filterOptions,
  };
}
