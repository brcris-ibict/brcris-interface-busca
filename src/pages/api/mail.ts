import type { NextApiRequest, NextApiResponse } from "next";
import logger from "../../services/Logger";
import { googleCaptchaValidation } from "./googleCaptchaValidation";
import { sendMail } from "./sendMail";

type CaptchaValidation = {
  success: boolean;
};

const proxy = async (req: NextApiRequest, res: NextApiResponse) => {
  const { body } = req;

  if (
    body.name === "" ||
    body.email === "" ||
    body.message === "" ||
    body.captcha === ""
  ) {
    res
      .status(400)
      .json({ message: "os campos obrigatórios não foram preenchidos" });
  }

  // Extract the email and captcha code from the request body
  const { captcha } = body;

  try {
    // Ping the google recaptcha verify API to verify the captcha code you received
    const response = await googleCaptchaValidation(captcha);
    const captchaValidation: CaptchaValidation =
      (await response.json()) as CaptchaValidation;
    if (captchaValidation.success) {
      const recipient = process.env.MAIL_RECIPIENT || "";
      const { name, email, message } = body;
      const subject = `Message from ${name}`;
      const text = `${message} | Sent from: ${email}`;
      const html = `<div>${message}</div> <p>Sent from: ${email}</p>`;
      await sendMail({ recipient, subject, text, html });
      return res.status(200).send("OK");
    }

    return res.status(422).json({
      message: "Unproccesable request, Invalid captcha code",
    });
  } catch (error) {
    logger.error(error);
    return res.status(422).json({ message: "Something went wrong" });
  }
};

export default proxy;
