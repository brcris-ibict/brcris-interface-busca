import { useEffect, useState } from "react";
import { withBasePath } from "../lib/basePath";

type PersonIdentifiers = {
  id: string;
  lattesId: string | null;
  brcrisId: string | null;
};

export function usePersonIdentifiers(ids: string[]) {
  const [data, setData] = useState<PersonIdentifiers[]>([]);
  const [settledKey, setSettledKey] = useState("");
  const idsKey = ids.filter(Boolean).join(",");
  const loading = idsKey !== "" && settledKey !== idsKey;

  useEffect(() => {
    if (!idsKey) {
      setData([]);
      setSettledKey("");
      return;
    }

    const controller = new AbortController();

    const fetchPersons = async () => {
      try {
        const res = await fetch(withBasePath("/api/consulta-autores"), {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ ids: idsKey.split(",") }),
          signal: controller.signal,
        });

        const json = await res.json();

        if (res.ok && Array.isArray(json)) {
          setData(json);
        }
      } catch (err) {
        if (controller.signal.aborted) return;
        console.error("Erro ao buscar person:", err);
      } finally {
        if (!controller.signal.aborted) {
          setSettledKey(idsKey);
        }
      }
    };

    fetchPersons();

    return () => controller.abort();
  }, [idsKey]);

  return { data, loading };
}
