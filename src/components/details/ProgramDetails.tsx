import { ErrorBoundary, useSearch } from '@elastic/react-search-ui';
import { useTranslation } from 'next-i18next';
import Head from 'next/head';
import ShowItem from '../customResultView/ShowItem';
import Loader from '../Loader';
import { OrgUnit } from '../../types/Entities';
import ExpandableContent from '../ExpandableContent';
export default function ProgramDetails() {
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
                <title>{`${result.name?.raw} | BrCris`}</title>
              </Head>
              <h1 className="title">{result.name?.raw}</h1>
              <div className="details-card">
                <ul>
                  {result.orgUnit?.raw?.length > 0 && (
                    <li>
                      <span className="sui-result__key">{t('Organization')}</span>
                      <span className="sui-result__value">
                        {result.orgUnit?.raw.map((org: OrgUnit) => (
                          <a key={org.id} href={`/organizations/${org.id}`}>
                            {org.name!}
                          </a>
                        ))}
                      </span>
                    </li>
                  )}
                  <ShowItem
                    label={t('Research field')}
                    value={result.researchArea?.raw.map((researchArea: any, index: any) => (
                      <span key={index}>{researchArea.name}</span>
                    ))}
                  />
                  <ShowItem label={t('Evaluation area')} value={result.evaluationArea?.raw} />
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
                  {result.capesId?.raw?.length > 0 && (
                    <li>
                    <span className="identifier-key">{t('Capes identifier')}:</span>
                    <span>
                      <ExpandableContent
                        items={result.capesId.raw}
                        initialCount={5}
                        renderItem={(item: string) => <>{item}</>}
                      />
                    </span>
                  </li>
                )}
                 {result.course?.raw?.length > 0 && (
                    <li>
                    <span className="sui-result__key">{t('Course')}</span>
                    <span>
                      <ExpandableContent
                        items={result.course.raw}
                        initialCount={5}
                        renderItem={(item: any, idx: number) => (
                          <>
                            <a href={`/organizations/${item.id}`}>{item?.name}</a>
                          </>
                        )}
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
