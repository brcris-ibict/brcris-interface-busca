import type { estypes } from "es8";

const MULTI_TYPE_EXCLUSION: estypes.QueryDslQueryContainer = {
  script: {
    script: {
      source: "doc.containsKey('type') && doc['type'].size() > 1",
    },
  },
};

export function excludePublicationsWithMultipleTypes(
  query: estypes.QueryDslQueryContainer | undefined,
): estypes.QueryDslQueryContainer {
  if (!query || Object.keys(query).length === 0) {
    return { bool: { must_not: [MULTI_TYPE_EXCLUSION] } };
  }

  if (query.bool) {
    const mustNot = query.bool.must_not;
    const mustNotList = mustNot
      ? Array.isArray(mustNot)
        ? mustNot
        : [mustNot]
      : [];

    return {
      bool: {
        ...query.bool,
        must_not: [...mustNotList, MULTI_TYPE_EXCLUSION],
      },
    };
  }

  return {
    bool: {
      must: [query],
      must_not: [MULTI_TYPE_EXCLUSION],
    },
  };
}

export function isPublicationIndex(index: string | undefined): boolean {
  return Boolean(index && index === process.env.INDEX_PUBLICATION);
}
