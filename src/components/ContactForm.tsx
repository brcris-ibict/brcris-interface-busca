import { useTranslation } from "next-i18next";
import { useRef, useState } from "react";
import ReCAPTCHA from "react-google-recaptcha";
import { alertService } from "../services/AlertService";
import MailService from "../services/MailService";
import style from "../styles/Form.module.css";
import Loader from "./Loader";

function ContactForm() {
  /* const router = useRouter() */
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
  const recaptchaRef = useRef(null);

  const handleSubmit = async (event: any) => {
    event.preventDefault();
    if (!captchaCode) {
      return;
    }
    const data = {
      type: "contact",
      name,
      email,
      description: message,
      captcha: captchaCode,
    };

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
      // @ts-expect-error
      recaptchaRef.current.reset();
      setLoading(false);
    }
  };

  const onReCAPTCHAChange = async (value: string) => {
    setCaptchaCode(value);
  };

  const PUBLIC_RECAPTCHA_SITE_KEY = process.env.PUBLIC_RECAPTCHA_SITE_KEY || "";
  return (
    <div>
      {isLoading ? <Loader /> : ""}
      <div className={style.contact}>
        <form
          onSubmit={(event) => {
            handleSubmit(event);
          }}
        >
          <div className="col-sm-12">
            <label htmlFor="contact-name" className={style.fieldLabel}>
              {t("Name")}
            </label>
            <input
              id="contact-name"
              name="name"
              className="form-control search-box"
              type="text"
              required
              value={name}
              onChange={(event) => {
                setName(event.target.value);
              }}
            />
          </div>

          <div className="col-sm-12 my-3">
            <label htmlFor="contact-email" className={style.fieldLabel}>
              {t("Email")}
            </label>
            <input
              id="contact-email"
              name="email"
              className="form-control search-box"
              type="email"
              required
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
              }}
            />
          </div>

          <div className="col-sm-12">
            <label htmlFor="contact-message" className={style.fieldLabel}>
              {t("Message")}
            </label>
            <textarea
              id="contact-message"
              name="message"
              className="form-control search-box"
              rows={6}
              required
              value={message}
              onChange={(event) => {
                setMessage(event.target.value);
              }}
            />
          </div>

          <div className="submit-btn col-sm-12 mt-2 d-flex justify-content-between align-items-center">
            {/* @ts-ignore */}
            <ReCAPTCHA
              size="normal"
              ref={recaptchaRef}
              sitekey={PUBLIC_RECAPTCHA_SITE_KEY}
              onChange={onReCAPTCHAChange}
            />
            <button
              disabled={
                !(
                  captchaCode !== "" &&
                  name !== "" &&
                  email !== "" &&
                  message !== ""
                )
              }
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
