import { useSearch } from "@elastic/react-search-ui";
import Head from "next/head";
import { useTranslation } from "next-i18next";
import { useMemo } from "react";
import { CSVLink } from "react-csv";
import { getLattesIdentifier, normalizeText } from "../../../utils/Utils";
import { useLibraryInstitutions } from "../../hooks/useLibraryInstitutions";
import { usePersonIdentifiers } from "../../hooks/usePersonIdentifiers";
import { ORG_LIBRARY_TYPE } from "../../lib/orgunitSearchQuery";
import NotFound from "../../pages/404";
import CopyLink from "../CopyLink";
import ShowItem from "../customResultView/ShowItem";
import DataUpdateModal from "../DataUpdateModal";
import ExpandableContent from "../ExpandableContent";
import Loader from "../Loader";
import ReportPopoverButton from "../ReportPopoverButton";

const membersCsvHeaders = [
  { label: "Nome", key: "name" },
  { label: "IDLattes", key: "lattesId" },
  { label: "BrCrisID", key: "brcrisId" },
];

function asText(value: unknown): string {
  if (Array.isArray(value)) return String(value[0] ?? "");
  if (value == null) return "";
  return String(value);
}

function isLibraryType(typeValue: unknown): boolean {
  if (Array.isArray(typeValue)) {
    return typeValue.some((item) => String(item) === ORG_LIBRARY_TYPE);
  }
  return String(typeValue ?? "") === ORG_LIBRARY_TYPE;
}

