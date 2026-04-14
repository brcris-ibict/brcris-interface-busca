import { useTranslation } from "next-i18next";
import { Button, Modal } from "react-bootstrap";
import type { DisplayField } from "../configs/DisplayFields";
import styles from "../styles/DisplayFieldsModal.module.css";

type DisplayFieldsModalProps = {
  show: boolean;
  onHide: () => void;
  fields: DisplayField[];
  selected: string[];
  onChange: (nextSelected: string[]) => void;
  onReset: () => void;
};

const DisplayFieldsModal = ({
  show,
  onHide,
  fields,
  selected,
  onChange,
  onReset,
}: DisplayFieldsModalProps) => {
  const { t } = useTranslation("common");

  const selectedSet = new Set(selected);
  const selectedFields = fields.filter((field) => selectedSet.has(field.key));
  const availableFields = fields.filter((field) => !selectedSet.has(field.key));

  const handleRemove = (key: string) => {
    const field = fields.find((item) => item.key === key);
    if (field?.fixed) return;
    if (selected.length <= 1) return;
    onChange(selected.filter((fieldKey) => fieldKey !== key));
  };

  const handleAdd = (key: string) => {
    onChange([...selected, key]);
  };

  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title>{t("Personalize display")}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className={styles.columns}>
          <div className={styles.column}>
            <h5>{t("Displayed fields")}</h5>
            <div className={styles.listBox}>
              {selectedFields.map((field) => (
                <button
                  key={field.key}
                  type="button"
                  className={`${styles.selectedItem} ${field.fixed ? styles.fixedItem : ""}`}
                  onClick={() => handleRemove(field.key)}
                  aria-label={t("Remove")}
                  aria-disabled={field.fixed}
                  disabled={!field.fixed && selectedFields.length <= 1}
                  title={field.fixed ? t("Fixed field") : t("Remove")}
                >
                  {t(field.label)}
                  {field.fixed ? (
                    <span className={styles.iconLock} aria-hidden>
                      🔒
                    </span>
                  ) : (
                    <span className={styles.iconRemove}>×</span>
                  )}
                </button>
              ))}
              {selectedFields.length === 0 && (
                <span className={styles.empty}>{t("No fields selected")}</span>
              )}
            </div>
          </div>
          <div className={styles.column}>
            <h5>{t("Available fields")}</h5>
            <div className={styles.listBox}>
              {availableFields.map((field) => (
                <button
                  key={field.key}
                  type="button"
                  className={styles.availableItem}
                  onClick={() => handleAdd(field.key)}
                  aria-label={t("Add")}
                >
                  {t(field.label)}
                  <span className={styles.iconAdd}>+</span>
                </button>
              ))}
              {availableFields.length === 0 && (
                <span className={styles.empty}>{t("No available fields")}</span>
              )}
            </div>
          </div>
        </div>
        <button type="button" className={styles.resetLink} onClick={onReset}>
          {t("Default display")}
        </button>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          {t("Close")}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default DisplayFieldsModal;
