import archiver from "archiver";
import crypto from "crypto";
import type { estypes } from "es8";
import fs from "fs";
import type { NextApiRequest, NextApiResponse } from "next";
import { createElasticsearchClient } from "../../services/ElasticsearchClient";
import { createFolderIfNotExists } from "../../services/createFolderIfNotExists";
import {
  applyJournalIdentifiers,
  collectJournalIdsFromHits,
  fetchJournalIdentifiersById,
} from "../../services/enrichPublicationIssn";
import {
  applyAffiliationRor,
  collectAffiliationIds,
  collectPersonIdsFromHits,
  fetchPersonCsvFieldsById,
  type PersonCsvFields,
} from "../../services/enrichPublicationOrcid";
import { fetchOrgRorById } from "../../services/enrichPublicationOrg";
import {
  csvOptions,
  dedupePublicationAuthors,
  jsonToCsv,
} from "../../services/JsonToCsv";
import { jsonToRis } from "../../services/JsonToRis";
import {
  AUTHORSHIP_CSV_HEADERS,
  PERSON_CSV_HEADERS,
  PUBLICATION_CSV_HEADERS,
  PUBLICATION_SOURCE_FIELDS,
  buildAuthorshipCsvRows,
  buildAuthorshipRecords,
  buildDataDictionaryCsv,
  buildDataDictionaryJson,
  buildPersonCsvRow,
  buildPersonRecord,
  buildProvenanceCsv,
  buildProvenanceJson,
  buildPublicationCsvRow,
  buildPublicationRecord,
  collectPublicationOrgIds,
  csvHeaderLine,
  upsertPersonsFromSource,
} from "../../services/publicationCsvProfile";
import logger from "../../services/Logger";
import { googleCaptchaValidation } from "./googleCaptchaValidation";
import { sendMail } from "./sendMail";

// https://www.elastic.co/guide/en/elasticsearch/client/javascript-api/8.19/scroll_examples.html

const client = createElasticsearchClient();

if (!process.env.FIELDS_RIS) {
  throw new Error("Environment variable FIELDS_RIS is not defined");
}
const fieldsRis = JSON.parse(process.env.FIELDS_RIS);

const proxy = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const {
      query: rawQuery,
      index,
      resultFields,
      totalResults,
      indexName,
      typeArq,
    } = req.body;
    const query = rawQuery;

    if (totalResults > (process.env.MAX_DOWNLOAD_PERMITED || 100000)) {
      return res
        .status(507)
        .json(
          `Downloading more than ${process.env.MAX_DOWNLOAD_PERMITED} items is not permitted`,
        );
    }

    createFolderIfNotExists(process.env.DOWNLOAD_FOLDER_PATH);
    const fileName = getFileName(
      index,
      JSON.stringify({
        query,
        resultFields,
        typeArq,
        includeId: true,
        csvProfile: "epic-v13",
      }),
    );
    const zipFilePath = `${process.env.DOWNLOAD_FOLDER_PATH}/${typeArq}${fileName}.zip`;
    logger.info(
      `Iniciando exportação, arquivo: ${zipFilePath}, index: ${index}, query: ${JSON.stringify(query)}`,
    );
    if (fs.existsSync(zipFilePath)) {
      logger.info(`Arquivo já existe: ${zipFilePath}`);
      return res.json({ file: zipFilePath });
    }
    if (totalResults > 1000) {
      const { email, captcha } = req.body;
      const response = await googleCaptchaValidation(captcha);
      const captchaValidation = await response.json();
      // @ts-expect-error
      if (captchaValidation.success) {
        backgroundExportation(
          zipFilePath,
          index,
          query,
          email,
          indexName,
          resultFields,
          typeArq,
        );
        return res.json({});
      } else {
        return res.status(400).json(captchaValidation);
      }
    }
    await writeFile(
      zipFilePath,
      index,
      query,
      indexName,
      resultFields,
      typeArq,
    );
    res.json({ file: zipFilePath });
  } catch (err) {
    logger.error(err);
    res.status(400).json({ error: err.message });
  }
};

