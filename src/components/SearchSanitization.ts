/** biome-ignore-all lint/suspicious/noAssignInExpressions: explanation */
/** biome-ignore-all lint/suspicious/noImplicitAnyLet: explanation */
import en from "../../public/locales/en/advanced.json";
import ptBr from "../../public/locales/pt-BR/advanced.json";

export function findPropertyByValue(value: string) {
  for (const property in ptBr) {
    //@ts-expect-error
    if (ptBr[property] === value) {
      return property;
    }
  }
  for (const property in en) {
    //@ts-expect-error
    if (en[property] === value) {
      return property;
    }
  }
  return value;
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
