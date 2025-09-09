import Loader from '../Loader';
import { useTranslation } from 'next-i18next';
import { ErrorBoundary, useSearch } from '@elastic/react-search-ui';
import Head from 'next/head';
import ShowItem from '../customResultView/ShowItem';
import PersonProduction from './PersonProduction';
export default function PoppleDetails() {
  const { wasSearched, isLoading, results } = useSearch();
  const { t } = useTranslation('common');

  return (
    <>
      {isLoading && <Loader />}
      <ErrorBoundary>
        {wasSearched &&
          results &&
          results.length > 0 &&
          results.map((result, index) => (
            <div className="details-content" key={index}>
              <div className="details-main">
                <Head>
                  <title>{`${result.name?.raw} | BrCris`}</title>
                </Head>
                <h1>{result.name?.raw}</h1>
                <div>
                  <p style={{ margin: '0' }}>
                    <a href={`http://lattes.cnpq.br/${result.lattesId.raw!}`} target="_blank" rel="noopener noreferrer">
                      <img className="lattes-icon" src="/logos/lattes.png" alt="logo do Lattes" />
                      {`http://lattes.cnpq.br/${result.lattesId.raw!}`}
                    </a>
                  </p>
                  <p style={{ margin: '0' }}>
                    <a href={`https://orcid.org/${result.orcid.raw!}`} target="_blank" rel="noopener noreferrer">
                      <img className="orcid-icon" src="/logos/logo_orcid.svg" alt="logo do Lattes" />
                      {`${result.orcid.raw[0]}`}
                    </a>
                  </p>
                </div>

                <div className="research-fields">
                  <h3>{t('Research field')}</h3>
                  <div className="chips-container">
                    {result.researchArea?.raw.map((researchArea: any, index: number) => (
                      <span key={index} className="chip">
                        {researchArea.name}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="sui-result__body">
                  <ul className="sui-result__details">
                    <div className="info-card">
                      <ShowItem label={t('Nationality')} value={result.nationality?.raw} />
                    </div>
                    <div className="info-card">
                      <ShowItem
                        label={t('Organization')}
                        value={result.orgunit?.raw.map((orgunit: any, index: any) => (
                          <span key={index} className="sui-result__value">
                            <a key={orgunit.id} href={`/organizations/${orgunit.id}`}>
                              {orgunit.name!}
                            </a>
                          </span>
                        ))}
                      />
                    </div>
                    <div className="info-card">
                      <ShowItem
                        label={t('Research field')}
                        value={result.researchArea?.raw.map((researchArea: any, index: any) => (
                          <span key={index}>{researchArea.name}</span>
                        ))}
                      />
                    </div>

                    <div className="info-card">
                      <li>
                        <span className="sui-result__key">{t('Community')}</span>
                        <span className="sui-result__value">
                          {result.community?.raw.map((community: any, index: any) => (
                            <span key={index}>{community.name}</span>
                          ))}
                        </span>
                      </li>
                    </div>
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