async function writeFile(
  zipFilePath: string,
  index: string,
  query: estypes.QueryDslQueryContainer,
  indexName: string,
  resultFields: string[],
  typeArq: string,
) {
  try {
    logger.info(`Iniciando writeFile,  arquivo: ${zipFilePath}`);
    if (typeArq === "ris") {
      const risFilePath = await writeRisFile(
        zipFilePath,
        index,
        query,
        resultFields,
      );
      logger.info(`Arquivo do tipo ris criado`);
      writeZipFile(zipFilePath, [
        {
          path: risFilePath,
          name: `${indexName}-${new Date().toISOString()}.ris`,
        },
      ]);
      return zipFilePath;
    }
    if (typeArq === "json") {
      const jsonEntries = await writeJsonFile(
        zipFilePath,
        index,
        query,
        resultFields,
        indexName,
      );
      writeZipFile(zipFilePath, jsonEntries);
      logger.info(`Arquivo do tipo json criado, arquivo: ${zipFilePath}`);
      return zipFilePath;
    }
    const csvEntries = await writeCsvFile(
      zipFilePath,
      index,
      query,
      resultFields,
      indexName,
    );
    writeZipFile(zipFilePath, csvEntries);
    logger.info(`Arquivo criado, arquivo: ${zipFilePath}`);
    return zipFilePath;
  } catch (err) {
    throw err;
  }
}

async function writeCsvFile(
  zipFilePath: string,
  index: string,
  query: estypes.QueryDslQueryContainer,
  resultFields: string[],
  indexName: string,
): Promise<Array<{ path: string; name: string }>> {
  const isPublicationExport = index === process.env.INDEX_PUBLICATION;
  if (isPublicationExport) {
    return writePublicationExportFiles(zipFilePath, index, query, "csv");
  }

  const params: estypes.SearchRequest = {
    index: index,
    scroll: "30s",
    size: 1000,
    _source: Array.from(new Set([...resultFields, "id"])),
    query,
  };
  const csvFilePath = zipFilePath.replace(".zip", ".csv");
  const writeStream = fs.createWriteStream(csvFilePath);
  try {
    writeStream.write(resultFields.join(csvOptions.delimiter));
    writeStream.write(csvOptions.eol);

    for await (const hit of scrollSearch(params)) {
      const source = hit._source || {};
      if (!hasRecordId(source) && hit._id) {
        source.id = hit._id;
      }
      writeStream.write(jsonToCsv(source, resultFields));
      writeStream.write(csvOptions.eol);
    }
    await endWriteStream(writeStream);
    return [
      {
        path: csvFilePath,
        name: `${indexName}-${new Date().toISOString()}.csv`,
      },
    ];
  } catch (err) {
    writeStream.destroy();
    throw err;
  }
}

async function writeJsonFile(
  zipFilePath: string,
  index: string,
  query: estypes.QueryDslQueryContainer,
  resultFields: string[],
  indexName: string,
): Promise<Array<{ path: string; name: string }>> {
  const isPublicationExport = index === process.env.INDEX_PUBLICATION;
  if (isPublicationExport) {
    return writePublicationExportFiles(zipFilePath, index, query, "json");
  }

  const params: estypes.SearchRequest = {
    index: index,
    scroll: "30s",
    size: 1000,
    _source: Array.from(new Set([...resultFields, "id"])),
    query,
  };
  const jsonFilePath = zipFilePath.replace(".zip", ".json");
  const writeStream = fs.createWriteStream(jsonFilePath);
  try {
    writeStream.write("[");
    let first = true;
    for await (const hit of scrollSearch(params)) {
      const source = hit._source || {};
      if (!hasRecordId(source) && hit._id) {
        source.id = hit._id;
      }
      if (!first) writeStream.write(",");
      first = false;
      writeStream.write(JSON.stringify(source));
    }
    writeStream.write("]");
    await endWriteStream(writeStream);
    return [
      {
        path: jsonFilePath,
        name: `${indexName}-${new Date().toISOString()}.json`,
      },
    ];
  } catch (err) {
    writeStream.destroy();
    throw err;
  }
}

