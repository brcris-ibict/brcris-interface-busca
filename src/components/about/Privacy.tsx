/* eslint-disable @typescript-eslint/ban-ts-comment */
import type { GetStaticProps } from "next";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { useEffect, useState } from "react";

//@ts-expect-error
type Props = {
  // Add custom props here
};
export const getStaticProps: GetStaticProps<Props> = async ({ locale }) => ({
  props: {
    ...(await serverSideTranslations(locale ?? "en", [
      "about",
      "navbar",
      "common",
    ])),
  },
});

const Privacy = () => {
  const { t } = useTranslation(["about", "common"]);
  const [isMounted, setIsMounted] = useState(false); // Need this for the dangerouslySetInnerHTML
  useEffect(() => {
    setIsMounted(true);
  }, []);
  return (
    <>
      {isMounted && (
        <div
          dangerouslySetInnerHTML={{ __html: t("html:privacy policy") || "" }}
        />
      )}
    </>
  );
};
export default Privacy;
