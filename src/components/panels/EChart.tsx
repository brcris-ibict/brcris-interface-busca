import { useEffect, useRef } from "react";
import * as echarts from "echarts";
import type { EChartsOption } from "echarts";

// Props do componente
type Props = {
  option: EChartsOption;
  height?: number;
};

// Responsável por renderizar o gráfico com o echarts
export default function EChart({ option, height = 360 }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  // Responsável por inicializar o gráfico
  useEffect(() => {
    if (!ref.current) return;

    const chart = echarts.init(ref.current);
    const onResize = () => chart.resize();
    window.addEventListener("resize", onResize); // Adiciona o evento de resize para o gráfico

    return () => {
      window.removeEventListener("resize", onResize);
      chart.dispose();
    };
  }, []);

  // Responsável por atualizar o gráfico quando o option mudar
  useEffect(() => {
    if (!ref.current) return;
    const chart = echarts.getInstanceByDom(ref.current);
    chart?.setOption(option, true);

  }, [option]);

  return <div ref={ref} style={{ width: "100%", height }} />;
}
