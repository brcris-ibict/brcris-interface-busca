import { useEffect, useState } from "react";
import { withBasePath } from "../lib/basePath";

type PersonIdentifiers = {
  id: string;
  lattesId: string | null;
  brcrisId: string | null;
};

export function usePersonIdentifiers(ids: string[]) {
  const [data, setData] = useState<PersonIdentifiers[]>([]);
  const [loading, setLoading] = useState(false);

  const idsKey = ids.join(",");

  useEffect(() => {
    if (!ids || ids.length === 0) return;

    const fetchPersons = async () => {
      setLoading(true);

      try {
        const res = await fetch(withBasePath("/api/consulta-autores"), {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ ids }),
        });

        const json = await res.json();

        if (res.ok) {
          setData(json);
        }
      } catch (err) {
        console.error("Erro ao buscar person:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchPersons();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idsKey]);

  return { data, loading };
}
