// depositDate é keyword no formato DD/MM/AAAA e multivalorado em 33 registros.
// Cada patente conta uma vez, pelo ano mais antigo.
export const PATENT_DEPOSIT_YEAR_SCRIPT = `
int best = 9999;
for (String raw : doc['depositDate']) {
  int slash = raw.lastIndexOf('/');
  if (slash < 0 || raw.length() < slash + 5) continue;
  try {
    int year = Integer.parseInt(raw.substring(slash + 1, slash + 5));
    if (year >= 1900 && year <= 2100 && year < best) best = year;
  } catch (Exception e) {}
}
if (best != 9999) emit(best);
`;

export const GRANTED_KIND_CODES = ["B1", "B8", "Y1", "C1", "F1"];

// Chave numérica AAAAMMDD da data de depósito mais antiga, para ordenar a listagem.
// depositDate é texto DD/MM/AAAA: ordenar o texto colocaria o dia na frente do ano.
export const PATENT_DEPOSIT_SORT_SCRIPT = `
long best = Long.MAX_VALUE;
for (String raw : doc['depositDate']) {
  if (raw.length() < 10) continue;
  try {
    int day = Integer.parseInt(raw.substring(0, 2));
    int month = Integer.parseInt(raw.substring(3, 5));
    int year = Integer.parseInt(raw.substring(6, 10));
    if (year < 1900 || year > 2100 || month < 1 || month > 12 || day < 1 || day > 31) continue;
    long key = year * 10000L + month * 100L + day;
    if (key < best) best = key;
  } catch (Exception e) {}
}
if (best != Long.MAX_VALUE) emit(best);
`;