export default function OrganizationDetails() {
  const { isLoading, results, wasSearched } = useSearch();
  const { t } = useTranslation("common");
  const result = results?.[0];

  const members = result?.member?.raw || [];
  const memberIds = members.map((m: any) => m.id);
  const { data: personData } = usePersonIdentifiers(memberIds);
  const personMap = new Map((personData || []).map((p: any) => [p.id, p]));
  const membersCsvData = members.map((member: any) => {
    const extra = personMap.get(member.id);

    return {
      name: member?.name ?? "",
      lattesId: getLattesIdentifier(extra?.lattesId),
      brcrisId: extra?.brcrisId ?? member?.id ?? "",
    };
  });

  const orgId = asText(result?.id?.raw);
  const isLibrary = isLibraryType(result?.type?.raw);
  const libraryIds = useMemo(
    () => (isLibrary && orgId ? [orgId] : []),
    [isLibrary, orgId],
  );
  const { data: institutionByLibrary } = useLibraryInstitutions(libraryIds);
  const linkedInstitution = orgId ? institutionByLibrary[orgId] : undefined;

  const relatedOrgUnits = Array.isArray(result?.relatedOrgUnit?.raw)
    ? result.relatedOrgUnit.raw
    : result?.relatedOrgUnit?.raw
      ? [result.relatedOrgUnit.raw]
      : [];

  if (isLoading || !wasSearched) {
    return <Loader />;
  }

  if (wasSearched && results.length === 0) {
    return <NotFound />;
  }
  return (
    <div key={result.id}>
      <Head>
        <title>{`${result.name?.raw} | BrCris`}</title>
      </Head>
      <div className="mb-3 position-relative">
        <div className="d-flex justify-content-between align-items-center">
          <h1 className="title mb-0">{result.name?.raw}</h1>
        </div>

        <div className="mt-2">
          {result.id?.raw && (
            <div className="d-flex justify-content-between w-100 flex-column flex-md-row gap-2 align-items-md-center">
              <div className="d-flex align-items-center gap-2">
                <img
                  className="brcris-logo"
                  src="/logos/brcris-grafo.svg"
                  alt="logo do BrCris"
                />

                <CopyLink
                  link={`${location.origin}/organizations/${result.id.raw}`}
                />
              </div>

              <div className="d-flex align-items-center gap-2">
                <DataUpdateModal />
                <ReportPopoverButton />
              </div>
            </div>
          )}
        </div>
      </div>
      <div className="details-card">
        <ul>
          {result.member?.raw?.length > 0 && (
            <li>
              <div className="d-flex justify-content-between align-items-center">
                <span className="sui-result__key">{t("Member")}</span>
                {/* @ts-ignore */}

                <CSVLink
                  data={membersCsvData}
                  headers={membersCsvHeaders}
                  filename={`membros-${result.name?.raw ?? "organizacao"}.csv`}
                  className="btn btn-primary btn-sm"
                >
                  ⬇ {t("Export csv")}
                </CSVLink>
              </div>{" "}
              <ExpandableContent
                items={[...result.member.raw].sort((a: any, b: any) =>
                  String(a?.name?.raw ?? a?.name ?? "").localeCompare(
                    String(b?.name?.raw ?? b?.name ?? ""),
                  ),
                )}
                initialCount={5}
                renderItem={(item: any, idx: number) => (
                  <div key={idx} className="member-item">
                    <a href={`/people/${item.id}`}>{item?.name}</a>
                  </div>
                )}
              />
            </li>
          )}
          <ShowItem value={result.acronym?.raw} label={t("Acronym")} />
          <ShowItem value={result.type?.raw} label={t("Type")} />
          {linkedInstitution?.name && (
            <li className="sui-result__item">
              <span className="sui-result__key">{t("Institution")}</span>
              <span className="sui-result__value">
                {linkedInstitution.id ? (
                  <a href={`/organizations/${linkedInstitution.id}`}>
                    {normalizeText(linkedInstitution.name)}
                  </a>
                ) : (
                  normalizeText(linkedInstitution.name)
                )}
              </span>
            </li>
          )}
          <ShowItem value={result.country?.raw} label={t("Country")} />
          <ShowItem value={result.state?.raw} label={t("State")} />
          <ShowItem value={result.city?.raw} label={t("City")} />
          {!isLibrary && (
            <ShowItem value={result.address?.raw} label={t("Address")} />
          )}

          {relatedOrgUnits.length > 0 && (
            <li>
              <span className="sui-result__key">{t("Libraries")}</span>
              <span>
                <ExpandableContent
                  items={[...relatedOrgUnits].sort((a: any, b: any) =>
                    String(a?.name ?? "").localeCompare(String(b?.name ?? "")),
                  )}
                  initialCount={5}
                  renderItem={(item: any) => (
                    <>
                      {item.id ? (
                        <a href={`/organizations/${item.id}`}>
                          {normalizeText(item.name)}
                        </a>
                      ) : (
                        normalizeText(item.name)
                      )}
                    </>
                  )}
                />
              </span>
            </li>
          )}

          {result.capesId?.raw?.length > 0 && (
            <li>
              <span className="identifier-key">{t("Capes identifier")}:</span>
              <span>
                <ExpandableContent
                  items={result.capesId.raw}
                  initialCount={5}
                  renderItem={(item: string) => <>{item}</>}
                />
              </span>
            </li>
          )}
          {result.program?.raw?.length > 0 && (
            <li>
              <span className="sui-result__key">{t("Program")}</span>
              <span>
                <ExpandableContent
                  items={[...result.program.raw].sort((a: any, b: any) =>
                    String(a?.name?.raw ?? a?.name ?? "").localeCompare(
                      String(b?.name?.raw ?? b?.name ?? ""),
                    ),
                  )}
                  initialCount={5}
                  renderItem={(program: any) => (
                    <>
                      {program.name && (
                        <a href={`/programs/${program.id}`}>{program.name}</a>
                      )}
                    </>
                  )}
                />
              </span>
            </li>
          )}
          {result.course?.raw?.length > 0 && (
            <li>
              <span className="sui-result__key">{t("Course")}</span>
              <span>
                <ExpandableContent
                  items={result.course.raw}
                  initialCount={5}
                  renderItem={(item: any) => (
                    <>
                      <a href={`/organizations/${item.id}`}>{item?.name}</a>
                    </>
                  )}
                />
              </span>
            </li>
          )}
          {result.publication?.raw?.length > 0 && (
            <li>
              <span className="sui-result__key">{t("Publications")}</span>
              <ExpandableContent
                items={result.publication?.raw}
                initialCount={5}
                renderItem={(publication: any, index: number) => (
                  <div key={index} className="publication-item">
                    <a href={`/publications/${publication?.id}`}>
                      {publication?.title}
                    </a>
                  </div>
                )}
              />
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}
