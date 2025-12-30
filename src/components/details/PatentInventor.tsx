export interface Inventor {
  id: string;
  name: string[];
}

export interface PatentInventorsData {
  inventorsFull: Inventor[];
  inventorsPartial: Inventor[];
}

export async function fetchPatentInventors(
  patentId: string,
): Promise<PatentInventorsData> {
  try {
    const res = await fetch(`/api/inventores?patentId=${patentId}`);
    const json = await res.json();

    if (!res.ok) {
      return { inventorsFull: [], inventorsPartial: [] };
    }

    return {
      inventorsFull: json.inventorsFull ?? [],
      inventorsPartial: json.inventorsPartial ?? [],
    };
  } catch (error) {
    console.error("Erro ao buscar inventores", error);
    return { inventorsFull: [], inventorsPartial: [] };
  }
}
