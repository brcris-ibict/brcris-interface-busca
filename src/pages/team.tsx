/* eslint-disable @typescript-eslint/ban-ts-comment */
import type { GetStaticProps } from "next";
import Head from "next/head";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { useEffect, useState } from "react";
import currentMembersData from "../../team/current.json";
import egressMembersData from "../../team/egress.json";
import Member from "../components/team/Member";
import type { MemberType } from "../types/Entities";

type Props = {};

export const getStaticProps: GetStaticProps<Props> = async ({ locale }) => ({
  props: {
    ...(await serverSideTranslations(locale ?? "en", ["navbar", "common"])),
  },
});

const shuffle = (array: MemberType[]) => {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
};

export default function Team() {
  const { t } = useTranslation(["common"]);

  const [currentMembers, setCurrentMembers] = useState<MemberType[]>([]);
  const [egressMembers, setEgessMembers] = useState<MemberType[]>([]);

  useEffect(() => {
    const currentMembersDataStr = JSON.stringify(currentMembersData);
    setCurrentMembers(JSON.parse(currentMembersDataStr));
    const egressMembersDataStr = JSON.stringify(egressMembersData);
    setEgessMembers(JSON.parse(egressMembersDataStr));
  }, []);

  return (
    <>
      <Head>
        <title>{`BrCris - ${t("Team")}`}</title>
      </Head>
      <div className="App">
        <div className="container page tablist d-flex align-content-center flex-column">
          <div className="page-title">
            <h1>{t("Team")}</h1>
          </div>
          <ul
            className="nav nav-tabs d-flex justify-content-center"
            id="teamTab"
          >
            <li className="nav-item" role="presentation">
              <button
                className="nav-link active"
                id="current-tab"
                data-bs-toggle="tab"
                data-bs-target="#current"
                type="button"
                role="tab"
                aria-controls="current"
                aria-selected="true"
              >
                {t("Current")}
              </button>
            </li>
            <li className="nav-item" role="presentation">
              <button
                className="nav-link"
                id="egress-tab"
                data-bs-toggle="tab"
                data-bs-target="#egress"
                type="button"
                role="tab"
                aria-controls="egress"
                aria-selected="false"
              >
                {t("Egress")}
              </button>
            </li>
          </ul>

          <div className="tab-content">
            <div
              className="tab-pane active"
              id="current"
              role="tabpanel"
              aria-labelledby="current-tab"
            >
              <div className="team">
                {shuffle(currentMembers).map((member: MemberType) => (
                  <Member
                    key={member.lattes}
                    image={member.image}
                    name={member.name}
                    lattes={member.lattes}
                    period={member.period}
                  />
                ))}
              </div>
            </div>
            <div
              className="tab-pane"
              id="egress"
              role="tabpanel"
              aria-labelledby="egress-tab"
            >
              <div className="team">
                {shuffle(egressMembers).map((member: MemberType) => (
                  <Member
                    key={member.lattes}
                    image={member.image}
                    name={member.name}
                    lattes={member.lattes}
                    period={member.period}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
