import { AlertTriangle } from "lucide-react";
import { useTranslation } from "next-i18next";
import { useState } from "react";
import { Overlay, Popover } from "react-bootstrap";

type ReportPopoverButtonProps = {
  className?: string;
};

export default function ReportPopoverButton({
  className = "",
}: ReportPopoverButtonProps) {
  const { t } = useTranslation("common");
  const [show, setShow] = useState(false);
  const [target, setTarget] = useState<EventTarget | null>(null);

  const handleClick = (event: any) => {
    setShow(!show);
    setTarget(event.target);
  };

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        className={`${className} report-popover-btn`}
        aria-label={t("Report inconsistency")}
        title={t("Report inconsistency")}
      >
        <AlertTriangle size={20} />
      </button>

      <Overlay
        show={show}
        target={target as any}
        placement="bottom"
        rootClose
        onHide={() => setShow(false)}
      >
        <Popover id="popover-report">
          <Popover.Header as="h3">{t("Report inconsistency")}</Popover.Header>

          <Popover.Body>
            <p>{t("Found an error or outdated information on this page?")}</p>

            <a href="/report" className="report-popover-link">
              {t("Submit correction")}
            </a>
          </Popover.Body>
        </Popover>
      </Overlay>
    </>
  );
}
