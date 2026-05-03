/* eslint-disable @typescript-eslint/ban-ts-comment */
import { useTranslation } from "next-i18next";
import { useRef, useState } from "react";
import { useDropzone } from "react-dropzone";
import ReCAPTCHA from "react-google-recaptcha";
import { alertService } from "../services/AlertService";
import style from "../styles/ContactForm.module.css";
import Loader from "./Loader";

function ContactForm() {
  const { t } = useTranslation("common");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [isLoading, setLoading] = useState(false);
  const [captchaCode, setCaptchaCode] = useState("");
  const recaptchaRef = useRef<any>(null);

  const options = {
    autoClose: true,
    keepAfterRouteChange: false,
  };

  // 🔥 DROPZONE
  const { getRootProps, getInputProps } = useDropzone({
    onDrop: (acceptedFiles) => {
      setFiles((prev) => [...prev, ...acceptedFiles]);
    },
  });

  const handleSubmit = async (event: any) => {
    event.preventDefault();
    if (!captchaCode) return;

    try {
      setLoading(true);

      const formData = new FormData();
      formData.append("name", name);
      formData.append("email", email);
      formData.append("message", message);
      formData.append("captcha", captchaCode);

      // 📎 múltiplos arquivos
      files.forEach((file) => {
        formData.append("file", file);
      });

      const response = await fetch("/api/mail", {
        method: "POST",
        body: formData,
      });

      if (response.status === 200) {
        setName("");
        setEmail("");
        setMessage("");
        setFiles([]);
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
    <div className={style.wrapper}>
      {isLoading && <Loader />}

      <form onSubmit={handleSubmit} className={style.form}>
        <h2 className={style.title}>Contact Support</h2>

        {/* NAME */}
        <input
          className="form-control"
          type="text"
          placeholder={t("Name")}
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />

        {/* EMAIL */}
        <input
          className="form-control"
          type="email"
          placeholder={t("E-mail")}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        {/* MESSAGE */}
        <textarea
          className="form-control"
          rows={6}
          placeholder={t("Message")}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          required
        />

        <div {...getRootProps()} className={style.dropzone}>
          <input {...getInputProps()} />
          <p>{t("Drag files here or click to upload")}</p>
        </div>

        {files.length > 0 && (
          <div className={style.fileList}>
            {files.map((file, index) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
              <div key={index} className={style.fileItem}>
                {file.name}
              </div>
            ))}
          </div>
        )}

        <div className={style.footer}>
          {/* @ts-ignore */}
          <ReCAPTCHA
            ref={recaptchaRef}
            sitekey={PUBLIC_RECAPTCHA_SITE_KEY}
            onChange={(value) => setCaptchaCode(value || "")}
          />

          <button
            disabled={!(captchaCode && name && email && message)}
            className="btn btn-primary"
            type="submit"
          >
            {t("Submit")}
          </button>
        </div>
      </form>
    </div>
  );
}

export default ContactForm;
