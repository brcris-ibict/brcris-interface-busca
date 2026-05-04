import nodemailer from "nodemailer";
import logger from "../../services/Logger";

export type BodyType = {
  recipient: string;
  subject: string;
  text: string;
  html: string;
  attachments?: any[];
};

export async function sendMail({
  recipient,
  subject,
  text,
  html,
  attachments = [],
}: BodyType) {
  try {
    console.log(`enviando email para: ${recipient}`);

    const MAILPORT = process.env.MAIL_PORT;
    const MAILHOST = process.env.MAIL_HOST;
    const MAILSENDER = process.env.MAIL_SENDER;
    const PASSWORD = process.env.MAIL_PASSWORD;
    const RECIPIENT = process.env.MAIL_RECIPIENT;

    if (!MAILPORT || !MAILHOST || !MAILSENDER || !PASSWORD) {
      logger.error("Variáveis de ambiente faltando");
      throw new Error("Variáveis de ambiente faltando");
    }

    const transporter = nodemailer.createTransport({
      port: Number(MAILPORT),
      host: MAILHOST,
      auth: {
        user: MAILSENDER,
        pass: PASSWORD,
      },
      tls: {
        rejectUnauthorized: false,
      },
      logger: true,
      debug: true,
    });

    const mailData = {
      from: `"BrCris" <${MAILSENDER}>`,
      to: recipient || RECIPIENT,
      subject,
      text,
      html,
      attachments,
    };

    console.log("ENVIANDO COM ATTACHMENTS:", attachments.length);

    const mailResponse = await transporter.sendMail(mailData);

    return mailResponse;
  } catch (err: any) {
    logger.error(err);
    throw new Error(err.message || "Erro ao enviar email");
  }
}
