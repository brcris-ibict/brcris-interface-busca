import { useEffect, useState } from "react";

function SoftwareTitle({ softwareId }: { softwareId: string }) {
  const [title, setTitle] = useState<string>(softwareId);

  useEffect(() => {
    const fetchTitle = async () => {
      try {
        const res = await fetch(`/api/software?softwareId=${softwareId}`);
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

  return <>{title}</>;
}

export default SoftwareTitle;
