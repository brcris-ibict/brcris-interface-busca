import { useEffect, useState } from "react";
import indexes from "../configs/Indexes";
import ElasticSearchStatsService from "../services/ElasticSearchStatsService";
import type { IndexStats } from "./api/index-stats";

export default function Home() {
  const [data, setData] = useState<IndexStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Função para buscar os dados da API
    const fetchData = async () => {
      try {
        const indexesName = indexes.map((index) => index.name);
        const result = await ElasticSearchStatsService(indexesName);
        setData(result);
      } catch (error) {
        console.error("Erro ao buscar dados:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Função para retornar a cor com base no valor de "health"
  const getHealthColor = (health: string) => {
    switch (health) {
      case "green":
        return "bg-success";
      case "yellow":
        return "bg-warning";
      case "red":
        return "bg-danger";
      default:
        return "bg-secondary";
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <div className="spinner-border text-primary">
          <span className="visually-hidden">Carregando...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mt-4">
      <div className="page-title">
        <h1 className="text-center ">Indexes</h1>
      </div>
      <div className="row">
        {data.map((item) => (
          <div key={item.index} className="col-md-6 col-lg-4 mb-4">
            <div className="card shadow-sm">
              <div className="card-header d-flex justify-content-between align-items-center">
                <h5 className="card-title mb-0 text-capitalize">
                  {indexes.find((i) => i.name === item.index)?.label}
                </h5>
                <span
                  className={`badge ${getHealthColor(item.health)} text-white`}
                >
                  {item.health}
                </span>
              </div>
              <div className="card-body">
                <p className="card-text">
                  <strong>Status:</strong> {item.status}
                </p>
                <p className="card-text">
                  <strong>Health:</strong> {item.health}
                </p>
                <p className="card-text">
                  <strong>Documents:</strong> {item["docs.count"]}
                </p>
                <p className="card-text">
                  <strong>Store size:</strong> {item["store.size"]}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
