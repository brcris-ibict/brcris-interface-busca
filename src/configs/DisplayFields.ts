export type DisplayField = {
  key: string;
  label: string;
  default: boolean;
  fixed?: boolean;
};

export const DISPLAY_FIELDS_BY_ENTITY: Record<string, DisplayField[]> = {
  publications: [
    { key: "title", label: "Title", default: true, fixed: true },
    { key: "author", label: "Author", default: true },
    { key: "journal", label: "Journal", default: true },
    { key: "conference", label: "Conference", default: true },
    { key: "sponsorOrgUnit", label: "Organization", default: false },
    { key: "publicationDate", label: "Publication date", default: true },
    { key: "type", label: "Type", default: false },
  ],
  patents: [
    { key: "inventor", label: "Inventor(s)", default: true },
    { key: "kindCode", label: "Kind Code", default: true },
    { key: "countryCode", label: "Country code", default: true },
    { key: "depositDate", label: "Deposit date", default: true },
    { key: "publicationDate", label: "Publication date", default: true },
  ],
  people: [
    { key: "name", label: "Name", default: true, fixed: true },
    { key: "orcid", label: "Orcid", default: false },
    { key: "lattesId", label: "Lattes", default: false },
    { key: "memberOf", label: "Research groups", default: false },
    { key: "affiliation", label: "Affiliation", default: true },
  ],
  journals: [
    { key: "publisher", label: "Publisher", default: true },
    { key: "researchArea", label: "Research areas", default: true },
    { key: "issn_l", label: "ISSN-L", default: false },
    { key: "countryCode", label: "Country code", default: false },
    { key: "isOA", label: "Is open access", default: false },
  ],
  organizations: [
    { key: "name", label: "Name", default: true, fixed: true },
    { key: "city", label: "City", default: true },
    { key: "state", label: "State", default: true },
    { key: "country", label: "Country", default: true },
  ],
  programs: [
    { key: "orgUnit", label: "Organization", default: true },
    { key: "researchArea", label: "Research areas", default: true },
  ],
  courses: [
    { key: "name", label: "Name", default: true, fixed: true },
    { key: "degree", label: "Degree", default: true },
    { key: "type", label: "Type", default: true },
    { key: "startDate", label: "Start date", default: false },
    { key: "endDate", label: "End date", default: false },
    { key: "program", label: "Program", default: false },
    { key: "orgUnit", label: "Organizational Unit", default: true },
  ],
  "research-groups": [
    { key: "name", label: "Name", default: true, fixed: true },
    { key: "leaderResearcher", label: "Leader", default: true },
    { key: "leaderOrgUnit", label: "Organization", default: true },
    { key: "researchLine", label: "Research line", default: true },
  ],
  software: [
    { key: "creator", label: "Creator(s)", default: true },
    { key: "description", label: "Description", default: true },
    { key: "releaseYear", label: "Release year", default: true },
  ],
};

export const getDisplayFieldsConfig = (entityKey: string | undefined) => {
  if (!entityKey) return undefined;
  return DISPLAY_FIELDS_BY_ENTITY[entityKey];
};

export const getDefaultDisplayFields = (entityKey: string | undefined) => {
  const config = getDisplayFieldsConfig(entityKey);
  if (!config) return [] as string[];
  return config.filter((field) => field.default).map((field) => field.key);
};
