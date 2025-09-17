import Loader from '../Loader';
import { useTranslation } from 'next-i18next';
import { ErrorBoundary, useSearch } from '@elastic/react-search-ui';
import Head from 'next/head';
import ShowAuthorItem from '../customResultView/ShowAuthorItem';
import ShowItem from '../customResultView/ShowItem';
import ExpandableContent from '../ExpandableContent';
export default function JournalDetails() {
  const { wasSearched, isLoading, results } = useSearch();
  const { t } = useTranslation('common');

  return (
    <div className="">
      {isLoading && <Loader />}
      <ErrorBoundary>
        {wasSearched &&
          results &&
          results.length > 0 &&
          results.map((result, index) => (
            <div key={index}>
              <Head>
                <title>{`${result.title?.raw} | BrCris`}</title>
              </Head>
              <h1 className="title">{result.title?.raw}</h1>
              <div className="details-card">
                <ul>
                  <ShowItem label={t('Type')} value={result.type?.raw} />
                  {result.researchArea?.raw?.length > 0 && (
                    <li>
                      <span className="sui-result__key">{t('Has subject area')}</span>
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

                  <ShowAuthorItem label={t('Publisher')} authors={result.publisher?.raw} />
                  <ShowItem label={t('Is open access')} value={result.isOA?.raw} />
                  <ShowItem label={t('Is in DOAJ')} value={result.isInDoaj?.raw} />
                  <ShowItem label={t('2 year mean citedness')} value={result.googleH5?.raw} />
                  <ShowItem label={t('H index')} value={result.h_index?.raw} />
                  <ShowItem label={t('I10 index')} value={result.i10_index?.raw} />
                  <ShowItem label={t('ISSN-L')} value={result.issn_l?.raw} />
                  <ShowItem label={t('International Standard Serial Number (ISSN)')} value={result.issn?.raw} />
                  <ShowItem label={t('Qualis classification')} value={result.qualis?.raw} />
                  {result.publication?.raw?.length > 0 && (
                    <li>
                      <span className="sui-result__key">{t('Publications')}</span>
                      <ExpandableContent
                        items={result.publication?.raw}
                        initialCount={5}
                        renderItem={(publication: any) => (
                          <div className="publication-item">
                            <a href={`/publications/${publication?.id}`}>{publication?.title}</a>
                          </div>
                        )}
                      />
                    </li>
                  )}
                  <ShowItem label={t('Access type')} value={result.accessType?.raw} />
                  <ShowItem label={t('Status')} value={result.status?.raw} />
                  <ShowItem label={t('Language')} value={result.language?.raw} />
                  <ShowItem label={t('Country code')} value={result.countryCode?.raw} />
                  <ShowItem label={t('Assessment area')} value={result.assessmentArea?.raw} />
                  {result.brcrisId?.raw?.length > 0 && (
                    <li>
                      <span className="identifier-key">{t('BrCris identifier')}:</span>
                      <span className="identifier-value">
                        {result.brcrisId?.raw.map((item: string, index: number) => <div key={index}>{item}</div>)}
                      </span>
                    </li>
                  )}
                  <ShowItem label={t('Keywords')} value={result.keywords?.raw} />
                </ul>
              </div>
            </div>
          ))}
      </ErrorBoundary>
    </div>
  );
}
