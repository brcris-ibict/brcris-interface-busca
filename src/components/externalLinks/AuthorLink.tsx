import type { Author } from "../../types/Entities";
import LattesLink from "./LattesLink";

function AuthorLink({ id, name, idLattes }: Author) {
  return (
    <>
      <a key={id} href={`/people/${id}`}>
        {name}
      </a>
      {idLattes ? <LattesLink lattesId={idLattes!} /> : ""}
    </>
  );
}

export default AuthorLink;
