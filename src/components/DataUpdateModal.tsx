import { ChevronRight, DatabaseBackup, RefreshCw, X } from "lucide-react";
import { useTranslation } from "next-i18next";
import { useState } from "react";

import styles from "../styles/DataUpdateModal.module.css";

interface UpdateModalProps {
  width?: string;
}

export default function DataUpdateModal({ width }: UpdateModalProps) {
  const [open, setOpen] = useState(false);
  const { t } = useTranslation();

  return (
    <>
      <button
        className={styles.updateTrigger}
        type="button"
        onClick={() => setOpen(true)}
        style={{ width }}
      >
        <span className={styles.updateTriggerContent}>
          <DatabaseBackup size={20} strokeWidth={1.8} />

          <span className={styles.updateTriggerText}>
            <strong>{t("Update")}:</strong> {"04/2026"}
          </span>
        </span>

        <ChevronRight
          size={18}
          strokeWidth={2}
          className={styles.updateTriggerChevron}
        />
      </button>

      {open && (
        <div className={styles.modalBackdrop} onClick={() => setOpen(false)}>
          <div
            className={styles.modalContent}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.modalHeader}>
              <div className={styles.modalTitleWrap}>
                <div className={styles.modalIcon}>
                  <DatabaseBackup size={20} strokeWidth={1.8} />
                </div>

                <div>
                  <h2 className={styles.modalTitle}>
                    {t("Data from this page")}
                  </h2>

                  <p className={styles.modalSubtitle}>
                    {t("Update")}: {"04/2026"}
                  </p>
                </div>
              </div>

              <button
                className={styles.modalClose}
                type="button"
                onClick={() => setOpen(false)}
              >
                <X size={16} />
              </button>
            </div>

            <div className={styles.modalBody}>
              <p>
                {t(
                  "This page gathers information collected from different sources. Data coverage may vary depending on the origin.",
                )}
              </p>

              <div className={styles.modalMeta}>
                <RefreshCw size={18} strokeWidth={1.8} />

                <span>
                  <strong>{t("Last load in BrCris")}:</strong>{" "}
                  {t("april of 2026")}
                </span>
              </div>

              <a
                className={styles.modalButton}
                href="/data-sources"
                rel="noreferrer"
              >
                {t("See sources and collection dates")}
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
