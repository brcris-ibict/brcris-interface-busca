import { useTranslation } from "next-i18next";
import { useEffect, useState } from "react";
import ExpandableContent from "../ExpandableContent";

interface Props {
  personId: string;
}

interface Patent {
  id: string;
  title: string;
}

function PatentsByInventor({ personId }: Props) {
  const [patents, setPatents] = useState<Patent[]>([]);
  const [loading, setLoading] = useState(true);
  const { t } = useTranslation("common");

  useEffect(() => {
    const fetchPatents = async () => {
      try {
        const res = await fetch(`/api/patent?personId=${personId}`);
        if (!res.ok) return;

        const data = await res.json();
        setPatents(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Erro ao buscar patentes", err);
      } finally {
        setLoading(false);
      }
    };

    fetchPatents();
  }, [personId]);

  if (loading || patents.length === 0) {
    return null;
  }

  return (
    <li>
      <strong className="research-title">{t("Patents")}</strong>

      <ExpandableContent
        items={patents}
        initialCount={5}
        renderItem={(p: Patent) => (
          <div key={p.id}>
            <a href={`/patents/${p.id}`}>{p.title}</a>
          </div>
        )}
      />
    </li>
  );
}

export default PatentsByInventor;
