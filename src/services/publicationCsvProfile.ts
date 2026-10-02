import {
  formatPublicationTypesExplicit,
  formatPublicationYearsExplicit,
} from "../../utils/Utils";
import type { PersonCsvFields } from "./enrichPublicationOrcid";
import { emptyPersonFields } from "./enrichPublicationOrcid";
import { collectOrgIds, mapOrgRors } from "./enrichPublicationOrg";
import {
  csvOptions,
  escapeCsvCell,
  firstId,
  formatAuthorNames,
  formatCourseDegrees,
  formatEntityIds,
  formatEntityLabels,
  formatScalarList,
  getAuthorItems,
} from "./JsonToCsv";

export const PUBLICATION_CSV_HEADERS = [
  "id",
  "brcrisId",
  "doi",
  "resourceUrl",
  "oasisbrId",
  "title",
  "alternativeTitle",
  "abstract",
  "language",
  "keywords",
  "publicationDate",
  "type",
  "journal",
  "journal_id",
  "issn",
  "issn_l",
  "eventName",
  "course",
  "course_degree",
  "course_id",
  "advisor",
  "advisor_id",
  "coadvisor",
  "coadvisor_id",
  "titlingOrgUnit",
  "titlingOrgUnit_id",
  "titlingOrgUnit_ror",
  "sponsorOrgUnit",
  "sponsorOrgUnit_id",
  "sponsorOrgUnit_ror",
  "defenceDate",
  "degreeDate",
  "isbn",
  "license",
] as const;

export const AUTHORSHIP_CSV_HEADERS = [
  "publication_id",
  "position",
  "person_id",
  "name",
  "orcid",
  "lattes_id",
  "role",
  "affiliation",
  "affiliation_id",
  "affiliation_ror",
] as const;

export const PERSON_CSV_HEADERS = [
  "person_id",
  "name",
  "preferred_name",
  "name_variants",
  "orcid",
  "lattes_id",
  "affiliation",
  "affiliation_id",
  "affiliation_ror",
] as const;

export const PUBLICATION_SOURCE_FIELDS = [
  "id",
  "brcrisId",
  "doi",
  "resourceUrl",
  "oasisbrId",
  "title",
  "alternativeTitle",
  "abstract",
  "language",
  "keywords",
  "publicationDate",
  "type",
  "journal",
  "issn",
  "eventName",
  "course",
  "advisor",
  "coadvisor",
  "sponsorOrgUnit",
  "defenceDate",
  "degreeDate",
  "isbn",
  "license",
  "author",
];

function isThesisOrDissertation(types: string): boolean {
  return types.split("|").some((item) => {
    const normalized = item.trim().toLowerCase();
    return (
      normalized === "tese" ||
      normalized === "dissertaÃ§Ã£o" ||
      normalized === "dissertacao" ||
      normalized === "doctoral thesis" ||
      normalized === "master thesis" ||
      normalized === "thesis" ||
      normalized === "dissertation"
    );
  });
}

function csvRow(values: Array<string | number>): string {
  return values.map((value) => escapeCsvCell(String(value ?? ""))).join(
    csvOptions.delimiter,
  );
}

function publicationId(source: Record<string, unknown>, fallbackId?: string): string {
  return firstId(source.id) || fallbackId || "";
}

function agentName(item: unknown): string {
  if (typeof item === "object" && item !== null) {
    return formatAuthorNames([item]);
  }
  return String(item ?? "").trim();
}

function agentId(item: unknown): string {
  if (typeof item === "object" && item !== null) {
    return firstId((item as { id?: unknown }).id);
  }
  return "";
}

export type PublicationRecord = Record<
  (typeof PUBLICATION_CSV_HEADERS)[number],
  string
>;

export type AuthorshipRecord = {
  publication_id: string;
  position: number;
  person_id: string;
  name: string;
  orcid: string;
  lattes_id: string;
  role: string;
  affiliation: string;
  affiliation_id: string;
  affiliation_ror: string;
};

