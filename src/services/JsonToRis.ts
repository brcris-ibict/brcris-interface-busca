interface risFormat {
  delimiter: string;
  endLine: string;
}
const risFormatAux: risFormat = {
  delimiter: "  -  ",
  endLine: "\n",
};
export function jsonToRis(jsonData: object, fieldsRis: object): string {
  let ris = "";
  for (const [risKey, risValues] of Object.entries(fieldsRis)) {
    for (const [jsonKey, jsonValues] of Object.entries(jsonData)) {
      if (jsonKey === risValues) {
        if (typeof jsonValues[0] === "object") {
          for (let cont = 0; cont < jsonValues.length; ++cont) {
            if (risKey === "AU") {
              ris +=
                risKey +
                risFormatAux.delimiter +
                jsonValues[cont].name +
                risFormatAux.endLine;
            } else {
              ris += risKey + risFormatAux.delimiter;
              ris += jsonValues[0].name
                ? jsonValues[0].name
                : jsonValues[0].title + risFormatAux.endLine;
              break;
            }
          }
        } else {
          if (jsonValues === "") {
            ris += risKey + risFormatAux.delimiter + "-";
          } else {
            ris += risKey + risFormatAux.delimiter;
            ris += jsonValues;
            ris += risFormatAux.endLine;
          }
        }
      }
    }
  }
  ris += "ER  -";
  ris += risFormatAux.endLine;
  return ris;
}
