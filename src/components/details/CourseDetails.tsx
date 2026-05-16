/* eslint-disable @typescript-eslint/ban-ts-comment */

import { useSearch } from "@elastic/react-search-ui";
import Head from "next/head";
import { useTranslation } from "next-i18next";
import NotFound from "../../pages/404";
import type { OrgUnit } from "../../types/Entities";
import CopyLink from "../CopyLink";
import ShowItem from "../customResultView/ShowItem";
import DataUpdateModal from "../DataUpdateModal";
import ExpandableContent from "../ExpandableContent";
import Loader from "../Loader";
import ReportPopoverButton from "../ReportPopoverButton";

export default function CourseDetails() {
  const { isLoading, results } = useSearch();
  const { t } = useTranslation("common");

  const result = results?.[0];

  if (isLoading) {
    return <Loader />;
  }

  if (!result) {
    return <NotFound />;
  }

  const courseId = result.id?.raw;

  return (
    <div>
      <Head>
        <title>{`${result.name?.raw} | BrCris`}</title>
      </Head>

      <div className="mb-3 position-relative">
        <div className="d-flex justify-content-between align-items-center">
          <h1 className="title mb-0">{result.name?.raw}</h1>
        </div>

        <div className="mt-2">
          <div className="d-flex align-items-center justify-content-between w-100">
            {courseId && (
              <div className="d-flex align-items-center gap-2">
                <img
                  className="brcris-logo"
                  src="/logos/brcris-grafo.svg"
                  alt="logo do BrCris"
                />

                <CopyLink link={`${location.origin}/courses/${courseId}`} />

                <ReportPopoverButton />
              </div>
            )}
          </div>
        </div>
        <div className="d-flex align-items-center gap-2">
          <DataUpdateModal />
          <ReportPopoverButton />
        </div>
      </div>

      <div className="details-card">
        <ul>
          <ShowItem label={t("Degree")} value={result.degree?.raw} />

          <ShowItem label={t("Type")} value={result.type?.raw} />

          <ShowItem label={t("Start date")} value={result.startDate?.raw} />

          <ShowItem label={t("End date")} value={result.endDate?.raw} />

          {result.program?.raw?.length > 0 && (
            <li>
              <span className="sui-result__key">{t("Program")}</span>

              <ExpandableContent
                items={
                  Array.isArray(result.program.raw)
                    ? result.program.raw
                    : [result.program.raw]
                }
                initialCount={3}
                renderItem={(program: OrgUnit, idx: number) => (
                  <span key={idx}>
                    <a href={`/programs/${program.id}`}>{program.name}</a>
                  </span>
                )}
              />
            </li>
          )}

          {result.orgUnit?.raw?.length > 0 && (
            <li>
              <span className="sui-result__key">
                {t("Organizational Unit")}
              </span>

              <ExpandableContent
                items={
                  Array.isArray(result.orgUnit.raw)
                    ? result.orgUnit.raw
                    : [result.orgUnit.raw]
                }
                initialCount={3}
                renderItem={(unit: OrgUnit, idx: number) => (
                  <span key={idx}>
                    <a href={`/organizations/${unit.id}`}>{unit.name}</a>
                  </span>
                )}
              />
            </li>
          )}

          {result.publication?.raw?.length > 0 && (
            <li>
              <span className="sui-result__key">{t("Publications")}</span>

              <ExpandableContent
                items={result.publication.raw}
                initialCount={5}
                renderItem={(publication: any) => (
                  <div key={publication?.id} className="publication-item">
                    <a href={`/publications/${publication?.id}`}>
                      {publication?.title}
                    </a>
                  </div>
                )}
              />
            </li>
          )}

          {result.brcrisId?.raw?.length > 0 && (
            <li>
              <span className="sui-result__key">{t("BrCris identifier")}</span>

              <ExpandableContent
                items={
                  Array.isArray(result.brcrisId.raw)
                    ? result.brcrisId.raw
                    : [result.brcrisId.raw]
                }
                initialCount={5}
                renderItem={(id: string, idx: number) => (
                  <span key={idx}>{id}</span>
                )}
              />
            </li>
          )}

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
        </ul>
      </div>
    </div>
  );
}
