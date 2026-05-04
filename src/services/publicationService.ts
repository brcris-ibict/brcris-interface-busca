export async function fetchJournalsByPublicationIds(
  ids: string[],
): Promise<Record<string, string>> {
  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return {};
  }

  try {
    const response = await fetch("/api/publicacoes-revista", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Erro API: ${errorText}`);
    }

    const data = await response.json();

    if (!Array.isArray(data)) {
      console.error("Resposta inesperada da API:", data);
      return {};
    }

    const map: Record<string, string> = {};

    data.forEach((item: any) => {
      if (item?.id && item?.journal) {
        map[item.id] = item.journal;
      }
    });

    return map;
  } catch (error) {
    console.error("Erro ao buscar journals:", error);
    return {};
  }
}
