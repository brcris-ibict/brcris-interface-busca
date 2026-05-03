import { AlertTriangle } from "lucide-react";
import { useTranslation } from "next-i18next";
import { OverlayTrigger, Popover } from "react-bootstrap";

type ReportPopoverButtonProps = {
  className?: string;
};

export default function ReportPopoverButton({
  className = "",
}: ReportPopoverButtonProps) {
  const { t } = useTranslation("common");

  const popover = (
    <Popover id="popover-report" className="report-popover">
      <Popover.Header as="h3" className="report-popover-header">
        {t("Report a problem")}
      </Popover.Header>
      <Popover.Body className="report-popover-body">
        {t("Found an issue?")}
        <p>
          <a href="/contact" rel="noreferrer" className="report-popover-link">
            {t("Click here to report")}
          </a>
        </p>
      </Popover.Body>
    </Popover>
  );

  return (
    <OverlayTrigger trigger="click" placement="bottom" overlay={popover}>
      <button
        type="button"
        className={`${className} report-popover-btn`}
        aria-label={t("Report a problem")}
        title={t("Report a problem")}
      >
        <AlertTriangle size={18} />
      </button>
    </OverlayTrigger>
  );
}
