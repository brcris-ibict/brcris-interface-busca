import { useEffect, useState } from "react";

type PersonIdentifiers = {
  id: string;
  lattesId: string | null;
  brcrisId: string | null;
};

export function usePersonIdentifiers(ids: string[]) {
  const [data, setData] = useState<PersonIdentifiers[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!ids || ids.length === 0) return;

    const fetchPersons = async () => {
      setLoading(true);

      try {
        const res = await fetch("/api/consulta-autores", {
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
  }, [ids]);

  return { data, loading };
}
