import { ErrorBoundary, useSearch } from '@elastic/react-search-ui';
import { Layers } from 'lucide-react';
import { useTranslation } from 'next-i18next';
import Head from 'next/head';
import ShowItem from '../customResultView/ShowItem';
import Loader from '../Loader';
import PopoverButton from '../PopOver';
import PersonProduction from './PersonProduction';
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
          results.map((result, index) => (
            <div className="details-content" key={index}>
              <div className="details-main">
                <Head>
                  <title>{`${result.name?.raw} | BrCris`}</title>
                </Head>
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <h1>{result.name?.raw}</h1>
                  </div>
                  <div className="d-lg-none">
                    <PopoverButton />
                  </div>
                </div>
                <h1></h1>
                <div className="d-flex flex-column flex-sm-row gap-2 mb-2">
                  <span>
                    <a href={`http://lattes.cnpq.br/${result.lattesId?.raw}`} target="_blank" rel="noopener noreferrer">
                      <img className="lattes-logo" src="/logos/lattes.png" alt="logo do Lattes" />
                      {`http://lattes.cnpq.br/${result.lattesId?.raw}`}
                    </a>
                  </span>
                  <span>
                    <a href={`https://orcid.org/${result.orcid?.raw}`} target="_blank" rel="noopener noreferrer">
                      <img className="orcid-logo" src="/logos/logo_orcid.png" alt="logo do Lattes" />
                      {`${result?.orcid?.raw[0]}`}
                    </a>
                  </span>
                </div>
                <div className="details-card">
                  <div className="overview">
                    <p>
                      He holds a Doctor and Master&apos;s degree in Informatics from the University of Brasília, with a
                      Sandwich Doctoral Internship at King&apos;s College London. He also holds a degree in Mathematics
                      (Bachelor and Licentiate) from the University of Brasília. He is Technical Coordinator of the Area
                      of Treatment, Analysis and Dissemination of Scientific Information at the Brazilian Institute of
                      Information in Science and Technology (Ibict / MCTI). He is a member and coordinates projects and
                      committees in the areas of Open Science and Data Science. He is the leader of the Brazilian
                      Scientific Research Ecosystem Laboratory and Research Group (LaEPeCBr). Areas of research
                      interest: Formal Methods, Open Digital Repositories, Scientific Data Repositories,
                      Interoperability between Open Information Systems, Open Science and Data Science.
                    </p>
                  </div>
                  <div className="research-fields">
                    <strong className="research-title">
                      {t('Research field')}
                      <Layers width={24} height={24} color="#210d41" />
                    </strong>
                    <div className="chips-container">
                      {result.researchArea?.raw?.map((researchArea: any, index: number) => (
                        <span key={index} className="chip">
                          {researchArea?.name}
                        </span>
                      ))}
                    </div>
                  </div>
                  <ul className="sui-result__details">
                    <ShowItem label={t('Nationality')} value={result.nationality?.raw} />
                    <ShowItem
                      label={t('Organization')}
                      value={result.orgunit?.raw?.map((orgunit: any, index: any) => (
                        <span key={index} className="sui-result__value">
                          <a key={orgunit.id} href={`/organizations/${orgunit?.id}`}>
                            {orgunit?.name}
                          </a>
                        </span>
                      ))}
                    />
                    <ShowItem
                      label={t('Research field')}
                      value={result.researchArea?.raw?.map((researchArea: any, index: any) => (
                        <span key={index}>{researchArea?.name}</span>
                      ))}
                    />

                    <li>
                      <span className="sui-result__key">{t('Community')}</span>
                      <span className="sui-result__value">
                        {result.community?.raw?.map((community: any, index: any) => (
                          <span key={index}>{community?.name}</span>
                        ))}
                      </span>
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
