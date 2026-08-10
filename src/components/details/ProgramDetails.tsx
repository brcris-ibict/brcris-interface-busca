import { useSearch } from "@elastic/react-search-ui";
import Head from "next/head";
import { useTranslation } from "next-i18next";
import { normalizeText } from "../../../utils/Utils";
import NotFound from "../../pages/404";
import type { OrgUnit } from "../../types/Entities";
import CopyLink from "../CopyLink";
import ShowItem from "../customResultView/ShowItem";
import DataUpdateModal from "../DataUpdateModal";
import ExpandableContent from "../ExpandableContent";
import Loader from "../Loader";
import ReportPopoverButton from "../ReportPopoverButton";

export default function ProgramDetails() {
  const { isLoading, results, wasSearched } = useSearch();
  const { t } = useTranslation("common");

  const result = results?.[0];

  if (isLoading || !wasSearched) {
    return <Loader />;
  }

  if (wasSearched && results.length === 0) {
    return <NotFound />;
  }

  const programId = result.id?.raw;

  return (
    <div>
      <Head>
        <title>{`${normalizeText(result.name?.raw)} | BrCris`}</title>
      </Head>

      <div className="mb-3 position-relative">
        <div className="d-flex justify-content-between align-items-center">
          <h1 className="title mb-0">{normalizeText(result.name?.raw)}</h1>
        </div>

        <div className="mt-2">
          <div className="d-flex justify-content-between w-100 flex-column flex-md-row gap-2 align-items-md-center">
            {programId && (
              <div className="d-flex align-items-center gap-2">
                <img
                  className="brcris-logo"
                  src="/logos/brcris-grafo.svg"
                  alt="logo do BrCris"
                />

                <CopyLink link={`${location.origin}/programs/${programId}`} />
              </div>
            )}

            <div className="d-flex align-items-center gap-2">
              <DataUpdateModal />
              <ReportPopoverButton />
            </div>
          </div>
        </div>
      </div>

      <div className="details-card">
        <ul>
          {result.orgUnit?.raw?.length > 0 && (
            <li>
              <span className="sui-result__key">{t("Organization")}</span>

              <ExpandableContent
                items={result.orgUnit.raw}
                initialCount={5}
                renderItem={(org: OrgUnit) => (
                  <a key={org.id} href={`/organizations/${org.id}`}>
                    {normalizeText(org.name)}
                  </a>
                )}
              />
            </li>
          )}

          <ShowItem
            label={t("Research field")}
            value={result.researchArea?.raw?.map((researchArea: any) => (
              <span key={researchArea.id}>
                {normalizeText(researchArea.name)}
              </span>
            ))}
          />

          <ShowItem
            label={t("Evaluation area")}
            value={result.evaluationArea?.raw}
          />

          {result.capesId?.raw?.length > 0 && (
            <li>
              <span className="identifier-key">{t("Capes identifier")}:</span>

              <ExpandableContent
                items={result.capesId.raw}
                initialCount={5}
                renderItem={(item: string) => <>{item}</>}
              />
            </li>
          )}

          {result.course?.raw?.length > 0 && (
            <li>
              <strong className="research-title">{t("Course")}</strong>

              <ExpandableContent
                items={result.course.raw}
                initialCount={5}
                renderItem={(course: any) => {
                  const name = course.name?.[0] ?? course.name;

                  const degree = course.degree?.[0];

                  return (
                    <div className="course-item" key={course.id}>
                      <a href={`/courses/${course.id}`}>
                        {normalizeText(name)}
                      </a>

                      <div className="course-meta">
                        <span className="type">{t(degree)}</span>
                      </div>
                    </div>
                  );
                }}
              />
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}
