import type { GetServerSideProps } from "next";
import Head from "next/head";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { useState, useEffect } from "react";

export const getServerSideProps: GetServerSideProps = async ({ locale }) => ({
  props: {
    ...(await serverSideTranslations(locale ?? "en", [
      "common",
      "navbar",
      "advanced",
      "facets",
      "faq",
    ])),
  },
});

export default function FaqPage() {
  const { t } = useTranslation("faq");

  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear().toString();
}, []);

const handleToggle = () => {
  if (!expanded) {
    document
      .querySelectorAll(".accordion-button.collapsed")
      .forEach((btn) => {
        (btn as HTMLElement).click();
      });
  } else {
    document
      .querySelectorAll(".accordion-button:not(.collapsed)")
      .forEach((btn) => {
        (btn as HTMLElement).click();
      });
  }
  setExpanded(!expanded);
};

  return (
    <>
      <Head>
        <title>{t("FAQ BrCris")}</title>
      </Head>

     <header>
        <div className="container py-3 d-flex align-items-center justify-content-between flex-wrap">
          <div className="flex-grow-1 text-center">
            <h1 className="h3 m-0">{t("FAQ BrCris")}</h1>
          </div>
          <div>
              <button
                type="button"
                id="btnToggle"
                onClick={handleToggle}
                className="btn btn-outline-secondary btn-sm"
              >
                {expanded ? t("Collapse all") : t("Expand all")}
              </button>
            </div>
          </div>
      </header>
      <main className="container">
        <h2 id="about" className="h4">
          1. {t("About BrCris")}
        </h2>
        <div className="accordion mb-4" id="faq-sobre">
          <div className="accordion-item">
            <h3 className="accordion-header" id="q1-h">
              <button
                className="accordion-button collapsed w-100"
                type="button"
                data-bs-toggle="collapse"
                data-bs-target="#q1"
              >
                {t("What is BrCris and why is it important?")}
              </button>
            </h3>
            <div id="q1" className="accordion-collapse collapse">
              <div className="accordion-body lh-lg">
                {t(
                  "BrCris is the Brazilian Current Research Information System, a platform developed by Ibict to gather, integrate, and provide information about scientific and technological research in Brazil. It strengthens transparency, management, and visibility of science, and supports public policies in science, technology, and innovation.",
                )}
              </div>
            </div>
          </div>

          <div className="accordion-item">
            <h3 className="accordion-header" id="q2-h">
              <button
                className="accordion-button collapsed w-100"
                type="button"
                data-bs-toggle="collapse"
                data-bs-target="#q2"
              >
                {t("Who can use BrCris?")}
              </button>
            </h3>
            <div id="q2" className="accordion-collapse collapse">
              <div className="accordion-body lh-lg">
                {t(
                  "Anyone can access it: researchers, science and technology managers, funding agencies, science journalists, and interested citizens. BrCris is free and open access.",
                )}
              </div>
            </div>
          </div>

          <div className="accordion-item">
            <h3 className="accordion-header" id="q3-h">
              <button
                className="accordion-button collapsed w-100"
                type="button"
                data-bs-toggle="collapse"
                data-bs-target="#q3"
              >
                {t("What data is available on BrCris?")}
              </button>
            </h3>
            <div id="q3" className="accordion-collapse collapse">
              <div className="accordion-body lh-lg">
                {t(
                  "BrCris integrates information about researchers, institutions, research groups, graduate programs, publications, journals, patents, and software, gathering data from sources such as Lattes Platform, CNPq Directories, Oasisbr, OpenAlex, OpenAIRE, Capes/Sucupira, DOAJ, Espacenet, INPI, NDLTD, ROR, and Wikidata.",
                )}
              </div>
            </div>
          </div>

          <div className="accordion-item">
            <h3 className="accordion-header" id="q4-h">
              <button
                className="accordion-button collapsed w-100"
                type="button"
                data-bs-toggle="collapse"
                data-bs-target="#q4"
              >
                {t("How often is BrCris data updated?")}
              </button>
            </h3>
            <div id="q4" className="accordion-collapse collapse">
              <div className="accordion-body lh-lg">
                {t(
                  "BrCris performs batch updates every six months. This happens because data is collected from multiple external sources, and the update schedule also depends on those sources. Individual changes cannot be made immediately. This process ensures consistency and standardization of information about researchers, institutions, publications, and other entities.",
                )}
              </div>
            </div>
          </div>

          <div className="accordion-item">
            <h3 className="accordion-header" id="q5-h">
              <button
                className="accordion-button collapsed w-100"
                type="button"
                data-bs-toggle="collapse"
                data-bs-target="#q5"
              >
                {t("Does BrCris have an API for data access?")}
              </button>
            </h3>
            <div id="q5" className="accordion-collapse collapse">
              <div className="accordion-body lh-lg">
                {t(
                  "Currently, BrCris API is not available for external use. The Ibict team is working to provide this feature in the future. In the meantime, queries must be made directly on the platform.",
                )}
              </div>
            </div>
          </div>
        </div>

        <h2 id="materials" className="h4 mt-4">
          2. {t("Materials and Content")}
        </h2>
        <div className="accordion mb-4" id="faq-materiais">
          <div className="accordion-item">
            <h3 className="accordion-header" id="q6-h">
              <button
                className="accordion-button collapsed w-100"
                type="button"
                data-bs-toggle="collapse"
                data-bs-target="#q6"
              >
                {t("How is material inclusion done on BrCris?")}
              </button>
            </h3>
            <div id="q6" className="accordion-collapse collapse">
              <div className="accordion-body lh-lg">
                {t(
                  "BrCris does not accept direct submissions. Materials are integrated through existing databases (such as Lattes, Sucupira, Oasisbr, among others), previously selected to be part of the platform ecosystem. No individual agreement is required for inclusion, as long as the source is integrated and data is open and available for collection. It is important to highlight that only master’s and doctoral profiles are visible on BrCris, according to the defined integration criteria.",
                )}
              </div>
            </div>
          </div>

          <div className="accordion-item">
            <h3 className="accordion-header" id="q7-h">
              <button
                className="accordion-button collapsed w-100"
                type="button"
                data-bs-toggle="collapse"
                data-bs-target="#q7"
              >
                {t("How does data removal work on BrCris?")}
              </button>
            </h3>
            <div id="q7" className="accordion-collapse collapse">
              <div className="accordion-body lh-lg">
                {t(
                  "The data displayed on BrCris comes from primary sources (such as Lattes, Oasisbr, OpenAlex, and others). Therefore, the most effective way to request deletion or correction is directly at the primary source, so the change is reflected across all platforms using that information. However, if the user wishes not to appear specifically on BrCris, they can fill out a contact form available on our page and send it to support. In this case, the removal will be executed in the next data update batch, so the record will no longer be displayed on BrCris, although it will remain available at the source.",
                )}
              </div>
            </div>
          </div>

          <div className="accordion-item">
            <h3 className="accordion-header" id="q8-h">
              <button
                className="accordion-button collapsed w-100"
                type="button"
                data-bs-toggle="collapse"
                data-bs-target="#q8"
              >
                {t("Is there any review before data is published?")}
              </button>
            </h3>
            <div id="q8" className="accordion-collapse collapse">
              <div className="accordion-body lh-lg">
                {t(
                  "BrCris does not alter the original data content. A technical process of standardization, normalization, and deduplication occurs to ensure consistency and integrity of information when integrating multiple sources.",
                )}
              </div>
            </div>
          </div>

          <div className="accordion-item">
            <h3 className="accordion-header" id="q9-h">
              <button
                className="accordion-button collapsed w-100"
                type="button"
                data-bs-toggle="collapse"
                data-bs-target="#q9"
              >
                {t("How to cite BrCris?")}
              </button>
            </h3>
            <div id="q9" className="accordion-collapse collapse">
              <div
                className="accordion-body lh-lg"
                dangerouslySetInnerHTML={{
                  __html: t(
                    "According to ABNT NBR 6023:2018, websites must be cited with the institutional author, title, location, responsible institution, year, link, and access date.<br/>Example of a citation from a BrCris page:<br/>BRAZIL. Brazilian Institute of Information in Science and Technology (IBICT). BrCris. Brasília: IBICT, 2025. Available at: <a href='https://brcris.ibict.br' target='_blank'>https://brcris.ibict.br</a>. Accessed on: Aug. 26, 2025.<br/>In addition, BrCris has scientific and institutional publications that describe its functionalities, including integration, visualization, and data export processes. These materials can also be used as references or citations, and the BrCris team can provide the official references list upon request through the support channel.",
                  ),
                }}
              />
            </div>
          </div>
        </div>

        <h2 id="problems" className="h4 mt-4">
          3. {t("Technical Issues")}
        </h2>
        <div className="accordion mb-4" id="faq-problemas">
          <div className="accordion-item">
            <h3 className="accordion-header" id="q10-h">
              <button
                className="accordion-button collapsed w-100"
                type="button"
                data-bs-toggle="collapse"
                data-bs-target="#q10"
              >
                {t("I cannot access my profile, an error message appears.")}
              </button>
            </h3>
            <div id="q10" className="accordion-collapse collapse">
              <div className="accordion-body lh-lg">
                {t(
                  "Clear the browser cache, try using an incognito tab, or another browser. If the issue persists, contact support.",
                )}
              </div>
            </div>
          </div>

          <div className="accordion-item">
            <h3 className="accordion-header" id="q11-h">
              <button
                className="accordion-button collapsed w-100"
                type="button"
                data-bs-toggle="collapse"
                data-bs-target="#q11"
              >
                {t(
                  "My profile does not appear or is incomplete. What should I do?",
                )}
              </button>
            </h3>
            <div id="q11" className="accordion-collapse collapse">
              <div className="accordion-body lh-lg">
                {t(
                  "BrCris profiles come from external databases (such as Lattes Platform and other integrated sources) and are updated in periodic batches. Therefore, immediate corrections cannot be made inside BrCris. Report issues to support with full name, CPF, and institution.",
                )}
              </div>
            </div>
          </div>

          <div className="accordion-item">
            <h3 className="accordion-header" id="q12-h">
              <button
                className="accordion-button collapsed w-100"
                type="button"
                data-bs-toggle="collapse"
                data-bs-target="#q12"
              >
                {t("Why do not all my publications appear on BrCris?")}
              </button>
            </h3>
            <div id="q12" className="accordion-collapse collapse">
              <div className="accordion-body lh-lg">
                {t(
                  "BrCris integrates information from multiple external databases (Lattes, Oasisbr, OpenAlex, etc.). Sometimes only publications from certain years appear due to source limitations or batch updates. Verify data in source databases and contact support if inconsistencies persist.",
                )}
              </div>
            </div>
          </div>
        </div>

        <h2 id="support" className="h4 mt-4">
          4. {t("Support and Contact")}
        </h2>
        <div className="accordion mb-4" id="faq-suporte">
          <div className="accordion-item">
            <h3 className="accordion-header" id="q13-h">
              <button
                className="accordion-button collapsed w-100"
                type="button"
                data-bs-toggle="collapse"
                data-bs-target="#q13"
              >
                {t("How can I contact the BrCris team?")}
              </button>
            </h3>
            <div id="q13" className="accordion-collapse collapse">
              <div
                className="accordion-body lh-lg"
                dangerouslySetInnerHTML={{
                  __html: t(
                    "Use the support available on the official page (https://brcris.ibict.br/contact). The team responds directly or forwards the request to the technical staff.",
                  ),
                }}
              />
            </div>
          </div>

          <div className="accordion-item">
            <h3 className="accordion-header" id="q14-h">
              <button
                className="accordion-button collapsed w-100"
                type="button"
                data-bs-toggle="collapse"
                data-bs-target="#q14"
              >
                {t(
                  "I need support for a BrCris-related project. Is it possible?",
                )}
              </button>
            </h3>
            <div id="q14" className="accordion-collapse collapse">
              <div className="accordion-body lh-lg">
                {t("Yes. You can send your proposal via the support channel")}{" "}
                <a
                  href="https://brcris.ibict.br/contact"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  (https://brcris.ibict.br/contact)
                </a>
                ,{" "}
                {t(
                  "and the team will evaluate it according to BrCris objectives.",
                )}
              </div>
            </div>
          </div>
        </div>

        <h2 id="privacy" className="h4 mt-4">
          5. {t("Privacy Policy")}
        </h2>
        <div className="accordion mb-4" id="faq-privacidade">
          <div className="accordion-item">
            <h3 className="accordion-header" id="q15-h">
              <button
                className="accordion-button collapsed w-100"
                type="button"
                data-bs-toggle="collapse"
                data-bs-target="#q15"
              >
                {t("Does BrCris collect personal data?")}
              </button>
            </h3>
            <div id="q15" className="accordion-collapse collapse">
              <div className="accordion-body lh-lg">
                {t(
                  "Yes. The platform integrates data from different public databases in compliance with LGPD (General Data Protection Law).",
                )}
              </div>
            </div>
          </div>

          <div className="accordion-item">
            <h3 className="accordion-header" id="q16-h">
              <button
                className="accordion-button collapsed w-100"
                type="button"
                data-bs-toggle="collapse"
                data-bs-target="#q16"
              >
                {t("How does BrCris protect my data?")}
              </button>
            </h3>
            <div id="q16" className="accordion-collapse collapse">
              <div className="accordion-body lh-lg">
                {t(
                  "Data is processed according to LGPD principles (purpose, adequacy, and necessity) and, whenever possible, anonymized.",
                )}
              </div>
            </div>
          </div>
        </div>

        <p className="text-end mt-5">
          <a href="#topo" className="btn btn-link">
            {t("Back to top")}
          </a>
        </p>
      </main>

      <footer className="border-top py-4">
        <div
          className="container small text-muted"
          dangerouslySetInnerHTML={{
            __html: `© <span id="year">2025</span> BrCris · ${t("Informative content")}. <span class="d-block d-sm-inline"> ${t("Learn more at")} <a href="https://brcris.ibict.br/" target="_blank" rel="noopener noreferrer">brcris.ibict.br</a>.</span>`,
          }}
        />
      </footer>
    </>
  );
}
