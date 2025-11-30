import { Info } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next";
import { useState } from "react";
import { Button, Modal } from "react-bootstrap";
import styles from "../styles/AdvancedSearch.module.css";

type HelpModalProps = {
  fields: string[];
};

const HelpModal = ({ fields }: HelpModalProps) => {
  const { t } = useTranslation(["common", "advanced"]);
  const router = useRouter();
  const [show, setShow] = useState(false);
  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);

  return (
    <>
      <span onClick={handleShow} className={styles.help}>
        <Info />
      </span>

      <Modal show={show} onHide={handleClose} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>{t("Advanced search")}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>
            {t(
              "You can enrich your search in a very simple way. Use the search indexes combined with the Operators (AND, OR or AND NOT) and specify more your search.",
            )}
          </p>
          <p>
            {t(
              "For example, if you want to search for publications on Computing in 2018, excluding master thesis: go to the ",
            )}{" "}
            <Link href="/publications">{t("publications")}</Link>{" "}
            {t("index page and use the query below")}:
          </p>
          <p className="text-center">
            <b>
              {t(
                "(Title:Computing) AND (Year:2018) AND NOT (Type:master thesis)",
              )}
            </b>
          </p>
          <hr />
          <p>
            {t(
              "See below for the full list of search fields that can be used for the index of",
            )}{" "}
            <b>{t(router.pathname.replaceAll("/", ""))}</b>.
          </p>
          <ul>
        {fields.map((field) => {
          const label = field.toLowerCase() === "doi" ? "DOI" : t(field, { ns: "advanced" });
          return <li key={field}>{label}</li>;
        })}
      </ul>
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

export default HelpModal;
