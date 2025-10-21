import type { MemberType } from "../../types/Entities";

const Member = ({ name, image, lattes, period }: MemberType) => {
  return (
    <div className="team-member">
      <picture className="d-flex justify-content-center">
        <img src={image} alt={`foto de ${name}`} />
      </picture>
      <h2>{name}</h2>
      <a href={lattes} target="_blank" rel="noreferrer">
        CV Lattes
      </a>
      <span> {period} </span>
    </div>
  );
};

export default Member;
