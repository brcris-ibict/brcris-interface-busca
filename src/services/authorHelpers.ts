// services/authorHelpers.ts
import { withBasePath } from "../lib/basePath";

export async function fetchAuthorData(authorId: string) {
  try {
    const [coauthRes, adviseRes] = await Promise.all([
      fetch(withBasePath(`/api/coautoria?authorId=${authorId}`)),
      fetch(withBasePath(`/api/orientacoes?advisorId=${authorId}`)),
    ]);

    const coauthData: any = await coauthRes.json();
    const adviseData: any = await adviseRes.json();

    const coauthors = coauthData.coAuthors || [];
    const advisees = adviseData.advisees || [];

    return {
      coauthors,
      advisees,
      hasCoauthors: coauthors.length > 0,
      hasAdvisees: advisees.length > 0,
      name: coauthData.name || adviseData.name || "",
    };
  } catch (err) {
    console.error("Error fetching author data:", err);

    return {
      coauthors: [],
      advisees: [],
      hasCoauthors: false,
      hasAdvisees: false,
      name: "",
    };
  }
}
