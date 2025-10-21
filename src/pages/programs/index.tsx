import { SearchProvider } from "@elastic/react-search-ui";
import type { GetServerSideProps } from "next";
import Head from "next/head";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { CustomProvider } from "../../components/context/CustomContext";
import Search from "../../components/Search";
import Programs from "../../configs/Programs";

export const getServerSideProps: GetServerSideProps = async ({ locale }) => ({
  props: {
    ...(await serverSideTranslations(locale ?? "en", [
      "common",
      "navbar",
      "advanced",
      "facets",
    ])),
  },
});

export default function App() {
  const { t } = useTranslation("common");
  return (
    <div>
      <Head>
        <title>{`${t("Programs")} | BrCris`}</title>
      </Head>
      <div className="page-search">
        <CustomProvider>
          <SearchProvider config={Programs.config}>
            <Search index={Programs} />
          </SearchProvider>
        </CustomProvider>
      </div>
    </div>
  );
}
