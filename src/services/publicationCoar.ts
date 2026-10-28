const COAR_BY_TYPE: Record<string, string> = {
  artigo: "http://purl.org/coar/resource_type/c_6501",
  article: "http://purl.org/coar/resource_type/c_6501",
  "journal article": "http://purl.org/coar/resource_type/c_6501",
  "artigo de conferencia": "http://purl.org/coar/resource_type/c_5794",
  "conference paper": "http://purl.org/coar/resource_type/c_5794",
  "capitulo de livro": "http://purl.org/coar/resource_type/c_3248",
  "book chapter": "http://purl.org/coar/resource_type/c_3248",
  livro: "http://purl.org/coar/resource_type/c_2f33",
  book: "http://purl.org/coar/resource_type/c_2f33",
  dissertacao: "http://purl.org/coar/resource_type/c_bdcc",
  "dissertacao de mestrado": "http://purl.org/coar/resource_type/c_bdcc",
  dissertation: "http://purl.org/coar/resource_type/c_bdcc",
  "master thesis": "http://purl.org/coar/resource_type/c_bdcc",
  tese: "http://purl.org/coar/resource_type/c_db06",
  "tese de doutorado": "http://purl.org/coar/resource_type/c_db06",
  "doctoral thesis": "http://purl.org/coar/resource_type/c_db06",
  thesis: "http://purl.org/coar/resource_type/c_46ec",
  "conjunto de dados": "http://purl.org/coar/resource_type/c_ddb1",
  dataset: "http://purl.org/coar/resource_type/c_ddb1",
  preprint: "http://purl.org/coar/resource_type/c_816b",
};

function normalizeTypeLabel(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function mapTypeToCoar(type: string): string {
  return COAR_BY_TYPE[normalizeTypeLabel(type)] || "";
}
