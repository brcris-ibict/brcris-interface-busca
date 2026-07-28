import en from "../../public/locales/en/advanced.json";
import ptBr from "../../public/locales/pt-BR/advanced.json";

export function findPropertyByValue(value: string) {
  const matches: string[] = [];

  for (const property in ptBr) {
    //@ts-expect-error
    if (ptBr[property] === value) {
      matches.push(property);
    }
  }
  for (const property in en) {
    //@ts-expect-error
    if (en[property] === value && !matches.includes(property)) {
      matches.push(property);
    }
  }

  if (matches.length === 0) return value;
  if (matches.length === 1) return matches[0];

  return matches.find((property) => property.endsWith("_text")) ?? matches[0];
}

export function untranslatedFieldsNames(fullQuery: string) {
  const regex = /\(([^:)]+):/g; // pega os nomes dos campos, palavra entre '(' e ':'.

  const names = [];
  let name;
  while ((name = regex.exec(fullQuery))) {
    names.push(name[1]);
  }

  const map = new Map();
  names.forEach((name) => {
    const untranslated = findPropertyByValue(name);
    map.set(name, untranslated);
  });

  for (const [key, value] of map) {
    fullQuery = fullQuery.replaceAll(key, value);
  }
  return fullQuery;
}
