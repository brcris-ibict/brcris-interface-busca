// depositDate/concessionDate são keyword no formato DDMMAAAA; em parte dos registros
// o zero à esquerda do dia foi perdido (ex.: "1072019" = 01/07/2019). Campos multivalorados
// usam a data mais antiga.
export const PAINLESS_DATE_FUNCTIONS = `
long toEpochDay(String raw) {
  String s = raw.length() == 7 ? '0' + raw : raw;
  if (s.length() != 8) { return Long.MIN_VALUE; }
  try {
    return LocalDate.of(Integer.parseInt(s.substring(4, 8)), Integer.parseInt(s.substring(2, 4)), Integer.parseInt(s.substring(0, 2))).toEpochDay();
  } catch (Exception e) {
    return Long.MIN_VALUE;
  }
}
long earliest(def values) {
  long best = Long.MAX_VALUE;
  for (String v : values) {
    long day = toEpochDay(v);
    if (day != Long.MIN_VALUE && day < best) { best = day; }
  }
  return best;
}
`;

export const DEPOSIT_YEAR_SCRIPT = `${PAINLESS_DATE_FUNCTIONS}
long dep = earliest(doc['depositDate']);
if (dep != Long.MAX_VALUE) { emit(LocalDate.ofEpochDay(dep).getYear()); }
`;

// releaseYear é keyword e multivalorado em parte dos registros; usa o ano mais antigo
// para que cada programa seja contado uma única vez.
export const RELEASE_YEAR_SCRIPT = `
int best = 9999;
for (String v : doc['releaseYear']) {
  if (v.length() == 4) {
    try {
      int y = Integer.parseInt(v);
      if (y < best) { best = y; }
    } catch (Exception e) {}
  }
}
if (best != 9999) { emit(best); }
`;

// platform guarda a linguagem de programação em texto livre: vários valores no mesmo campo
// ("HTML; JAVA SCRIPT; PHP"), variações de caixa e termos que não são linguagem.
const LANGUAGE_ALIASES: Record<string, string> = {
  "java script": "javascript",
  js: "javascript",
  jquery: "javascript",
  nodejs: "javascript",
  "node.js": "javascript",
  ajax: "javascript",
  phyton: "python",
  python3: "python",
  django: "python",
  "visual basic 6.0": "visual basic",
  vb: "visual basic",
  "linguagem c": "c",
  "object pascal": "delphi",
};

const NON_LANGUAGE_TERMS = [
  "português", "portugues", "espanhol", "español", "inglês", "ingles", "outros", "outro",
  "windows", "linux", "pc", "android", "multiplataforma", "web", "computacional", ".", "-",
  "excel", "mysql", "xml", "html", "html5", "css", "css3", "sql", "json", "ios", "mac", "unix",
  "internet", "mobile", "desktop",
];

export const PROGRAMMING_LANGUAGE_FIELD = {
  type: "keyword" as const,
  script: {
    source: `
Set out = new HashSet();
for (String raw : doc['platform']) {
  String s = raw.replace(';', ',').replace('/', ',').replace(' e ', ',');
  for (String part : s.splitOnToken(',')) {
    String k = part.trim().toLowerCase();
    if (k.length() == 0 || params.excluded.contains(k)) { continue; }
    out.add(params.aliases.containsKey(k) ? params.aliases.get(k) : k);
  }
}
for (String v : out) { emit(v); }
`,
    params: { aliases: LANGUAGE_ALIASES, excluded: NON_LANGUAGE_TERMS },
  },
};

const LANGUAGE_LABELS: Record<string, string> = {
  java: "Java",
  javascript: "JavaScript",
  typescript: "TypeScript",
  php: "PHP",
  python: "Python",
  "c++": "C++",
  "c#": "C#",
  c: "C",
  matlab: "MATLAB",
  delphi: "Delphi",
  "visual basic": "Visual Basic",
  vba: "VBA",
  r: "R",
  fortran: "Fortran",
  pascal: "Pascal",
  ".net": ".NET",
  labview: "LabVIEW",
  flash: "Flash",
  ruby: "Ruby",
  unity: "Unity",
  "objective-c": "Objective-C",
  vhdl: "VHDL",
  sas: "SAS",
  cobol: "COBOL",
};

export function formatLanguageLabel(key: string) {
  return LANGUAGE_LABELS[key] ?? key.charAt(0).toUpperCase() + key.slice(1);
}