export function buildPublicationRecord(
  source: Record<string, unknown>,
  rorByOrgId: Map<string, string>,
  fallbackId?: string,
): PublicationRecord {
  const types = formatPublicationTypesExplicit(source.type);
  const thesis = isThesisOrDissertation(types);
  const orgNames = formatEntityLabels(source.sponsorOrgUnit);
  const orgIds = formatEntityIds(source.sponsorOrgUnit);
  const orgRors = mapOrgRors(source.sponsorOrgUnit, rorByOrgId);

  return {
    id: publicationId(source, fallbackId),
    brcrisId: formatScalarList(source.brcrisId),
    doi: formatScalarList(source.doi),
    resourceUrl: formatScalarList(source.resourceUrl),
    oasisbrId: formatScalarList(source.oasisbrId),
    title: formatScalarList(source.title) || formatEntityLabels(source.title),
    alternativeTitle: formatScalarList(source.alternativeTitle),
    abstract: formatScalarList(source.abstract),
    language: formatScalarList(source.language),
    keywords: formatScalarList(source.keywords),
    publicationDate:
      formatPublicationYearsExplicit(source.publicationDate) ||
      formatScalarList(source.publicationDate),
    type: types,
    journal: formatEntityLabels(source.journal),
    journal_id: formatEntityIds(source.journal),
    issn: formatScalarList(source.issn),
    issn_l: formatScalarList(source.issn_l),
    eventName: formatScalarList(source.eventName),
    course: formatEntityLabels(source.course),
    course_degree: formatCourseDegrees(source.course),
    course_id: formatEntityIds(source.course),
    advisor: formatAuthorNames(source.advisor),
    advisor_id: formatEntityIds(source.advisor),
    coadvisor: formatAuthorNames(source.coadvisor),
    coadvisor_id: formatEntityIds(source.coadvisor),
    titlingOrgUnit: thesis ? orgNames : "",
    titlingOrgUnit_id: thesis ? orgIds : "",
    titlingOrgUnit_ror: thesis ? orgRors : "",
    sponsorOrgUnit: thesis ? "" : orgNames,
    sponsorOrgUnit_id: thesis ? "" : orgIds,
    sponsorOrgUnit_ror: thesis ? "" : orgRors,
    defenceDate: formatScalarList(source.defenceDate),
    degreeDate: formatScalarList(source.degreeDate),
    isbn: formatScalarList(source.isbn),
    license: formatScalarList(source.license),
  };
}

export function buildPublicationCsvRow(
  source: Record<string, unknown>,
  rorByOrgId: Map<string, string>,
  fallbackId?: string,
): string {
  const record = buildPublicationRecord(source, rorByOrgId, fallbackId);
  return csvRow(PUBLICATION_CSV_HEADERS.map((header) => record[header]));
}

export function buildAuthorshipRecords(
  source: Record<string, unknown>,
  peopleById: Map<string, PersonCsvFields>,
  fallbackId?: string,
): AuthorshipRecord[] {
  const pubId = publicationId(source, fallbackId);
  const rows: AuthorshipRecord[] = [];
  const pushAgents = (value: unknown, role: string) => {
    const list = Array.isArray(value) ? value : value ? [value] : [];
    list.forEach((item, index) => {
      const personId = agentId(item);
      const person = personId ? peopleById.get(personId) : undefined;
      const name = person?.name || agentName(item);
      if (!name && !personId) return;
      rows.push({
        publication_id: pubId,
        position: index + 1,
        person_id: personId,
        name,
        orcid: person?.orcid || "",
        lattes_id: person?.lattes_id || "",
        role,
        affiliation: person?.affiliation || "",
        affiliation_id: person?.affiliation_id || "",
        affiliation_ror: person?.affiliation_ror || "",
      });
    });
  };

  getAuthorItems(source).forEach((item, index) => {
    const personId = agentId(item);
    const person = personId ? peopleById.get(personId) : undefined;
    const name = person?.name || agentName(item);
    if (!name && !personId) return;
    rows.push({
      publication_id: pubId,
      position: index + 1,
      person_id: personId,
      name,
      orcid: person?.orcid || "",
      lattes_id: person?.lattes_id || "",
      role: "author",
      affiliation: person?.affiliation || "",
      affiliation_id: person?.affiliation_id || "",
      affiliation_ror: person?.affiliation_ror || "",
    });
  });
  pushAgents(source.advisor, "advisor");
  pushAgents(source.coadvisor, "coadvisor");
  return rows;
}

