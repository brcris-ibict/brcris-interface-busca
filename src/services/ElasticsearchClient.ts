import "server-only";

import { readFileSync } from "fs";
import { resolve } from "path";
import { Client } from "es8";

function getTlsOptions() {
  const caPath = process.env.ELASTICSEARCH_CA_CERT_PATH?.trim();

  if (!caPath) return undefined;

  return {
    ca: readFileSync(resolve(process.cwd(), caPath)),
    rejectUnauthorized: true,
  };
}

export function createElasticsearchClient() {
  return new Client({
    maxRetries: 5,
    requestTimeout: 60000,
    node: process.env.HOST_ELASTIC,
    auth: {
      apiKey: process.env.API_KEY || "",
    },
    tls: getTlsOptions(),
  });
}
