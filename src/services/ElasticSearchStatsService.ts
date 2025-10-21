import indexes from "../configs/Indexes";

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
          console.log("buscando remoto");
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
  const response = await fetch(`/api/index-stats?indexesName=${indexesName}`);
  return response.json();
};

export default proxy;