export function buildAuthorshipCsvRows(
  source: Record<string, unknown>,
  peopleById: Map<string, PersonCsvFields>,
  fallbackId?: string,
): string[] {
  return buildAuthorshipRecords(source, peopleById, fallbackId).map((row) =>
    csvRow(AUTHORSHIP_CSV_HEADERS.map((header) => String(row[header] ?? ""))),
  );
}

export function upsertPersonsFromSource(
  source: Record<string, unknown>,
  peopleById: Map<string, PersonCsvFields>,
  persons: Map<string, PersonCsvFields>,
): void {
  const collect = (value: unknown) => {
    const list = Array.isArray(value) ? value : value ? [value] : [];
    for (const item of list) {
      const personId = agentId(item);
      if (!personId || persons.has(personId)) continue;
      const fetched = peopleById.get(personId);
      persons.set(
        personId,
        fetched || emptyPersonFields(personId, agentName(item)),
      );
    }
  };
  collect(source.author);
  collect(source.advisor);
  collect(source.coadvisor);
}

export function buildPersonRecord(person: PersonCsvFields) {
  const preferred = person.name || person.citationName.split("|")[0] || "";
  const variants = [
    ...person.citationName.split("|"),
    ...person.alternateName.split("|"),
  ]
    .map((item) => item.trim())
    .filter((item) => item && item !== preferred);
  return {
    person_id: person.id,
    name: person.name,
    preferred_name: preferred,
    name_variants: [...new Set(variants)].join("|"),
    orcid: person.orcid,
    lattes_id: person.lattes_id,
    affiliation: person.affiliation,
    affiliation_id: person.affiliation_id,
    affiliation_ror: person.affiliation_ror,
  };
}

export function buildPersonCsvRow(person: PersonCsvFields): string {
  const record = buildPersonRecord(person);
  return csvRow(PERSON_CSV_HEADERS.map((header) => record[header]));
}

export function csvHeaderLine(headers: readonly string[]): string {
  return headers.join(csvOptions.delimiter);
}

export function collectPublicationOrgIds(
  source: Record<string, unknown>,
): string[] {
  return collectOrgIds(source.sponsorOrgUnit);
}

type DictionaryRow = {
  file: string;
  field: string;
  meaning: string;
  format: string;
  obligation: string;
  cardinality: string;
  authority: string;
};

