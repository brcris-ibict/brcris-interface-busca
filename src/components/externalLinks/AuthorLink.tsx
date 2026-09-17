import { normalizeText } from "../../../utils/Utils";
import { withBasePath } from "../../lib/basePath";
import type { Author } from "../../types/Entities";
import LattesLink from "./LattesLink";

function AuthorLink({ id, name, idLattes }: Author) {
  const displayName = normalizeText(
    Array.isArray(name) ? name[0] : (name ?? ""),
  );

  return (
    <>
      <a key={id} href={withBasePath(`/people/${id}`)}>
        {displayName}
      </a>
      {idLattes ? <LattesLink lattesId={idLattes!} /> : ""}
    </>
  );
}

export default AuthorLink;
