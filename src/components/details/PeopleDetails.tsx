import { ErrorBoundary, useSearch } from '@elastic/react-search-ui';
import { Layers } from 'lucide-react';
import { useTranslation } from 'next-i18next';
import Head from 'next/head';
import ShowItem from '../customResultView/ShowItem';
import Loader from '../Loader';
import PopoverButton from '../PopOver';
import PersonProduction from './PersonProduction';
import ExpandableContent from '../ExpandableContent';
export default function PublicationDetails() {
  const { wasSearched, isLoading, results } = useSearch();
  const { t } = useTranslation('common');

  return (
    <>
      {isLoading && <Loader />}
      <ErrorBoundary>
        {wasSearched &&
          results &&
          results.length > 0 &&
          results?.map((result, index) => (
            <div className="details-content" key={index}>
              <div className="details-main">
                <Head>
                  <title>{`${result.name?.raw} | BrCris`}</title>
                </Head>
                <div className="d-flex justify-content-between align-items-center">
                  <div className="author-header">
                    <h1>{result.name?.raw}</h1>
                    <span className="citation-name">{`(${result.citationName?.raw[0]})`}</span>
                  </div>
                  <div className="d-lg-none">
                    <PopoverButton />
                  </div>
                </div>
                <div className="d-flex flex-column flex-sm-row gap-2 mb-2">
                  <span>
                    <a href={`http://lattes.cnpq.br/${result.lattesId?.raw}`} target="_blank" rel="noopener noreferrer">
                      <img className="lattes-logo" src="/logos/lattes.png" alt="logo do Lattes" />
                      Lattes
                    </a>
                  </span>
                  {result.orcid?.raw && (
                    <span>
                      <a href={`https://orcid.org/${result.orcid?.raw}`} target="_blank" rel="noopener noreferrer">
                        <img className="orcid-logo" src="/logos/logo_orcid.png" alt="logo do Lattes" />
                        ORCID
                      </a>
                    </span>
                  )}
                </div>
                <div className="details-card">
                  <div>
                    <ExpandableContent text={result.bio?.raw} maxLines={5} />
                  </div>
                  {result.researchArea?.raw?.length > 0 && (
                    <div className="research-fields">
                      <strong className="research-title">
                        {t('Research field')}
                        <Layers width={24} height={24} color="#210d41" />
                      </strong>
                      <div className="chips-container">
                        {result.researchArea.raw
                          .filter((area: any) => area?.name)
                          .map((researchArea: any, index: number) => (
                            <span key={index} className="chip">
                              {researchArea.name}
                            </span>
                          ))}
                      </div>
                    </div>
                  )}
                  <ul className="sui-result__details">
                    <ShowItem label={t('Nationality')} value={result.nationality?.raw} />
                    <ShowItem
                      label={t('Affiliation')}
                      value={result.affiliation?.raw?.map((orgunit: any, index: any) => (
                        <span key={index} className="sui-result__value">
                          <a key={orgunit.id} href={`/organizations/${orgunit?.id}`}>
                            {orgunit?.name}
                          </a>
                        </span>
                      ))}
                    />
                    {result.memberOf?.raw?.length > 0 && (
                      <ShowItem
                        label={t('Member of')}
                        value={result.memberOf.raw
                          .filter((item: any) => item?.name)
                          .map((item: any, index: number) => (
                            <span key={index} className="sui-result__value">
                              {item.id ? <a href={`/research-groups/${item.id}`}>{item.name}</a> : item.name}
                            </span>
                          ))}
                      />
                    )}

                    {result.leaderOf?.raw?.length > 0 && (
                      <ShowItem
                        label={t('Leader of')}
                        value={result.leaderOf.raw
                          .filter((item: any) => item?.name)
                          .map((item: any, index: number) => (
                            <span key={index} className="sui-result__value">
                              {item.id ? <a href={`/research-groups/${item.id}`}>{item.name}</a> : item.name}
                            </span>
                          ))}
                      />
                    )}
                    <li>
                      <span className="sui-result__key">{t('Publications')}</span>
                      <ExpandableContent
                        items={result.authorOf?.raw?.slice()?.sort((a: any, b: any) => {
                          const dateA = new Date(a.publicationDate?.[0] || 0).getTime();
                          const dateB = new Date(b.publicationDate?.[0] || 0).getTime();
                          return dateB - dateA;
                        })}
                        initialCount={2}
                        renderItem={(publication: any) => (
                          <div className="publication-item">
                            <a href={`/publications/${publication?.id}`}>{publication?.title}</a>
                            <div className="publication-meta">
                              {publication.publicationDate?.[0] && <span>{publication.publicationDate[0]}</span>}
                              {publication.type?.[0] && <span className="type"> - {publication.type[0]}</span>}
                            </div>
                          </div>
                        )}
                      />
                    </li>
                  </ul>
                </div>
              </div>
              <PersonProduction authorId={result.id?.raw} />
            </div>
          ))}
      </ErrorBoundary>
    </>
  );
}
