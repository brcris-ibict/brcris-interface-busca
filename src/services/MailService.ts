const proxy = async (body: string) => {
  const response = await fetch("/api/mail", {
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
