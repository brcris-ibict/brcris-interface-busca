/* eslint-disable @typescript-eslint/ban-ts-comment */
/** biome-ignore-all lint/suspicious/noImplicitAnyLet: <explanation> */
import archiver from "archiver";
import crypto from "crypto";
import { Client } from "es7";
import type { Search } from "es7/api/requestParams";
import fs from "fs";
import type { NextApiRequest, NextApiResponse } from "next";
import { createFolderIfNotExists } from "../../services/createFolderIfNotExists";
import { csvOptions, jsonToCsv } from "../../services/JsonToCsv";
import { jsonToRis } from "../../services/JsonToRis";
import logger from "../../services/Logger";
import { googleCaptchaValidation } from "./googleCaptchaValidation";
import { sendMail } from "./sendMail";

// https://www.elastic.co/guide/en/elasticsearch/client/javascript-api/7.17/scroll_examples.html

const client = new Client({
  maxRetries: 5,
  requestTimeout: 60000,
  sniffOnStart: true,
  node: process.env.HOST_ELASTIC,
  auth: {
    apiKey: process.env.API_KEY!,
  },
});

if (!process.env.FIELDS_RIS) {
  throw new Error("Environment variable FIELDS_RIS is not defined");
}
const fieldsRis = JSON.parse(process.env.FIELDS_RIS);

const proxy = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const { query, index, resultFields, totalResults, indexName, typeArq } =
      req.body;

    if (totalResults > (process.env.MAX_DOWNLOAD_PERMITED || 100000)) {
      return res
        .status(507)
        .json(
          `Downloading more than ${process.env.MAX_DOWNLOAD_PERMITED} items is not permitted`,
        );
    }

    createFolderIfNotExists(process.env.DOWNLOAD_FOLDER_PATH);
    const fileName = getFileName(index, JSON.stringify(query));
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
  query: string,
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
      writeZipFile(indexName, zipFilePath, risFilePath, typeArq);
      return zipFilePath;
    } else {
      const csvFilePath = await writeCsvFile(
        zipFilePath,
        index,
        query,
        resultFields,
      );
      writeZipFile(indexName, zipFilePath, csvFilePath, typeArq);
      logger.info(`Arquivo criado, arquivo: ${zipFilePath}`);
      return zipFilePath;
    }
  } catch (err) {
    throw err;
  }
}

async function writeCsvFile(
  zipFilePath: string,
  index: string,
  query: string,
  resultFields: string[],
) {
  const params: Search = {
    index: index,
    scroll: "30s",
    size: 1000,
    _source: resultFields,
    _source_excludes: "id",
    body: {
      query: query,
    },
  };
  let writeStream;
  try {
    const csvFilePath = zipFilePath.replace(".zip", ".csv");
    writeStream = fs.createWriteStream(csvFilePath);

    const csvHeaders = resultFields.join(csvOptions.delimiter);
    writeStream.write(csvHeaders);
    writeStream.write(csvOptions.eol);

    for await (const hit of scrollSearch(params)) {
      const data = jsonToCsv(hit._source, resultFields);
      writeStream.write(data);
      writeStream.write(csvOptions.eol);
    }
    return csvFilePath;
  } catch (err) {
    throw err;
  } finally {
    writeStream?.end();
  }
}

async function writeRisFile(
  zipFilePath: string,
  index: string,
  query: string,
  resultFields: string[],
) {
  const params: Search = {
    index: index,
    scroll: "30s",
    size: 1000,
    _source: resultFields,
    _source_excludes: "id",
    body: {
      query: query,
    },
  };
  let writeStream;
  try {
    const risFilePath = zipFilePath.replace(".zip", ".ris");
    writeStream = fs.createWriteStream(risFilePath);

    for await (const hit of scrollSearch(params)) {
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
  indexName: string,
  zipFilePath: string,
  csvFilePath: string,
  typeArq: string,
) {
  logger.info(`Iniciando writeZipFile, arquivo: ${zipFilePath}`);
  const fileName = `${indexName}-${new Date().toISOString()}.${typeArq}`;

  // Crie um objeto de arquivo zip
  const output = fs.createWriteStream(zipFilePath);
  const archive = archiver("zip");
  // Manipuladores de eventos para o objeto de arquivo zip
  output.on("close", () => {
    // apaga arquivo .csv
    fs.unlinkSync(csvFilePath);
  });
  archive.on("error", (err) => {
    throw err;
  });
  // Pipe do arquivo de saída
  archive.pipe(output);
  // Adiciona o arquivo CSV ao arquivo zip com o nome que desejar
  archive.file(csvFilePath, { name: fileName });
  // Finaliza o processo de arquivamento
  archive.finalize();
  logger.info(`Finalizando writeZipFile, arquivo: ${zipFilePath}`);
}

// Scroll utility
async function* scrollSearch(params: Search) {
  let response = await client.search(params);

  while (true) {
    const sourceHits = response.body.hits.hits;
    if (sourceHits.length === 0) {
      break;
    }

    for (const hit of sourceHits) {
      yield hit;
    }

    if (!response.body._scroll_id) {
      break;
    }

    response = await client.scroll({
      scroll_id: response.body._scroll_id,
      scroll: params.scroll,
    });
  }
}

function getFileName(index: string, query: string) {
  const string = index + query;
  const hash = crypto.createHash("sha256").update(string).digest("hex");
  return hash;
}

async function backgroundExportation(
  zipFilePath: string,
  index: string,
  query: string,
  email: string,
  indexName: string,
  resultFields: string[],
  typeArq: string,
) {
  logger.info(`Exportação em background,  arquivo: ${zipFilePath}`);
  await writeFile(zipFilePath, index, query, indexName, resultFields, typeArq);
  console.log("enviando email");
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
  console.log("email enviado");
}

export default proxy;
