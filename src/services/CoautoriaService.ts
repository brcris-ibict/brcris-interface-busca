const coautoriaService = {
  async get(authorId: string) {
    const response = await fetch(`/api/coautoria?authorId=${authorId}`);
    return response.json();
  },
};

export default coautoriaService;
