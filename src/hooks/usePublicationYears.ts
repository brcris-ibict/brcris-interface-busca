import { useEffect, useState } from "react";

type PublicationYear = {
  id: string;
  year: string | null;
  authors?: string[];
  advisors?: string[];
};

export function usePublicationYears(ids: string[]) {
  const [data, setData] = useState<PublicationYear[]>([]);
  const [loading, setLoading] = useState(false);

  const idsKey = ids.join(",");

  useEffect(() => {
    if (!ids || ids.length === 0) return;

    const fetchYears = async () => {
      setLoading(true);

      try {
        const res = await fetch("/api/consulta-publicacoes", {
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
        console.error("Erro ao buscar anos:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchYears();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idsKey]);

  return { data, loading };
}
