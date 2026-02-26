import { ErrorBoundary, useSearch } from "@elastic/react-search-ui";
import Head from "next/head";
import { useTranslation } from "next-i18next";
import { CSVLink } from "react-csv";
import { formatBooleanString } from "../../../utils/Utils";
import ShowAuthorItem from "../customResultView/ShowAuthorItem";
import ShowItem from "../customResultView/ShowItem";
import ExpandableContent from "../ExpandableContent";
import Loader from "../Loader";
import PopoverButton from "../PopOver";

const journalCsvHeaders = [
  { label: "Título", key: "title" },
  { label: "ID", key: "id" },
];
export default function JournalDetails() {
  const { wasSearched, isLoading, results } = useSearch();
  const { t } = useTranslation("common");

  const formattedPublicationsForCsv =
    results?.[0]?.publication?.raw?.map((publication: any) => ({
      title: publication?.title ?? "",
      id: publication?.id ?? "",
    })) ?? [];
  return (
    <div className="">
      {isLoading && <Loader />}
      <ErrorBoundary>
        {wasSearched &&
          results &&
          results.length > 0 &&
          results.map((result) => (
            <div key={result.id}>
              <Head>
                <title>{`${result.title?.raw} | BrCris`}</title>
              </Head>
              <div className="d-flex justify-content-between align-items-center mb-3 position-relative">
                <h1 className="title mb-0">{result.title?.raw}</h1>
                <PopoverButton />
              </div>
              <div className="details-card">
                <ul>
                  <ShowItem label={t("Type")} value={result.type?.raw} />
                  {result.researchArea?.raw?.length > 0 && (
                    <li>
                      <span className="sui-result__key">
                        {t("Has subject area")}
                      </span>
                      <ExpandableContent
                        items={result.researchArea?.raw}
                        initialCount={5}
                        renderItem={(area: any, idx: number) => (
                          <div key={idx} className="research-area-item">
                            {area?.name}
                          </div>
                        )}
                      />
                    </li>
                  )}
                  <ShowAuthorItem
                    label={t("Publisher")}
                    authors={result.publisher?.raw}
                  />
                  <ShowItem
                    label={t("Is open access")}
                    value={formatBooleanString(result.isOA?.raw[0], t)}
                  />
                  <ShowItem
                    label={t("Is in DOAJ")}
                    value={formatBooleanString(result.isInDoaj?.raw[0], t)}
                  />
                  <ShowItem
                    label={t("2 year mean citedness")}
                    value={result.googleH5?.raw}
                  />
                  <ShowItem label={t("H index")} value={result.h_index?.raw} />
                  <ShowItem
                    label={t("I10 index")}
                    value={result.i10_index?.raw}
                  />
                  <ShowItem label={t("ISSN-L")} value={result.issn_l?.raw} />
                  {result.issn?.raw?.length > 0 && (
                    <li>
                      <span className="sui-result__key">
                        {t("International Standard Serial Number (ISSN)")}
                      </span>
                      <span>
                        <ExpandableContent
                          items={
                            Array.isArray(result.issn.raw)
                              ? result.issn.raw
                              : [result.issn.raw]
                          }
                          initialCount={5}
                          renderItem={(issn: string, idx: number) => {
                            const url = `https://portal.issn.org/resource/ISSN/${issn}`;
                            return (
                              <div key={idx}>
                                <a
                                  href={url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="break-url"
                                >
                                  {url}
                                </a>
                              </div>
                            );
                          }}
                        />
                      </span>
                    </li>
                  )}

                  <ShowItem
                    label={t("Qualis classification")}
                    value={result.qualis?.raw}
                  />
                  {result.publication?.raw?.length > 0 && (
                    <li>
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <span className="sui-result__key">
                          {t("Publications")} ({result.publication.raw.length})
                        </span>

                        {/* @ts-ignore */}
                        <CSVLink
                          data={formattedPublicationsForCsv}
                          headers={journalCsvHeaders}
                          filename={`publicacoes-${result.title?.raw ?? "journal"}.csv`}
                          className="btn btn-primary btn-sm"
                        >
                          ⬇ {t("Export csv")}
                        </CSVLink>
                      </div>

                      <ExpandableContent
                        items={result.publication?.raw}
                        initialCount={5}
                        renderItem={(publication: any) => (
                          <div className="publication-item">
                            <a href={`/publications/${publication?.id}`}>
                              {publication?.title}
                            </a>
                          </div>
                        )}
                      />
                    </li>
                  )}
                  <ShowItem
                    label={t("Access type")}
                    value={result.accessType?.raw}
                  />
                  <ShowItem label={t("Status")} value={result.status?.raw} />
                  <ShowItem
                    label={t("Language")}
                    value={result.language?.raw}
                  />
                  <ShowItem
                    label={t("Country code")}
                    value={result.countryCode?.raw}
                  />
                  <ShowItem
                    label={t("Assessment area")}
                    value={result.assessmentArea?.raw}
                  />
                  {result.brcrisId?.raw?.length > 0 && (
                    <li>
                      <span className="sui-result__key">
                        {t("BrCris identifier")}
                      </span>
                      <span>
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
                      </span>
                    </li>
                  )}
                  <ShowItem
                    label={t("Keywords")}
                    value={result.keywords?.raw}
                  />
                </ul>
              </div>
            </div>
          ))}
      </ErrorBoundary>
    </div>
  );
}
