import { useEffect, useState } from "react";

function PatentTitle({ patentId }: { patentId: string }) {
  const [title, setTitle] = useState<string>(patentId);

  useEffect(() => {
    const fetchTitle = async () => {
      try {
        const res = await fetch(`/api/patent?patentId=${patentId}`);
        const data = await res.json();

        if (res.ok && data.title) {
          setTitle(data.title);
        }
      } catch (err) {
        console.error(err);
      }
    };

    fetchTitle();
  }, [patentId]);

  return <>{title}</>;
}

export default PatentTitle;
