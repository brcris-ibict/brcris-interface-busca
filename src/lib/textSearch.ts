export const SEARCH_MIN_LENGTH = 2;
export const SEARCH_MAX_LENGTH = 200;

// Remove acentos e caixa para comparar "Educação" com "educacao"
export function normalizeSearch(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

// Quebra o termo em palavras (mesma lógica do default_operator "and" do ES)
export function searchTokens(term: string) {
  return normalizeSearch(term)
    .split(/\s+/)
    .filter((token) => token.length > 0);
}

// Todas as palavras precisam aparecer no texto
export function matchesSearch(text: string, term: string) {
  const tokens = searchTokens(term);
  if (tokens.length === 0) return true;

  const haystack = normalizeSearch(text);
  
  return tokens.every((token) => haystack.includes(token));

}

export type HighlightSegment = { text: string; match: boolean };

// Segmenta o texto original marcando os trechos que batem com o termo (ignora acento/caixa)
export function highlightSegments(text: string, term: string): HighlightSegment[] {
  const tokens = searchTokens(term).filter(
    (token) => token.length >= SEARCH_MIN_LENGTH,
  );
  if (!text || tokens.length === 0) return [{ text, match: false }];

  // Mapeia cada caractere normalizado para o índice no texto original
  let normalized = "";
  const indexMap: number[] = [];

  for (let i = 0; i < text.length; i += 1) {
    const chunk = normalizeSearch(text[i]);
    for (let j = 0; j < chunk.length; j += 1) {
      normalized += chunk[j];
      indexMap.push(i);
    }
  }

  const ranges: [number, number][] = [];

  tokens.forEach((token) => {
    let from = normalized.indexOf(token);
    while (from !== -1) {
      ranges.push([indexMap[from], indexMap[from + token.length - 1] + 1]);
      from = normalized.indexOf(token, from + token.length);
    }
  });

  if (ranges.length === 0) return [{ text, match: false }];

  ranges.sort((a, b) => a[0] - b[0]);
  const merged: [number, number][] = [];

  ranges.forEach(([start, end]) => {
    const last = merged[merged.length - 1];
    if (last && start <= last[1]) {
      last[1] = Math.max(last[1], end);
    } else {
      merged.push([start, end]);
    }
  });

  const segments: HighlightSegment[] = [];
  let cursor = 0;

  merged.forEach(([start, end]) => {
    if (start > cursor) segments.push({ text: text.slice(cursor, start), match: false });
    segments.push({ text: text.slice(start, end), match: true });
    cursor = end;
  });
  
  if (cursor < text.length) segments.push({ text: text.slice(cursor), match: false });

  return segments;
}
