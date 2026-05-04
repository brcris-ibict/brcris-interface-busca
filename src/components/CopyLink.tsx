import { Copy } from "lucide-react";
import { useTranslation } from "next-i18next";
import { useState } from "react";

const CopyLink = ({ link }: { link: string }) => {
  const { t } = useTranslation("common");
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(link);
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = link;
        textArea.style.position = "fixed";
        textArea.style.opacity = "0";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
      }

      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy: ", err);
    }
  };
  return (
    <div style={{ display: "inline-block", position: "relative" }}>
      <span
        className="brcris-copy"
        title={t("Copy BrCris ID")}
        onClick={handleCopy}
        style={{ cursor: "pointer", color: "var(--bs-link-color)" }}
      >
        <span>BrCris ID</span> <Copy />
      </span>
      <span
        style={{
          position: "absolute",
          top: "0",
          left: "90px",
          transform: "translateX(-50%)",
          background: "#333",
          color: "#fff",
          padding: "2px 8px",
          borderRadius: "4px",
          fontSize: "12px",
          opacity: copied ? 1 : 0,
          transition: "opacity 0.3s ease",
          pointerEvents: "none",
          width: "max-content",
        }}
      >
        {t("Link copied!")}
      </span>
    </div>
  );
};

export default CopyLink;
