/* eslint-disable @typescript-eslint/ban-ts-comment */
import type {
  QueryDslOperator,
  QueryDslQueryContainer,
} from "@elastic/elasticsearch/lib/api/types";
import { SearchContext, withSearch } from "@elastic/react-search-ui";
import { Download } from "lucide-react";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next";
import { useContext, useRef, useState } from "react";
import { Button, Modal } from "react-bootstrap";
import ReCAPTCHA from "react-google-recaptcha";
import { alertService } from "../services/AlertService";
import ExportService from "../services/ExportService";
import type { CustomSearchQuery } from "../types/Entities";
import { Alert } from "./Alert";
import { formatedQuery } from "./indicators/query/Query";
import Loader from "./Loader";

type DownloadModalProps = {
  filters?: any;
  searchTerm?: any;
  totalResults: number;
  typeArq?: string;
};

const alertOptions = {
  autoClose: false,
  keepAfterRouteChange: false,
};

const DownloadModal = ({
  filters,
  searchTerm,
  totalResults,
  typeArq,
}: DownloadModalProps) => {
  const { t } = useTranslation("common");
  const router = useRouter();
  const PUBLIC_RECAPTCHA_SITE_KEY = process.env.PUBLIC_RECAPTCHA_SITE_KEY || "";
  const { driver } = useContext(SearchContext);
  const [show, setShow] = useState(false);
  const [downloadLink, setDownloadLink] = useState("");
  const [isLoading, setLoading] = useState(false);
  const [formSent, setFormSent] = useState(false);
  const [email, setEmail] = useState("");
  const [captcha, setCaptcha] = useState("");
  const recaptchaRef = useRef(null);
  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);
  const { search_fields, result_fields, operator, index } =
    driver.searchQuery as CustomSearchQuery;
  // @ts-expect-error
  const fields = Object.keys(search_fields);
  // @ts-expect-error
  const resultFields = Object.keys(result_fields);

  const title = typeArq === undefined ? "csv" : typeArq;

  async function handleDownload() {
    handleShow();
    setFormSent(false);
    if (totalResults <= 1000) {
      try {
        setLoading(true);
        if (typeArq === undefined) {
          typeArq = "csv";
        }
        const query: QueryDslQueryContainer = formatedQuery(
          searchTerm,
          fields,
          operator as QueryDslOperator,
          filters,
        );
        const response = await new ExportService().search(
          index,
          query,
          resultFields,
          totalResults,
          getIndexName(),
          typeArq,
        );
        const { file } = await response.json();
        const nextDownloadLink = getDownloadLink(file);
        setDownloadLink(nextDownloadLink);
      } finally {
        setLoading(false);
      }
    }
  }

  const handleSubmit = async (event: any) => {
    event.preventDefault();
    if (!captcha) {
      return;
    }

    try {
      setLoading(true);
      const query: QueryDslQueryContainer = formatedQuery(
        searchTerm,
        fields,
        operator as QueryDslOperator,
        filters,
      );
      if (typeArq === undefined) {
        typeArq = "csv";
      }

      const response = await new ExportService().search(
        index,
        query,
        resultFields,
        totalResults,
        getIndexName(),
        typeArq,
        email,
        captcha,
      );
      const { file } = await response.json();
      setLoading(false);
      if (file) {
        const nextDownloadLink = getDownloadLink(file);
        setDownloadLink(nextDownloadLink);
      } else {
        if (response.status === 200) {
          setEmail("");
          alertService.info(
            t(
              "Export processing. The download link will be sent to the e-mail address provided when the file is ready.",
            ),
            alertOptions,
          );
        } else if (response.status === 507) {
        } else {
          alertService.error(t("Export failed, try again later"), alertOptions);
        }
      }
    } finally {
      setCaptcha("");
      // @ts-expect-error
      recaptchaRef.current.reset();
      setLoading(false);
      setFormSent(true);
    }
  };

  const onReCAPTCHAChange = async (value: string) => {
    setCaptcha(value);
  };

  function getIndexName() {
    // remove a / do início da string
    return router.pathname.slice(1);
  }

  function getDownloadLink(file: any) {
    return `/api/download?fileName=${file}&indexName=${getIndexName()}`;
  }

  return (
    <>
      <button
        type="button"
        title={t(`Exportar ${title}`) || `Exportar ${title}`}
        className="btn-header btn btn-outline-secondary d-flex align-items-center flex-gap-8"
        onClick={handleDownload}
      >
        <Download />
        {t(`${title}`)}
      </button>
      {isLoading ? <Loader /> : ""}

      <Modal show={show} onHide={handleClose} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>{t("Download")}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Alert />
          {downloadLink && (
            <a href={downloadLink} target="_blank" rel="noreferrer">
              {t("Download file")}
            </a>
          )}
          {totalResults > 1000 && !formSent && (
            <div>
              <p>
                {t(
                  "For searches involving a large number of records, the export file may not be immediately available for download. In such cases, the download link for the file will be sent via email shortly.",
                )}
              </p>
              <p>{t("Enter your email in the field below:")}</p>
              <form
                onSubmit={(event) => {
                  handleSubmit(event);
                }}
              >
                <label htmlFor="export-email" className="visually-hidden">
                  {t("Email")}
                </label>

                <input
                  id="export-email"
                  className="form-control search-box"
                  type="email"
                  placeholder={t("Email")}
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
                <div className="submit-btn col-sm-12 mt-2 d-flex justify-content-between align-items-center">
                  {/* @ts-ignore */}
                  <ReCAPTCHA
                    size="normal"
                    ref={recaptchaRef}
                    sitekey={PUBLIC_RECAPTCHA_SITE_KEY}
                    onChange={onReCAPTCHAChange}
                  />

                  <button
                    disabled={!(captcha !== "" && email !== "")}
                    className="btn btn-primary px-4 py-2"
                    type="submit"
                  >
                    {t("Submit")}
                  </button>
                </div>
              </form>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleClose}>
            {t("Close")}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default withSearch(({ filters, searchTerm, totalResults }) => ({
  filters,
  searchTerm,
  totalResults,
}))(DownloadModal);
