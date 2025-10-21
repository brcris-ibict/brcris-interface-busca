type PublicationProps = {
  authors: string;
  title: string;
  link: string;
  journal: string;
};

export default function Publication({
  authors,
  title,
  link,
  journal,
}: PublicationProps) {
  return (
    <>
      <p>
        {authors}{" "}
        <a href={link} target="_blank" rel="noreferrer">
          {title}
        </a>{" "}
        {journal}
      </p>
    </>
  );
}
