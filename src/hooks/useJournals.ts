import { useEffect, useState } from "react";
import { fetchJournalsByPublicationIds } from "../services/publicationService";

export function useJournals(results: any) {
  const [journalsMap, setJournalsMap] = useState<Record<string, string>>({});

  useEffect(() => {
    async function loadJournals() {
      if (!results?.length) return;

      const publications = results[0]?.authorOf?.raw || results[0]?.authorOf;

      if (!Array.isArray(publications)) return;

      const ids = publications.map((pub: any) => pub?.id).filter(Boolean);

      if (!ids.length) return;

      const journals = await fetchJournalsByPublicationIds(ids);
      setJournalsMap(journals);
    }

    loadJournals();
  }, [results]);

  return journalsMap;
}
