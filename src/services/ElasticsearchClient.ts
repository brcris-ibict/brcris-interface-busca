import "server-only";

import { readFileSync } from "fs";
import { resolve } from "path";
import { Client, type ClientOptions } from "es8";
import logger from "./Logger";

let nodesLogged = false;

/**
 * HOST_ELASTIC aceita um ou mais nós separados por vírgula, espaço ou quebra
 * de linha, por exemplo:
 * "https://172.16.25.36:9200,https://172.16.25.37:9200,..."
 * Com vários nós, o cliente distribui as requisições entre eles e faz failover
 * automaticamente quando um nó fica indisponível.
 */
export function getElasticsearchNodes(): string[] {
  return (process.env.HOST_ELASTIC ?? "")
    .split(/[\s,;]+/)
    .map((node) => node.trim())
    .filter(Boolean);
}

function getTlsOptions(): ClientOptions["tls"] {
  const caPath = process.env.ELASTICSEARCH_CA_CERT_PATH?.trim();

  if (!caPath) return undefined;

  return {
    ca: readFileSync(resolve(process.cwd(), caPath)),
    rejectUnauthorized: true,
  };
}

/**
 * Usa usuário/senha (ELASTIC_USERNAME/ELASTIC_PASSWORD) quando definidos,
 * como no novo cluster de homologação; caso contrário, mantém a API key.
 */
function getAuthOptions(): ClientOptions["auth"] {
  const username = process.env.ELASTIC_USERNAME?.trim();
  const password = process.env.ELASTIC_PASSWORD;

  if (username && password) return { username, password };

  return { apiKey: process.env.API_KEY || "" };
}

export function createElasticsearchClient() {
  const nodes = getElasticsearchNodes();

  const client = new Client({
    maxRetries: 5,
    requestTimeout: 60000,
    nodes,
    auth: getAuthOptions(),
    tls: getTlsOptions(),
  });

  if (!nodesLogged) {
    logger.info(
      { hosts: nodes.map((node) => new URL(node).origin) },
      "Elasticsearch hosts configured",
    );
    nodesLogged = true;
  }

  return client;
}
