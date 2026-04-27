import { useEffect, useState } from "react";

type PublicationYear = {
  id: string;
  year: string | null;
};

export function usePublicationYears(ids: string[]) {
  const [data, setData] = useState<PublicationYear[]>([]);
  const [loading, setLoading] = useState(false);

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
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
  }, [ids.join(",")]);

  return { data, loading };
}
