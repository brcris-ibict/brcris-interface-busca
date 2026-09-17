import indexes from "../configs/Indexes";
import { withBasePath } from "../lib/basePath";

export function getIndexStats(
  indexLabel: string,
  setDocsCount: (count: string) => void,
) {
  const indexCount = localStorage.getItem(indexLabel);
  if (indexCount) {
    setDocsCount(indexCount);
  } else {
    const index = indexes.find((item) => item.label === indexLabel);
    if (index) {
      proxy(index?.name)
        .then((res) => {
          const count = res["docs.count"];
          localStorage.setItem(indexLabel, count);
          setDocsCount(count);
        })
        .catch((err) => {
          console.error(err);
        });
    }
  }
}

const proxy = async (indexesName: string | string[]) => {
  const response = await fetch(
    withBasePath(`/api/index-stats?indexesName=${indexesName}`),
  );
  return response.json();
};

export default proxy;
