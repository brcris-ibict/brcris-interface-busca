import Loader from '../Loader';
import { useTranslation } from 'next-i18next';
import { ErrorBoundary, useSearch } from '@elastic/react-search-ui';
import Head from 'next/head';
import ShowItem from '../customResultView/ShowItem';
import ExpandableContent from '../ExpandableContent';
export default function OrganizationDetails() {
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
                  <ShowItem value={result.acronym?.raw} label={t('Acronym')} />
                  <ShowItem value={result.country?.raw} label={t('Country')} />
                  <ShowItem value={result.state?.raw} label={t('State')} />
                  <ShowItem value={result.city?.raw} label={t('City')} />
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
                   {result.program?.raw?.length > 0 && (
                      <li>
                    <span className="sui-result__key">{t('Program')}</span>
                    <span >
                      <ExpandableContent
                        items={result.program.raw}
                        initialCount={5}
                        renderItem={(program: any, idx: number) => (
                        <>{program.name && <a href={`/programs/${program.id}`}>{program.name}</a>}</>
                        )}
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
                  {result.publication?.raw?.length > 0 && (
                    <li>
                      <span className="sui-result__key">{t('Publications')}</span>
                      <ExpandableContent
                        items={result.publication?.raw}
                        initialCount={5}
                        renderItem={(publication: any, index: number) => (
                          <div key={index} className="publication-item">
                            <a href={`/publications/${publication?.id}`}>{publication?.title}</a>
                          </div>
                        )}
                      />
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
