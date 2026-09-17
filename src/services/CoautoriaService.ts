import { withBasePath } from "../lib/basePath";

const coautoriaService = {
  async get(authorId: string) {
    const response = await fetch(
      withBasePath(`/api/coautoria?authorId=${authorId}`),
    );
    return response.json();
  },
};

export default coautoriaService;
