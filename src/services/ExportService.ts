import type { QueryDslQueryContainer } from "@elastic/elasticsearch/lib/api/types";

class ExportService {
  async search(
    index: string,
    query: QueryDslQueryContainer,
    resultFields: string[],
    totalResults: number,
    indexName: string,
    typeArq: string,
    email?: string,
    captcha?: string,
  ) {
    const body = JSON.stringify({
      query,
      index,
      resultFields,
      totalResults,
      indexName,
      typeArq,
      email,
      captcha,
    });
    const response = await fetch("/api/export", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: body,
    });
    return response;
  }
}
export default ExportService;
