import { useRouter } from "next/router";
import { useTranslation } from "next-i18next";
import { useEffect, useRef, useState } from "react";
import { useDropzone } from "react-dropzone";
import ReCAPTCHA from "react-google-recaptcha";

import { withBasePath } from "../lib/basePath";
import { alertService } from "../services/AlertService";

import style from "../styles/Form.module.css";

import Loader from "./Loader";

function ReportForm() {
  const { t } = useTranslation("common");

  const router = useRouter();

  const [url, setUrl] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [description, setDescription] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [isLoading, setLoading] = useState(false);
  const [captchaCode, setCaptchaCode] = useState("");

  const recaptchaRef = useRef<any>(null);

  const options = {
    autoClose: true,
    keepAfterRouteChange: false,
  };

  useEffect(() => {
    if (!router.isReady) return;

    const queryUrl = router.query.url;

    if (typeof queryUrl === "string") {
      setUrl(queryUrl);
    }
  }, [router.isReady, router.query.url]);

  useEffect(() => {
    const urls = files.map((file) => URL.createObjectURL(file));
    setPreviews(urls);

    return () => {
      urls.forEach((url) => {
        URL.revokeObjectURL(url);
      });
    };
  }, [files]);

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleKeyDown = (e: any) => {
    // Prevent paste shortcut (Ctrl/Cmd+V) opening file chooser when user
    // doesn't want paste functionality in this form.
    if ((e.ctrlKey || e.metaKey) && String(e.key).toLowerCase() === "v") {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  const { getRootProps, getInputProps } = useDropzone({
    onDrop: (acceptedFiles) => {
      setFiles((prev) => [...prev, ...acceptedFiles]);
    },
    accept: {
      "image/*": [],
    },
  });

  const handleSubmit = async (event: any) => {
    event.preventDefault();

    if (!captchaCode) return;

    if (!url.startsWith("http")) {
      alertService.error("Informe uma URL válida", options);
      return;
    }

    try {
      setLoading(true);

      const formData = new FormData();

      formData.append("type", "report");
      formData.append("url", url);
      formData.append("name", name);
      formData.append("email", email);
      formData.append("description", description);
      formData.append("captcha", captchaCode);

      files.forEach((file) => {
        formData.append("file", file);
      });

      const response = await fetch(withBasePath("/api/mail"), {
        method: "POST",
        body: formData,
      });

      if (response.status === 200) {
        setUrl("");
        setName("");
        setEmail("");
        setDescription("");
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

      <form
        onSubmit={handleSubmit}
        className={style.form}
        onKeyDown={handleKeyDown}
      >
        <h2 className={style.title}>{t("Report inconsistency")}</h2>

        <input
          className="form-control mb-3"
          type="url"
          placeholder="URL"
          value={url}
          readOnly
          required
        />

        <input
          className="form-control mb-3"
          type="text"
          placeholder={t("Name")}
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />

        <input
          className="form-control mb-3"
          type="email"
          placeholder={t("E-mail")}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <textarea
          className="form-control mb-3"
          rows={6}
          placeholder={t("Description")}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
        />

        <div {...getRootProps()} className={style.dropzone}>
          <input {...getInputProps()} />

          <p>{t("Drag files here or click to upload")}</p>
        </div>

        {files.length > 0 && (
          <div className={style.fileList}>
            <div className={style.previewGrid}>
              {files.map((file, index) => (
                <div
                  key={`${file.name}-${index}`}
                  className={style.previewItem}
                >
                  {previews[index] ? (
                    <img
                      className={style.previewImage}
                      src={previews[index]}
                      alt={file.name}
                    />
                  ) : (
                    <div className={style.previewPlaceholder}>{file.name}</div>
                  )}
                  <div className={style.previewMeta}>
                    <span>{file.name}</span>
                    <button
                      type="button"
                      className={style.removeButton}
                      onClick={() => removeFile(index)}
                    >
                      Remover
                    </button>
                  </div>
                </div>
              ))}
            </div>
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
            disabled={!(captchaCode && url && name && email && description)}
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

export default ReportForm;