const DICTIONARY_ROWS: DictionaryRow[] = [
  { file: "publications.csv", field: "id", meaning: "Chave primaria interna e estavel do registro no BrCris", format: "string", obligation: "obrigatorio", cardinality: "1", authority: "BrCris" },
  { file: "publications.csv", field: "brcrisId", meaning: "Identificador BrCris tipado", format: "string", obligation: "recomendado", cardinality: "0..n |", authority: "BrCris" },
  { file: "publications.csv", field: "doi", meaning: "DOI persistente", format: "string", obligation: "recomendado", cardinality: "0..n |", authority: "Crossref/DataCite; resolvivel em https://doi.org/{doi}" },
  { file: "publications.csv", field: "resourceUrl", meaning: "URL de acesso ao recurso", format: "URI", obligation: "recomendado", cardinality: "0..n |", authority: "fonte original" },
  { file: "publications.csv", field: "oasisbrId", meaning: "Identificador Oasisbr", format: "string", obligation: "recomendado", cardinality: "0..n |", authority: "Oasisbr/IBICT" },
  { file: "publications.csv", field: "title", meaning: "Titulo", format: "string", obligation: "recomendado", cardinality: "0..n |", authority: "BrCris" },
  { file: "publications.csv", field: "alternativeTitle", meaning: "Titulo alternativo", format: "string", obligation: "recomendado", cardinality: "0..n |", authority: "BrCris" },
  { file: "publications.csv", field: "abstract", meaning: "Resumo", format: "string", obligation: "recomendado", cardinality: "0..n |", authority: "BrCris" },
  { file: "publications.csv", field: "language", meaning: "Idioma", format: "string", obligation: "recomendado", cardinality: "0..n |", authority: "BrCris" },
  { file: "publications.csv", field: "keywords", meaning: "Palavras-chave", format: "string", obligation: "recomendado", cardinality: "0..n |", authority: "BrCris" },
  { file: "publications.csv", field: "publicationDate", meaning: "Ano(s) de publicacao sem eleger um unico", format: "YYYY", obligation: "recomendado", cardinality: "0..n |", authority: "BrCris; nao distingue online vs impresso" },
  { file: "publications.csv", field: "type", meaning: "Tipo documental; registro com tipo composto nao e excluido", format: "string", obligation: "recomendado", cardinality: "0..n |", authority: "BrCris (nao mapeado para COAR nesta versao)" },
  { file: "publications.csv", field: "journal", meaning: "Titulo do periodico", format: "string", obligation: "condicional", cardinality: "0..n |", authority: "indice de periodicos BrCris" },
  { file: "publications.csv", field: "journal_id", meaning: "Identificador do periodico", format: "string", obligation: "condicional", cardinality: "0..n |", authority: "BrCris" },
  { file: "publications.csv", field: "issn", meaning: "ISSN impresso quando distinguivel; senao ISSN do periodico", format: "ISSN", obligation: "recomendado", cardinality: "0..n |", authority: "ISSN International Centre; join no indice de periodicos" },
  { file: "publications.csv", field: "issn_l", meaning: "ISSN-L de ligacao", format: "ISSN", obligation: "recomendado", cardinality: "0..n |", authority: "ISSN International Centre" },
  { file: "publications.csv", field: "eventName", meaning: "Nome textual do evento", format: "string", obligation: "recomendado", cardinality: "0..n |", authority: "BrCris" },
  { file: "publications.csv", field: "course", meaning: "Curso na tese/dissertacao", format: "string", obligation: "condicional", cardinality: "0..n |", authority: "BrCris" },
  { file: "publications.csv", field: "course_degree", meaning: "Grau/nivel (mestrado/doutorado)", format: "string", obligation: "condicional", cardinality: "0..n |", authority: "BrCris" },
  { file: "publications.csv", field: "course_id", meaning: "Identificador do curso", format: "string", obligation: "recomendado", cardinality: "0..n |", authority: "BrCris" },
  { file: "publications.csv", field: "advisor", meaning: "Orientador", format: "string", obligation: "condicional", cardinality: "0..n", authority: "BrCris" },
  { file: "publications.csv", field: "advisor_id", meaning: "Identificador do orientador", format: "string", obligation: "recomendado", cardinality: "0..n", authority: "BrCris" },
  { file: "publications.csv", field: "coadvisor", meaning: "Coorientador", format: "string", obligation: "condicional", cardinality: "0..n", authority: "BrCris" },
  { file: "publications.csv", field: "coadvisor_id", meaning: "Identificador do coorientador", format: "string", obligation: "recomendado", cardinality: "0..n", authority: "BrCris" },
  { file: "publications.csv", field: "titlingOrgUnit", meaning: "Instituicao de titulacao", format: "string", obligation: "condicional", cardinality: "0..n |", authority: "BrCris" },
  { file: "publications.csv", field: "titlingOrgUnit_id", meaning: "Id da instituicao de titulacao", format: "string", obligation: "condicional", cardinality: "0..n |", authority: "BrCris" },
  { file: "publications.csv", field: "titlingOrgUnit_ror", meaning: "ROR da instituicao de titulacao", format: "ROR", obligation: "recomendado", cardinality: "0..n |", authority: "ROR; resolvivel em https://ror.org/{id}" },
  { file: "publications.csv", field: "sponsorOrgUnit", meaning: "Organizacao patrocinadora/vinculada; nao usada como titulacao", format: "string", obligation: "condicional", cardinality: "0..n |", authority: "BrCris" },
  { file: "publications.csv", field: "sponsorOrgUnit_id", meaning: "Id da organizacao patrocinadora", format: "string", obligation: "condicional", cardinality: "0..n |", authority: "BrCris" },
  { file: "publications.csv", field: "sponsorOrgUnit_ror", meaning: "ROR da organizacao patrocinadora", format: "ROR", obligation: "recomendado", cardinality: "0..n |", authority: "ROR" },
  { file: "publications.csv", field: "defenceDate", meaning: "Data de defesa", format: "string", obligation: "condicional", cardinality: "0..n |", authority: "BrCris" },
  { file: "publications.csv", field: "degreeDate", meaning: "Data do grau", format: "string", obligation: "condicional", cardinality: "0..n |", authority: "BrCris" },
  { file: "publications.csv", field: "isbn", meaning: "ISBN", format: "string", obligation: "recomendado", cardinality: "0..n |", authority: "fonte original" },
  { file: "publications.csv", field: "license", meaning: "Licenca do recurso (ex.: conjunto de dados)", format: "string", obligation: "recomendado", cardinality: "0..n |", authority: "registro de origem" },
  { file: "authorships.csv", field: "publication_id", meaning: "FK da publicacao", format: "string", obligation: "obrigatorio", cardinality: "1", authority: "BrCris" },
  { file: "authorships.csv", field: "position", meaning: "Ordem de autoria/contribuicao (author_order)", format: "inteiro", obligation: "obrigatorio", cardinality: "1", authority: "BrCris" },
  { file: "authorships.csv", field: "person_id", meaning: "FK da pessoa", format: "string", obligation: "recomendado", cardinality: "0..1", authority: "BrCris" },
  { file: "authorships.csv", field: "name", meaning: "Nome de exibicao", format: "string", obligation: "obrigatorio", cardinality: "1", authority: "BrCris" },
  { file: "authorships.csv", field: "orcid", meaning: "ORCID da pessoa", format: "ORCID", obligation: "recomendado", cardinality: "0..1", authority: "ORCID; resolvivel em https://orcid.org/{id}" },
  { file: "authorships.csv", field: "lattes_id", meaning: "Identificador Lattes da pessoa", format: "string", obligation: "recomendado", cardinality: "0..1", authority: "CNPq Lattes; resolvivel em http://lattes.cnpq.br/{id}" },
  { file: "authorships.csv", field: "role", meaning: "Papel: author, advisor ou coadvisor", format: "enum", obligation: "obrigatorio", cardinality: "1", authority: "BrCris; coautor nao e papel distinto no indice" },
  { file: "authorships.csv", field: "affiliation", meaning: "Afiliacao atual da pessoa (nao temporal da publicacao)", format: "string", obligation: "recomendado", cardinality: "0..n |", authority: "indice de pessoas BrCris" },
  { file: "authorships.csv", field: "affiliation_id", meaning: "Id da instituicao de afiliacao atual", format: "string", obligation: "recomendado", cardinality: "0..n |", authority: "BrCris" },
  { file: "authorships.csv", field: "affiliation_ror", meaning: "ROR da afiliacao atual da pessoa", format: "ROR", obligation: "recomendado", cardinality: "0..n |", authority: "ROR; nao e afiliacao no momento da publicacao" },
  { file: "persons.csv", field: "person_id", meaning: "Chave primaria da pessoa", format: "string", obligation: "obrigatorio", cardinality: "1", authority: "BrCris" },
  { file: "persons.csv", field: "name", meaning: "Nome de exibicao no cadastro", format: "string", obligation: "recomendado", cardinality: "0..n |", authority: "BrCris" },
  { file: "persons.csv", field: "preferred_name", meaning: "Forma preferida de exibicao", format: "string", obligation: "recomendado", cardinality: "0..1", authority: "BrCris" },
  { file: "persons.csv", field: "name_variants", meaning: "Variantes e nomes de citacao", format: "string", obligation: "recomendado", cardinality: "0..n |", authority: "BrCris (citationName e alternateName)" },
  { file: "persons.csv", field: "orcid", meaning: "ORCID", format: "ORCID", obligation: "recomendado", cardinality: "0..1", authority: "ORCID" },
  { file: "persons.csv", field: "lattes_id", meaning: "Identificador Lattes", format: "string", obligation: "recomendado", cardinality: "0..1", authority: "CNPq Lattes" },
  { file: "persons.csv", field: "affiliation", meaning: "Afiliacao atual da pessoa", format: "string", obligation: "recomendado", cardinality: "0..n |", authority: "BrCris; nao temporal" },
  { file: "persons.csv", field: "affiliation_id", meaning: "Id da instituicao de afiliacao atual", format: "string", obligation: "recomendado", cardinality: "0..n |", authority: "BrCris" },
  { file: "persons.csv", field: "affiliation_ror", meaning: "ROR da afiliacao atual", format: "ROR", obligation: "recomendado", cardinality: "0..n |", authority: "ROR" },
];

