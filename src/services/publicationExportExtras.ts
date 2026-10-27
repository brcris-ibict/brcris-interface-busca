import { csvOptions, escapeCsvCell } from "./JsonToCsv";
import type {
  AuthorshipRecord,
  PublicationJsonRecord,
  PublicationRecord,
} from "./publicationCsvProfile";
import { EXPORT_PROFILE_ID } from "./publicationCsvProfile";

export type DuplicateCandidate = {
  publication_id: string;
  match: "title" | "doi";
  key: string;
  group_size: number;
};

export type QualityMetric = {
  metric: string;
  value: string;
  meaning: string;
};

export const PUBLICATION_JSONLD_CONTEXT = {
  schema: "https://schema.org/",
  dct: "http://purl.org/dc/terms/",
  dcat: "http://www.w3.org/ns/dcat#",
  foaf: "http://xmlns.com/foaf/0.1/",
};

function ratio(part: number, total: number): string {
  return `${part}/${total}`;
}

function csvLine(values: Array<string | number>): string {
  return values
    .map((value) => escapeCsvCell(String(value ?? "")))
    .join(csvOptions.delimiter);
}

export function normalizeDuplicateTitle(title: string): string {
  return title
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function normalizeDoi(doi: string): string {
  return doi
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\/(dx\.)?doi\.org\//, "");
}

function remember(groups: Map<string, Set<string>>, key: string, id: string) {
  if (!key || !id) return;
  const current = groups.get(key) || new Set<string>();
  current.add(id);
  groups.set(key, current);
}

function candidateRows(
  groups: Map<string, Set<string>>,
  match: DuplicateCandidate["match"],
): DuplicateCandidate[] {
  const rows: DuplicateCandidate[] = [];
  for (const [key, ids] of groups) {
    if (ids.size < 2) continue;
    for (const publication_id of ids) {
      rows.push({
        publication_id,
        match,
        key,
        group_size: ids.size,
      });
    }
  }
  return rows.sort((a, b) =>
    `${a.match}|${a.key}|${a.publication_id}`.localeCompare(
      `${b.match}|${b.key}|${b.publication_id}`,
    ),
  );
}

export function createQualityAccumulator() {
  const titles = new Map<string, Set<string>>();
  const dois = new Map<string, Set<string>>();
  const publicationsWithRor = new Set<string>();
  let publications = 0;
  let withId = 0;
  let withTitle = 0;
  let withDate = 0;
  let withType = 0;
  let withDoi = 0;
  let withIssn = 0;
  let authorships = 0;
  let authors = 0;
  let authorsWithOrcid = 0;

  return {
    addPublication(record: PublicationRecord) {
      publications += 1;
      if (record.id) withId += 1;
      if (record.title) withTitle += 1;
      if (record.publicationDate) withDate += 1;
      if (record.type) withType += 1;
      if (record.doi) withDoi += 1;
      if (record.issn) withIssn += 1;
      if (record.titlingOrgUnit_ror || record.sponsorOrgUnit_ror) {
        publicationsWithRor.add(record.id);
      }
      remember(titles, normalizeDuplicateTitle(record.title), record.id);
      for (const doi of record.doi.split("|")) {
        remember(dois, normalizeDoi(doi), record.id);
      }
    },
    addAuthorship(row: AuthorshipRecord) {
      authorships += 1;
      if (row.role === "author") {
        authors += 1;
        if (row.orcid) authorsWithOrcid += 1;
      }
      if (row.affiliation_ror) publicationsWithRor.add(row.publication_id);
    },
    duplicates(): DuplicateCandidate[] {
      return [
        ...candidateRows(titles, "title"),
        ...candidateRows(dois, "doi"),
      ];
    },
    metrics(): QualityMetric[] {
      const titleRows = candidateRows(titles, "title");
      const doiRows = candidateRows(dois, "doi");
      const titleGroups = new Set(titleRows.map((row) => row.key)).size;
      const doiGroups = new Set(doiRows.map((row) => row.key)).size;
      const titleRecords = new Set(titleRows.map((row) => row.publication_id))
        .size;
      return [
        {
          metric: "publication_count",
          value: String(publications),
          meaning: "Publicacoes no arquivo",
        },
        {
          metric: "authorship_count",
          value: String(authorships),
          meaning: "Linhas de autoria, orientacao e coorientacao",
        },
        {
          metric: "completeness_id",
          value: ratio(withId, publications),
          meaning: "Publicacoes com id",
        },
        {
          metric: "completeness_title",
          value: ratio(withTitle, publications),
          meaning: "Publicacoes com titulo",
        },
        {
          metric: "completeness_publicationDate",
          value: ratio(withDate, publications),
          meaning: "Publicacoes com ano",
        },
        {
          metric: "completeness_type",
          value: ratio(withType, publications),
          meaning: "Publicacoes com tipo",
        },
        {
          metric: "doi_coverage",
          value: ratio(withDoi, publications),
          meaning: "Publicacoes com DOI",
        },
        {
          metric: "issn_coverage",
          value: ratio(withIssn, publications),
          meaning: "Publicacoes com ISSN",
        },
        {
          metric: "orcid_coverage",
          value: ratio(authorsWithOrcid, authors),
          meaning: "Autorias com ORCID",
        },
        {
          metric: "ror_coverage",
          value: ratio(publicationsWithRor.size, publications),
          meaning: "Publicacoes com algum ROR de titulacao, patrocinio ou afiliacao",
        },
        {
          metric: "duplicate_title_groups",
          value: String(titleGroups),
          meaning: "Grupos com o mesmo titulo normalizado",
        },
        {
          metric: "duplicate_title_records",
          value: String(titleRecords),
          meaning: "Publicacoes que entram em algum grupo de titulo",
        },
        {
          metric: "duplicate_doi_groups",
          value: String(doiGroups),
          meaning: "Grupos com o mesmo DOI",
        },
      ];
    },
  };
}

export function buildDuplicatesCsv(rows: DuplicateCandidate[]): string {
  const header = ["publication_id", "match", "key", "group_size"].join(
    csvOptions.delimiter,
  );
  const lines = rows.map((row) =>
    csvLine([row.publication_id, row.match, row.key, row.group_size]),
  );
  return [header, ...lines].join(csvOptions.eol) + csvOptions.eol;
}

export function buildDuplicatesJson(rows: DuplicateCandidate[]): string {
  return JSON.stringify(rows);
}

export function buildQualityCsv(metrics: QualityMetric[]): string {
  const header = ["metric", "value", "meaning"].join(csvOptions.delimiter);
  const lines = metrics.map((row) =>
    csvLine([row.metric, row.value, row.meaning]),
  );
  return [header, ...lines].join(csvOptions.eol) + csvOptions.eol;
}

export function buildQualityJson(metrics: QualityMetric[]): string {
  return JSON.stringify(metrics);
}

function withoutEmpty(value: Record<string, unknown>): Record<string, unknown> {
  return JSON.parse(JSON.stringify(value)) as Record<string, unknown>;
}

export function publicationJsonLdNode(
  record: PublicationJsonRecord,
  authorships: AuthorshipRecord[],
): Record<string, unknown> {
  const authors = authorships
    .filter((row) => row.role === "author")
    .map((row) =>
      withoutEmpty({
        "@id": row.person_id ? `urn:brcris:person:${row.person_id}` : undefined,
        "@type": "schema:Person",
        "schema:name": row.name,
        "schema:identifier": row.orcid
          ? `https://orcid.org/${row.orcid}`
          : undefined,
      }),
    );
  const contributors = authorships
    .filter((row) => row.role === "advisor" || row.role === "coadvisor")
    .map((row) =>
      withoutEmpty({
        "@id": row.person_id ? `urn:brcris:person:${row.person_id}` : undefined,
        "@type": "schema:Person",
        "schema:name": row.name,
        "schema:roleName": row.role,
      }),
    );
  const identifiers = [
    record.doi
      ? {
          "@type": "schema:PropertyValue",
          "schema:propertyID": "doi",
          "schema:value": record.doi,
        }
      : undefined,
    record.brcrisId
      ? {
          "@type": "schema:PropertyValue",
          "schema:propertyID": "brcrisId",
          "schema:value": record.brcrisId,
        }
      : undefined,
    record.issn
      ? {
          "@type": "schema:PropertyValue",
          "schema:propertyID": "issn",
          "schema:value": record.issn,
        }
      : undefined,
  ].filter(Boolean);

  return withoutEmpty({
    "@id": `urn:brcris:publication:${record.id}`,
    "@type": "schema:CreativeWork",
    "dct:title": record.title || undefined,
    "dct:date": record.publicationDate.length ? record.publicationDate : undefined,
    "dct:type": record.type_coar.filter(Boolean).length
      ? record.type_coar.filter(Boolean)
      : undefined,
    "schema:additionalType": record.type.length ? record.type : undefined,
    "schema:identifier": identifiers.length ? identifiers : undefined,
    "schema:url": record.resourceUrl || undefined,
    "schema:author": authors.length ? authors : undefined,
    "schema:contributor": contributors.length ? contributors : undefined,
    "schema:isPartOf": record.journal
      ? withoutEmpty({
          "@id": record.journal_id
            ? `urn:brcris:journal:${record.journal_id}`
            : undefined,
          "@type": "schema:Periodical",
          "schema:name": record.journal,
          "schema:issn": record.issn || undefined,
        })
      : undefined,
  });
}

export function buildDcatJsonLd(generatedAt: string): string {
  return JSON.stringify({
    "@context": PUBLICATION_JSONLD_CONTEXT,
    "@type": "dcat:Dataset",
    "@id": "urn:brcris:dataset:publications",
    "dct:title": "Exportacao de producao cientifica do BrCris",
    "dct:issued": generatedAt,
    "dct:license": "https://creativecommons.org/licenses/by-nd/3.0/",
    "dct:publisher": {
      "@type": "foaf:Organization",
      "foaf:name": "IBICT",
    },
    "dcat:version": EXPORT_PROFILE_ID,
    "dcat:distribution": [
      "publications.csv",
      "publications.json",
      "authorships.csv",
      "persons.csv",
      "dictionary.csv",
      "provenance.csv",
      "duplicates.csv",
      "quality.csv",
      "publications.jsonld",
    ].map((title) => ({
      "@type": "dcat:Distribution",
      "dct:title": title,
    })),
  });
}
