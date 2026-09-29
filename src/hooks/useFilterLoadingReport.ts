import { useEffect, useRef } from "react";
import type { PublicationsDashboardFilters } from "../types/PublicationsDashboard";

// Informa ao pai apenas o carregamento disparado por troca de filtro (paginação não conta)
export function useFilterLoadingReport(
  filters: PublicationsDashboardFilters,
  loading: boolean,
  onLoadingChange?: (loading: boolean) => void,
) {
  const callbackRef = useRef(onLoadingChange);
  callbackRef.current = onLoadingChange;

  const filterFetchRef = useRef(false);
  const wasLoadingRef = useRef(false);
  const filtersKey = [
    filters.publicationDate,
    filters.type,
    filters.language,
    filters.institution,
  ].join("|");

  // Marca que o próximo carregamento veio de troca de filtro (e da montagem)
  useEffect(() => {
    filterFetchRef.current = true;
  }, [filtersKey]);

  // Só desmarca quando o carregamento termina (sucesso ou erro)
  useEffect(() => {
    if (wasLoadingRef.current && !loading) {
      filterFetchRef.current = false;
    }
    wasLoadingRef.current = loading;
    callbackRef.current?.(loading && filterFetchRef.current);
  }, [loading, filtersKey]);

  // Garante que o pai não fique travado se o painel desmontar
  useEffect(() => {
    return () => callbackRef.current?.(false);
    
  }, []);

}

export default useFilterLoadingReport;