function dictionaryRowsForFormat(
  format: "csv" | "json",
  generatedAt: string,
) {
  const ext = format === "json" ? "json" : "csv";
  return DICTIONARY_ROWS.map((row) => ({
    file: row.file.replace(/\.csv$/, `.${ext}`),
    field: row.field,
    meaning: row.meaning,
    format: row.format,
    obligation: row.obligation,
    cardinality: row.cardinality,
    authority: row.authority,
    generated_at: generatedAt,
  }));
}

export function buildDataDictionaryCsv(generatedAt: string): string {
  const header = [
    "file",
    "field",
    "meaning",
    "format",
    "obligation",
    "cardinality",
    "authority",
    "generated_at",
  ].join(csvOptions.delimiter);
  const rows = dictionaryRowsForFormat("csv", generatedAt).map((row) =>
    csvRow([
      row.file,
      row.field,
      row.meaning,
      row.format,
      row.obligation,
      row.cardinality,
      row.authority,
      row.generated_at,
    ]),
  );
  return [header, ...rows].join(csvOptions.eol) + csvOptions.eol;
}

export function buildDataDictionaryJson(generatedAt: string): string {
  return JSON.stringify(dictionaryRowsForFormat("json", generatedAt));
}

function provenanceEntries(generatedAt: string, dictionaryFile: string) {
  return [
    ["generated_at", generatedAt],
    ["source", "BrCris / IBICT"],
    ["export_profile", "epic-v13"],
    ["license", "CC BY-ND 3.0"],
    ["formats", "csv|json"],
    ["multi_value_separator", "|"],
    ["empty_value", "Celula vazia = sem valor; nao preenche placeholder"],
    [
      "pid_policy",
      `DOI, ORCID, ROR, ISSN e Lattes sao expostos quando existem no indice; autoridade e resolubilidade constam no ${dictionaryFile}`,
    ],
    [
      "not_in_index",
      "Fora do CSV por cobertura 0: handleId, capesId, bdtdId, program, researchArea, rights, eissn, conference. Tambem fora do escopo: banca, afiliacao temporal, edicao/local de evento, versoes/duplicatas, COAR, DCAT/PROV-O, JSON-LD/RDF",
    ],
  ] as const;
}

export function buildProvenanceCsv(generatedAt: string): string {
  const header = ["key", "value"].join(csvOptions.delimiter);
  const rows = provenanceEntries(generatedAt, "dictionary.csv");
  return (
    [header, ...rows.map((row) => csvRow([...row]))].join(csvOptions.eol) +
    csvOptions.eol
  );
}

export function buildProvenanceJson(generatedAt: string): string {
  return JSON.stringify(Object.fromEntries(provenanceEntries(generatedAt, "dictionary.json")));
}

