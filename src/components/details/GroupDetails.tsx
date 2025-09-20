import { ErrorBoundary, useSearch } from '@elastic/react-search-ui';
import { useTranslation } from 'next-i18next';
import Head from 'next/head';
import Loader from '../Loader';
import ShowAuthorItem from '../customResultView/ShowAuthorItem';
import ShowItem from '../customResultView/ShowItem';
import { OrgUnit } from '../../types/Entities';
import ExpandableContent from '../ExpandableContent';

export default function GroupDetails() {
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
                  <ShowItem label={t('Creation year')} value={result.creationYear?.raw} />
                  <ShowItem label={t('Research line')} value={result.researchLine?.raw} />
                  <ShowAuthorItem label={t('Leader')} authors={result.leader?.raw} />
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

                  {result.partner?.raw?.length > 0 && (
                    <li>
                      <span className="sui-result__key">{t('Partner')}</span>
                      {result.partner?.raw.map((partner: any, index: any) => (
                        <span key={index} className="sui-result__value">
                          <a key={partner.id} href={`/organizations/${partner.id}`}>
                            {partner.name!}
                          </a>
                        </span>
                      ))}
                    </li>
                  )}
                  {result.brcrisId?.raw?.length > 0 && (
                    <li>
                      <span className="identifier-key">{t('BrCris identifier')}:</span>
                      <span className="identifier-value">
                        {result.brcrisId?.raw.map((item: string, index: number) => <div key={index}>{item}</div>)}
                      </span>
                    </li>
                  )}
                  <ShowItem label={t('URL')} value={result.url?.raw} urlLink={result.url?.raw} />
                  <ShowItem label={t('Status')} value={result.status?.raw} />
                  <ShowItem label={t('Application sector')} value={result.applicationSector?.raw} />
                  {result.member?.raw?.length > 0 && (
                    <li>
                      <span className="sui-result__key">{t('Has member')}</span>
                      <ExpandableContent
                        items={result.member?.raw}
                        initialCount={5}
                        renderItem={(item: any, idx: number) => (
                          <div key={idx} className="member-item">
                            <a href={`/people/${item.id}`}>{item?.name}</a>
                          </div>
                        )}
                      />
                    </li>
                  )}
                  {result.leaderResearcher?.raw?.length > 0 && (
                    <li>
                      <span className="sui-result__key">{t('Has leader')}</span>
                      <span className="sui-result__value">
                        {result.leaderResearcher.raw.map((leader: any, idx: number) => (
                          <a key={idx} href={`/people/${leader.id}`}>
                            {Array.isArray(leader.name) ? leader.name[0] : leader.name}
                          </a>
                        ))}
                      </span>
                    </li>
                  )}
                  <ShowItem label={t('Knowledge area')} value={result.knowledgeArea?.raw} />
                  <ShowItem label={t('Keywords')} value={result.keywords?.raw} />
                  <ShowItem label={t('Software')} value={result.software?.raw} />
                  <ShowItem label={t('Equipment')} value={result.equipment?.raw} />
                  <ShowItem label={t('Description')} value={result.description?.raw} />
                </ul>
              </div>
            </div>
          ))}
      </ErrorBoundary>
    </div>
  );
}
