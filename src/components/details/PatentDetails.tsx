import Loader from '../Loader';
import { useTranslation } from 'next-i18next';
import { ErrorBoundary, useSearch } from '@elastic/react-search-ui';
import Head from 'next/head';
import ShowAuthorItem from '../customResultView/ShowAuthorItem';
import ShowItem from '../customResultView/ShowItem';
import { OrgUnit } from '../../types/Entities';
import ExpandableContent from '../ExpandableContent';

export default function PatentDetails() {
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
                <title>{`${result.espacenetTitle?.raw} | BrCris`}</title>
              </Head>
              <h1 className="title">{result.espacenetTitle?.raw}</h1>
              <div className="details-card">
                <ul>
                  <ShowAuthorItem label={t('Inventor(s)')} authors={result.inventor?.raw} />
                  {result.applicant === undefined ? null : (
                    <li>
                      <span className="sui-result__key">{t('Applicant')}</span>
                      {result.applicant?.raw.map((applicant: OrgUnit, index: number) => (
                        <span key={index} className="sui-result__value">
                          <a key={applicant.id} href={`/organizations${applicant.id}`}>
                            {applicant.name!}
                          </a>
                        </span>
                      ))}
                    </li>
                  )}
                  <ShowItem label={t('Deposit date')} value={result.depositDate?.raw} />
                  <ShowItem label={t('Kind Code')} value={result.kindCode?.raw} />
                  <ShowItem label={t('Country code')} value={result.countryCode?.raw} />
                  <ShowItem label={t('Lattes Title')} value={result.lattesTitle?.raw} />
                  <ShowItem label={t('Publication date')} value={result.publicationDate?.raw} />
                  <ShowItem label={t('IPC Classification')} value={result.IPCclassification?.raw} />
                  <ShowItem label={t('CPC Classification')} value={result.CPCclassification?.raw} />
                  {result.brcrisId?.raw?.length > 0 && (
                    <li>
                      <span className="sui-result__key">{t('BrCris identifier')}</span>
                      <span>
                        <ExpandableContent
                          items={Array.isArray(result.brcrisId.raw) ? result.brcrisId.raw : [result.brcrisId.raw]}
                          initialCount={5}
                          renderItem={(id: string, idx: number) => <span key={idx}>{id}</span>}
                        />
                      </span>
                    </li>
                  )}
                </ul>
              </div>
            </div>
          ))}
      </ErrorBoundary>
    </div>
  );
}