async function writePublicationExportFiles(
  zipFilePath: string,
  index: string,
  query: estypes.QueryDslQueryContainer,
  format: "csv" | "json",
): Promise<Array<{ path: string; name: string }>> {
  const extension = format === "json" ? "json" : "csv";
  const publicationsPath = zipFilePath.replace(
    ".zip",
    `-publications.${extension}`,
  );
  const authorshipsPath = zipFilePath.replace(
    ".zip",
    `-authorships.${extension}`,
  );
  const personsPath = zipFilePath.replace(".zip", `-persons.${extension}`);
  const publicationsStream = fs.createWriteStream(publicationsPath);
  const authorshipsStream = fs.createWriteStream(authorshipsPath);
  const persons: Map<string, PersonCsvFields> = new Map();
  let firstPublication = true;
  let firstAuthorship = true;

  if (format === "csv") {
    publicationsStream.write(csvHeaderLine(PUBLICATION_CSV_HEADERS));
    publicationsStream.write(csvOptions.eol);
    authorshipsStream.write(csvHeaderLine(AUTHORSHIP_CSV_HEADERS));
    authorshipsStream.write(csvOptions.eol);
  } else {
    publicationsStream.write("[");
    authorshipsStream.write("[");
  }

  const params: estypes.SearchRequest = {
    index: index,
    scroll: "30s",
    size: 1000,
    _source: PUBLICATION_SOURCE_FIELDS,
    query,
  };

  const batch: Array<{ _id?: string; _source?: Record<string, unknown> }> = [];
  const flush = async () => {
    if (batch.length === 0) return;
    for (const hit of batch) {
      if (hit._source) dedupePublicationAuthors(hit._source);
    }

    const journalIds = collectJournalIdsFromHits(batch);
    const identifiersByJournalId = await fetchJournalIdentifiersById(
      client,
      process.env.INDEX_JOURNAL || "",
      journalIds,
    );
    const personIds = collectPersonIdsFromHits(batch);
    const peopleById = await fetchPersonCsvFieldsById(
      client,
      process.env.INDEX_PERSON || "",
      personIds,
    );
    const orgIds = [
      ...batch.flatMap((hit) => collectPublicationOrgIds(hit._source || {})),
      ...collectAffiliationIds(peopleById),
    ];
    const rorByOrgId = await fetchOrgRorById(
      client,
      process.env.INDEX_ORGUNIT || "",
      orgIds,
    );
    applyAffiliationRor(peopleById, rorByOrgId);

    for (const hit of batch) {
      const source = hit._source || {};
      if (!hasRecordId(source) && hit._id) {
        source.id = hit._id;
      }
      applyJournalIdentifiers(source, identifiersByJournalId);
      upsertPersonsFromSource(source, peopleById, persons);
      if (format === "json") {
        if (!firstPublication) publicationsStream.write(",");
        firstPublication = false;
        publicationsStream.write(
          JSON.stringify(buildPublicationRecord(source, rorByOrgId, hit._id)),
        );
        for (const row of buildAuthorshipRecords(source, peopleById, hit._id)) {
          if (!firstAuthorship) authorshipsStream.write(",");
          firstAuthorship = false;
          authorshipsStream.write(JSON.stringify(row));
        }
      } else {
        publicationsStream.write(
          buildPublicationCsvRow(source, rorByOrgId, hit._id),
        );
        publicationsStream.write(csvOptions.eol);
        for (const row of buildAuthorshipCsvRows(source, peopleById, hit._id)) {
          authorshipsStream.write(row);
          authorshipsStream.write(csvOptions.eol);
        }
      }
    }
    batch.length = 0;
  };

  try {
    for await (const hit of scrollSearch(params)) {
      batch.push(hit);
      if (batch.length >= 1000) {
        await flush();
      }
    }
    await flush();
    if (format === "json") {
      publicationsStream.write("]");
      authorshipsStream.write("]");
    }
    await endWriteStream(publicationsStream);
    await endWriteStream(authorshipsStream);

    const personsStream = fs.createWriteStream(personsPath);
    if (format === "json") {
      personsStream.write("[");
      let firstPerson = true;
      for (const person of persons.values()) {
        if (!firstPerson) personsStream.write(",");
        firstPerson = false;
        personsStream.write(JSON.stringify(buildPersonRecord(person)));
      }
      personsStream.write("]");
    } else {
      personsStream.write(csvHeaderLine(PERSON_CSV_HEADERS));
      personsStream.write(csvOptions.eol);
      for (const person of persons.values()) {
        personsStream.write(buildPersonCsvRow(person));
        personsStream.write(csvOptions.eol);
      }
    }
    await endWriteStream(personsStream);

    const dictionaryPath = zipFilePath.replace(
      ".zip",
      `-dictionary.${extension}`,
    );
    const provenancePath = zipFilePath.replace(
      ".zip",
      `-provenance.${extension}`,
    );
    const generatedAt = new Date().toISOString();
    fs.writeFileSync(
      dictionaryPath,
      format === "json"
        ? buildDataDictionaryJson(generatedAt)
        : buildDataDictionaryCsv(generatedAt),
      "utf8",
    );
    fs.writeFileSync(
      provenancePath,
      format === "json"
        ? buildProvenanceJson(generatedAt)
        : buildProvenanceCsv(generatedAt),
      "utf8",
    );

    return [
      { path: publicationsPath, name: `publications.${extension}` },
      { path: authorshipsPath, name: `authorships.${extension}` },
      { path: personsPath, name: `persons.${extension}` },
      { path: dictionaryPath, name: `dictionary.${extension}` },
      { path: provenancePath, name: `provenance.${extension}` },
    ];
  } catch (err) {
    publicationsStream.destroy();
    authorshipsStream.destroy();
    throw err;
  }
}

