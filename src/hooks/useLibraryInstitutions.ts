import { useEffect, useState } from "react";

export type LibraryInstitution = {
  id: string;
  name: string;
};

const cache = new Map<string, Record<string, LibraryInstitution>>();
const inflight = new Map<
  string,
  Promise<Record<string, LibraryInstitution>>
>();

async function fetchInstitutions(
  ids: string[],
): Promise<Record<string, LibraryInstitution>> {
  const key = [...ids].sort().join(",");
  const cached = cache.get(key);
  if (cached) return cached;

  const pending = inflight.get(key);
  if (pending) return pending;

  const request = fetch("/api/consulta-instituicoes", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ ids }),
  })
    .then(async (res) => {
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json?.error || "Failed to fetch institutions");
      }
      cache.set(key, json);
      return json as Record<string, LibraryInstitution>;
    })
    .finally(() => {
      inflight.delete(key);
    });

  inflight.set(key, request);
  return request;
}

export function useLibraryInstitutions(ids: string[]) {
  const [data, setData] = useState<Record<string, LibraryInstitution>>({});
  const [loading, setLoading] = useState(false);
  const idsKey = ids.length > 0 ? [...ids].sort().join(",") : "";

  useEffect(() => {
    if (!idsKey) {
      setData({});
      return;
    }

    let cancelled = false;
    const fetchData = async () => {
      setLoading(true);
      try {
        const json = await fetchInstitutions(idsKey.split(","));
        if (!cancelled) setData(json);
      } catch (err) {
        console.error("Erro ao buscar instituições das bibliotecas:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchData();
    return () => {
      cancelled = true;
    };
  }, [idsKey]);

  return { data, loading };
}
