import { IncomingForm } from "formidable";
import fs from "fs";
import type { NextApiRequest, NextApiResponse } from "next";

import { googleCaptchaValidation } from "./googleCaptchaValidation";
import { sendMail } from "./sendMail";

type CaptchaValidation = {
  success: boolean;
};

export const config = {
  api: {
    bodyParser: false,
  },
};

const parseJsonBody = async (req: NextApiRequest) =>
  new Promise<any>((resolve, reject) => {
    let body = "";

    req.on("data", (chunk) => {
      body += chunk;
    });

    req.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (error) {
        reject(error);
      }
    });

    req.on("error", reject);
  });

const parseMultipartBody = async (req: NextApiRequest) =>
  new Promise<{ fields: any; files: any }>((resolve, reject) => {
    const form = new IncomingForm({
      multiples: false,
      keepExtensions: true,
    });

    form.parse(req, (err, fields, files) => {
      if (err) {
        return reject(err);
      }

      resolve({ fields, files });
    });
  });

const proxy = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const contentType = String(req.headers["content-type"] || "");
    const isJson = contentType.includes("application/json");

    const { fields, files } = isJson
      ? { fields: await parseJsonBody(req), files: {} }
      : await parseMultipartBody(req);

    const url = Array.isArray(fields.url) ? fields.url[0] : fields.url;
    const name = Array.isArray(fields.name) ? fields.name[0] : fields.name;
    const email = Array.isArray(fields.email) ? fields.email[0] : fields.email;
    const description = Array.isArray(fields.description)
      ? fields.description[0]
      : fields.description ||
        (Array.isArray(fields.message) ? fields.message[0] : fields.message);
    const captcha = Array.isArray(fields.captcha)
      ? fields.captcha[0]
      : fields.captcha;
    const type = Array.isArray(fields.type)
      ? fields.type[0]
      : fields.type || "contact";

    if (!name || !email || !captcha) {
      return res.status(400).json({
        message: "Campos obrigatórios não preenchidos",
      });
    }

    const response = await googleCaptchaValidation(captcha);
    const captchaValidation = (await response.json()) as CaptchaValidation;

    if (!captchaValidation.success) {
      return res.status(422).json({
        message: "Captcha inválido",
      });
    }

    const recipient = process.env.MAIL_RECIPIENT;

    if (!recipient) {
      throw new Error("MAIL_RECIPIENT não definido");
    }

    const subject =
      type === "report"
        ? `Relatório enviado por ${name}`
        : `Mensagem enviada por ${name}`;

    const text = `
${type ? `Tipo: ${type}\n` : ""}
${url ? `URL: ${url}\n` : ""}
Nome: ${name}
Email: ${email}
${description ? `Descrição: ${description}` : ""}
`;

    const attachments: any[] = [];
    let imageHtml = "";

    if (files.file) {
      const fileList = Array.isArray(files.file) ? files.file : [files.file];

      fileList.forEach((file: any, index: number) => {
        const fileBuffer = fs.readFileSync(file.filepath);
        const cid = `img${index}@brcris`;

        attachments.push({
          filename: file.originalFilename || `image-${index}`,
          content: fileBuffer,
          contentType: file.mimetype,
          cid,
        });

        imageHtml += `
              <br/>
              <img
                src="cid:${cid}"
                style="max-width:400px;border-radius:8px;"
              />
            `;
      });
    }

    const html = `
          <div style="font-family: Arial, sans-serif;">
            <h3>Mensagem recebida</h3>

            ${type ? `<p><strong>Tipo:</strong> ${type}</p>` : ""}
            ${url ? `<p><strong>URL:</strong> ${url}</p>` : ""}

            <p>
              <strong>Nome:</strong> ${name}
            </p>

            <p>
              <strong>Email:</strong> ${email}
            </p>

            ${
              description
                ? `
                  <p>
                    <strong>Descrição:</strong>
                  </p>

                  <p>${description}</p>
                `
                : ""
            }

            ${imageHtml}
          </div>
        `;

    console.log("REQUEST TYPE:", type);
    console.log("FILES RECEBIDOS:", files);
    console.log("ENVIANDO EMAIL...");
    console.log("TEM ANEXO:", attachments.length > 0);

    await sendMail({
      recipient,
      subject,
      text,
      html,
      attachments,
    });

    console.log("EMAIL ENVIADO COM SUCESSO");

    return res.status(200).json({
      message: "Email enviado com sucesso",
    });
  } catch (error) {
    console.error("MAIL ERROR:", error);

    return res.status(500).json({
      message: "Erro ao enviar email",
      error: String(error),
    });
  }
};

export default proxy;
