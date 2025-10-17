type LattesAuthor = {
  lattesId: string;
};

/**
 * LattesLink function component.
 * Generates a link to the Lattes profile of an author with the provided lattesId.
 * Expects a single prop: lattesId of type LattesAuthor.
 * Renders an anchor element with an embedded icon for the Lattes profile link.
 */
function LattesLink({ lattesId }: LattesAuthor) {
  return (
    <a
      target="_blank"
      className="lattes-link"
      rel="noreferrer"
      href={`http://lattes.cnpq.br/${lattesId}`}
    >
      <picture>
        <img
          className="lattes-icon"
          src="/logos/lattes.png"
          alt="logo do Lattes"
        />
      </picture>
    </a>
  );
}

export default LattesLink;
