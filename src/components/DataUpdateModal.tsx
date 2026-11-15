import { ChevronRight, DatabaseBackup, RefreshCw, X } from "lucide-react";
import Link from "next/link";
import { useTranslation } from "next-i18next";
import { useEffect, useRef, useState } from "react";

import styles from "../styles/DataUpdateModal.module.css";

interface UpdateModalProps {
  width?: string;
}

export default function DataUpdateModal({ width }: UpdateModalProps) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const wasOpen = useRef(false);
  const { t } = useTranslation();
  const updateDate = "10/2026";

  useEffect(() => {
    if (!open) {
      if (wasOpen.current) {
        wasOpen.current = false;
        triggerRef.current?.focus();
      }
      return;
    }

    wasOpen.current = true;
    closeRef.current?.focus();

    const handleDialogKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setOpen(false);
        return;
      }

      if (event.key !== "Tab") return;

      const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), a[href], input:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      if (!focusable?.length) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleDialogKeyDown);
    return () => document.removeEventListener("keydown", handleDialogKeyDown);
  }, [open]);

  return (
    <>
      <button
        ref={triggerRef}
        className={styles.updateTrigger}
        type="button"
        onClick={() => setOpen(true)}
        style={{ width }}
        aria-label={t("Update: {{date}}, view data sources and collection dates", {
          date: updateDate,
        })}
      >
        <span className={styles.updateTriggerContent}>
          <DatabaseBackup size={20} strokeWidth={1.8} aria-hidden="true" />

          <span className={styles.updateTriggerText}>
            <strong>{t("Update")}:</strong> {updateDate}
          </span>
        </span>

        <ChevronRight
          size={18}
          strokeWidth={2}
          className={styles.updateTriggerChevron}
          aria-hidden="true"
        />
      </button>

      {open && (
        <div className={styles.modalBackdrop} onClick={() => setOpen(false)}>
          <div
            className={styles.modalContent}
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="data-update-modal-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.modalHeader}>
              <div className={styles.modalTitleWrap}>
                <div className={styles.modalIcon}>
                  <DatabaseBackup size={20} strokeWidth={1.8} />
                </div>

                <div>
                  <h2 className={styles.modalTitle} id="data-update-modal-title">
                    {t("Data from this page")}
                  </h2>

                  <p className={styles.modalSubtitle}>
                    {t("Update")}: {updateDate}
                  </p>
                </div>
              </div>

              <button
                ref={closeRef}
                className={styles.modalClose}
                type="button"
                onClick={() => setOpen(false)}
                aria-label={t("Close")}
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
                  {t("october of 2026")}
                </span>
              </div>

              <Link
                className={styles.modalButton}
                href="/data-sources"
                rel="noreferrer"
              >
                {t("See sources and collection dates")}
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
