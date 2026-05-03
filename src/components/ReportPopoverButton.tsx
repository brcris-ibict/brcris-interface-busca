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
        aria-label={t("Report a problem")}
        title={t("Report a problem")}
      >
        <AlertTriangle size={18} />
      </button>

      <Overlay
        show={show}
        target={target as any}
        placement="bottom"
        rootClose
        onHide={() => setShow(false)}
      >
        <Popover id="popover-report" className="report-popover">
          <Popover.Header as="h3" className="report-popover-header">
            {t("Report a problem")}
          </Popover.Header>
          <Popover.Body className="report-popover-body">
            {t("Found an issue?")}
            <p>
              <a href="/contact" className="report-popover-link">
                {t("Click here to report")}
              </a>
            </p>
          </Popover.Body>
        </Popover>
      </Overlay>
    </>
  );
}
