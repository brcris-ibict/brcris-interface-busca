/* eslint-disable @typescript-eslint/ban-ts-comment */
import { useTranslation } from "next-i18next";
import { useRef, useState } from "react";
import ReCAPTCHA from "react-google-recaptcha";
import { alertService } from "../services/AlertService";
import MailService from "../services/MailService";
import style from "../styles/ContactForm.module.css";
import Loader from "./Loader";

function ContactForm() {
  const { t } = useTranslation("common");

  const options = {
    autoClose: true,
    keepAfterRouteChange: false,
  };

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setLoading] = useState(false);
  const [captchaCode, setCaptchaCode] = useState("");
  const recaptchaRef = useRef<any>(null);

  const handleSubmit = async (event: any) => {
    event.preventDefault();
    if (!captchaCode) return;

    const data = { name, email, message, captcha: captchaCode };

    try {
      setLoading(true);
      const response = await MailService(JSON.stringify(data));
      setLoading(false);

      if (response.status === 200) {
        setName("");
        setEmail("");
        setMessage("");
        alertService.success(t("Mail sent success"), options);
      } else {
        alertService.error(t("Mail sent error"), options);
      }
    } finally {
      setCaptchaCode("");
      recaptchaRef.current?.reset();
      setLoading(false);
    }
  };

  const PUBLIC_RECAPTCHA_SITE_KEY = process.env.PUBLIC_RECAPTCHA_SITE_KEY || "";

  return (
    <div>
      {isLoading && <Loader />}

      <div className={style.contact}>
        <form onSubmit={handleSubmit}>
          <div className="col-sm-12">
            <label htmlFor="contact-name" className="visually-hidden">
              {t("Name")}
            </label>
            <input
              id="contact-name"
              className="form-control search-box"
              type="text"
              placeholder={t("Name")}
              required
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </div>

          <div className="col-sm-12 my-3">
            <label htmlFor="contact-email" className="visually-hidden">
              {t("E-mail")}
            </label>
            <input
              id="contact-email"
              className="form-control search-box"
              type="email"
              placeholder={t("E-mail")}
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </div>

          <div className="col-sm-12">
            <label htmlFor="contact-message" className="visually-hidden">
              {t("Message")}
            </label>
            <textarea
              id="contact-message"
              className="form-control search-box"
              rows={6}
              placeholder={t("Message")}
              required
              value={message}
              onChange={(event) => setMessage(event.target.value)}
            />
          </div>

          <div className="submit-btn col-sm-12 mt-2 d-flex justify-content-between align-items-center">
            {/* @ts-ignore */}
            <ReCAPTCHA
              size="normal"
              ref={recaptchaRef}
              sitekey={PUBLIC_RECAPTCHA_SITE_KEY}
              onChange={(value) => setCaptchaCode(value || "")}
            />

            <button
              disabled={!(captchaCode && name && email && message)}
              className="btn btn-primary px-4 py-2"
              type="submit"
            >
              {t("Submit")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ContactForm;
