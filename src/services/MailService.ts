import { withBasePath } from "../lib/basePath";

const proxy = async (body: string) => {
  const response = await fetch(withBasePath("/api/mail"), {
    method: "POST",
    headers: {
      Accept: "application/json, text/plain, */*",
      "Content-Type": "application/json",
    },
    body: body,
  });
  return response;
};

export default proxy;
