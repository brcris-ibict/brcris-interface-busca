// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import fs from "fs";
import type { NextApiRequest, NextApiResponse } from "next";
import logger from "../../services/Logger";
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const zipFilePath: string =
    (req.query.fileName as string) || (req.query.filename as string);
  logger.info("Download zipFilePath: ", zipFilePath);

  // Ler o conteúdo do arquivo ZIP
  const zipData = await fs.promises.readFile(zipFilePath);

  const zipFileName = `${req.query.indexName || "brcris"}-${new Date().toISOString()}.zip`;

  // Definir headers da resposta
  res.setHeader("Content-Type", "application/zip");
  res.setHeader("Content-Length", zipData.length);
  res.setHeader("Content-Disposition", `attachment; filename="${zipFileName}"`);

  // Enviar o arquivo ZIP como resposta
  res.send(zipData);
}
