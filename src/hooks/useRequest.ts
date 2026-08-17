import { useCallback, useState } from "react";

export function useRequest<T>() {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const request = useCallback(
    async (url: string, method: "GET" | "POST", body?: unknown) => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(url, {
          method,
          headers: body ? { "Content-Type": "application/json" } : undefined,
          body: body ? JSON.stringify(body) : undefined,
        });
        const result = await response.json();

        if (!response.ok) {
          setError(result.message || "Falha de comunicação com o servidor.");
          return;
        }

        setData(result);
        
      } catch (err) {
        console.log("Fetch error:", err);
        setError("Falha de comunicação com o servidor.");

      } finally {
        setLoading(false);

      }
    },
    [],
  );

  const get = useCallback((url: string) => request(url, "GET"), [request]);

  const post = useCallback(
    (url: string, body: unknown) => request(url, "POST", body),
    [request],
  );

  return { data, loading, error, get, post };
}

export default useRequest;
