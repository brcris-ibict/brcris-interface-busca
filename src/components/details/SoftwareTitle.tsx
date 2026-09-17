import { useEffect, useState } from "react";
import { normalizeText } from "../../../utils/Utils";
import { withBasePath } from "../../lib/basePath";

function SoftwareTitle({ softwareId }: { softwareId: string }) {
  const [title, setTitle] = useState<string>(softwareId);

  useEffect(() => {
    const fetchTitle = async () => {
      try {
        const res = await fetch(
          withBasePath(`/api/software?softwareId=${softwareId}`),
        );
        const data = await res.json();
        if (res.ok && data.title) {
          setTitle(data.title);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchTitle();
  }, [softwareId]);

  return <>{normalizeText(title)}</>;
}

export default SoftwareTitle;