async function writeRisFile(
  zipFilePath: string,
  index: string,
  query: estypes.QueryDslQueryContainer,
  resultFields: string[],
) {
  const params: estypes.SearchRequest = {
    index: index,
    scroll: "30s",
    size: 1000,
    _source: resultFields,
    query,
  };
  let writeStream;
  try {
    const risFilePath = zipFilePath.replace(".zip", ".ris");
    writeStream = fs.createWriteStream(risFilePath);

    for await (const hit of scrollSearch(params)) {
      if (!hit._source) continue;
      const data = jsonToRis(hit._source, fieldsRis);
      writeStream.write(data);
    }
    return risFilePath;
  } catch (err) {
    throw err;
  } finally {
    writeStream?.end();
  }
}

function writeZipFile(
  zipFilePath: string,
  entries: Array<{ path: string; name: string }>,
) {
  logger.info(`Iniciando writeZipFile, arquivo: ${zipFilePath}`);
  const output = fs.createWriteStream(zipFilePath);
  const archive = archiver("zip");
  output.on("close", () => {
    for (const entry of entries) {
      fs.unlinkSync(entry.path);
    }
  });
  archive.on("error", (err) => {
    throw err;
  });
  archive.pipe(output);
  for (const entry of entries) {
    archive.file(entry.path, { name: entry.name });
  }
  archive.finalize();
  logger.info(`Finalizando writeZipFile, arquivo: ${zipFilePath}`);
}

function endWriteStream(stream: fs.WriteStream): Promise<void> {
  return new Promise((resolve, reject) => {
    stream.on("finish", resolve);
    stream.on("error", reject);
    stream.end();
  });
}

async function* scrollSearch(params: estypes.SearchRequest) {
  let response = await client.search<Record<string, unknown>>(params);

  while (true) {
    const sourceHits = response.hits.hits;
    if (sourceHits.length === 0) {
      break;
    }

    for (const hit of sourceHits) {
      yield hit;
    }

    if (!response._scroll_id) {
      break;
    }

    response = await client.scroll<Record<string, unknown>>({
      scroll_id: response._scroll_id,
      scroll: params.scroll,
    });
  }
}

function hasRecordId(source: Record<string, unknown>): boolean {
  const value = source.id;
  if (value == null || value === "") return false;
  if (Array.isArray(value)) return value.some((item) => Boolean(item));
  return true;
}

function getFileName(index: string, query: string) {
  const string = index + query;
  const hash = crypto.createHash("sha256").update(string).digest("hex");
  return hash;
}

async function backgroundExportation(
  zipFilePath: string,
  index: string,
  query: estypes.QueryDslQueryContainer,
  email: string,
  indexName: string,
  resultFields: string[],
  typeArq: string,
) {
  logger.info(`Exportação em background,  arquivo: ${zipFilePath}`);
  await writeFile(zipFilePath, index, query, indexName, resultFields, typeArq);
  const recipient = email;
  const subject = `Download do arquivo`;
  const text = ``;
  const link = `${process.env.BRCRIS_HOST_BASE}/api/download?fileName=${zipFilePath}&indexName=${indexName}`;
  const html = `<p>Prezado usuário,</p>
  <p>Seu arquivo está pronto e pode ser baixado através do link <a href="${link}">${link}</a></p>
  <p>O arquivo ficará disponível para download por 24 horas.</p>
  <p>Atenciosamente, equipe BrCris.</p>`;
  logger.info(`Enviando email em background,  arquivo: ${zipFilePath}`);
  await sendMail({ recipient, subject, text, html });
  logger.info("Email enviado.");
}

export default proxy;
