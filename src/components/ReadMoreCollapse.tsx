import { useTranslation } from "next-i18next";
import { type PropsWithChildren, useState } from "react";

interface CollapseProps extends PropsWithChildren {
  id: string;
}

function getSanitizedId(id: string) {
  const cleanId = id.replaceAll("-", "");
  return "a" + cleanId;
}

const ReadMoreCollapse = ({ children, id }: CollapseProps) => {
  const { t } = useTranslation("common");
  const [buttonReadText, setButtonReadText] = useState("Read more...");

  function handleClick() {
    setButtonReadText(
      buttonReadText === "Read more..." ? "Read less" : "Read more...",
    );
  }
  const sanitizedId = getSanitizedId(id);
  return (
    <>
      <button
        className="btn read-more"
        type="button"
        data-bs-toggle="collapse"
        data-bs-target={`#${sanitizedId}`}
        aria-expanded="false"
        aria-controls={sanitizedId}
        onClick={handleClick}
      >
        {t(buttonReadText)}
      </button>
      <span className="collapse" id={sanitizedId}>
        {children}
      </span>
    </>
  );
};

export default ReadMoreCollapse;
