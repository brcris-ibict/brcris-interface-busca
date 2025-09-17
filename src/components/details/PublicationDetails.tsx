import { ErrorBoundary, useSearch } from '@elastic/react-search-ui';
import { useTranslation } from 'next-i18next';
import Head from 'next/head';
import { OrgUnit, Service } from '../../types/Entities';
import ShowAuthorItem from '../customResultView/ShowAuthorItem';
import ShowItem from '../customResultView/ShowItem';
import Loader from '../Loader';
import ExpandableContent from '../ExpandableContent';

export default function PublicationDetails() {
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
                  <ShowAuthorItem label={t('Author')} authors={result.author?.raw} />
                  <ShowItem label={t('Year')} value={result.publicationDate?.raw} />
                  <ShowItem label={t('Type')} value={result.type?.raw} />
                  {result.orgunit === undefined &&
                  result.service === undefined &&
                  result.journal === undefined ? null : (
                    <li>
                      <span className="sui-result__key">
                        {result.type?.raw == 'doctoral thesis' || result.type?.raw == 'master thesis'
                          ? `${t('Organization')}`
                          : result.type?.raw == 'conference proceedings'
                            ? `${t('Organization')}`
                            : `${t('Journals')}`}
                      </span>
                      <span className="sui-result__value">
                        {result.orgunit?.raw.map((org: OrgUnit) => (
                          <a key={org.id} href={`/organizations/${org.id}`}>
                            {org.name!}
                          </a>
                        ))}

                        {result.service?.raw.map((service: Service) =>
                          service.title?.map((title: string) => (
                            <a key={title} href={`/serv_${service.id}`}>
                              {title}
                            </a>
                          ))
                        )}

                        {result.journal?.raw.map((journal: any, index: any) => (
                          <a key={index} href={`/journals/${journal.id}`}>
                            {journal.title ? journal.title : journal}
                          </a>
                        ))}
                      </span>
                    </li>
                  )}
                  {result.capesId?.raw?.length > 0 && (
                    <li>
                      <span className="identifier-key">{t('Capes identifier')}:</span>
                      <span className="identifier-value">
                        {result.capesId?.raw.map((item: string, index: number) => <div key={index}>{item}</div>)}
                      </span>
                    </li>
                  )}
                  {result.oasisbrId?.raw?.length > 0 && (
                    <li>
                      <span className="identifier-key">{t('Oasisbr identifier')}:</span>
                      <span className="identifier-value">
                        {result.oasisbrId?.raw.map((item: string, index: number) => <div key={index}>{item}</div>)}
                      </span>
                    </li>
                  )}
                  <ShowAuthorItem label={t('Advisor')} authors={result.advisor?.raw} />
                  <ShowAuthorItem label={t('Coadvisor')} authors={result.coadvisor?.raw} />
                  <ShowItem
                    label={t('Award sponsored by')}
                    value={result.sponsorOrgUnit?.raw.map((org: any) => (
                      <a key={org.id} href={`/organizations/${org.id}`}>
                        {org.name?.[0]}
                      </a>
                    ))}
                  />

                  {/* <ShowItem label={t('Year 2')} value={result.year?.raw} /> */}
                  <ShowItem label={t('DOI')} value={result.doi?.raw} />
                  <ShowItem label={t('OpenalexId')} value={result.openalexId?.raw} />

                  {result.researchArea?.raw?.length > 0 &&
                    result.researchArea.raw.some((researchArea: any) => researchArea?.name) && (
                      <ShowItem
                        label={t('Research field')}
                        value={result.researchArea.raw
                          .filter((researchArea: any) => researchArea?.name)
                          .map((researchArea: any, index: number) => (
                            <span key={index}>{researchArea.name}</span>
                          ))}
                      />
                    )}

                  {result.conference?.raw?.length > 0 && (
                    <ShowItem
                      label={t('Conference')}
                      value={result.conference.raw.map((conference: any, index: number) => (
                        <span key={index}>{conference.name}</span>
                      ))}
                    />
                  )}
                  {result.program?.raw?.length > 0 && (
                    <li>
                      <span className="sui-result__key">{t('Program')}</span>
                      <ExpandableContent
                        items={result.program.raw}
                        initialCount={5}
                        renderItem={(program: any, idx: number) => (
                          <div key={idx} className="programs-item">
                            <a href={`/programs/${program.id}`}>{program.name}</a>
                          </div>
                        )}
                      />
                    </li>
                  )}
                  {result.course?.raw?.length > 0 && (
                    <li>
                      <span className="sui-result__key">{t('Course')}</span>
                      <ExpandableContent
                        items={result.course?.raw}
                        initialCount={5}
                        renderItem={(item: any, idx: number) => (
                          <div key={idx} className="course-item">
                            <a href={`/organizations/${item.id}`}>{item?.name}</a>
                          </div>
                        )}
                      />
                    </li>
                  )}
                  <ShowItem label={t('Series')} value={result.series?.raw} />
                  <ShowItem label={t('Volume')} value={result.volume?.raw} />
                  <ShowItem label={t('Issue')} value={result.issue?.raw} />
                  <ShowItem label={t('Start Page')} value={result.startPage?.raw} />
                  <ShowItem label={t('End Page')} value={result.endPage?.raw} />
                  <ShowItem label={t('Has Language')} value={result.language?.raw} />
                </ul>
              </div>
            </div>
          ))}
      </ErrorBoundary>
    </div>
  );
}
