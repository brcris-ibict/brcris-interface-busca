import { useEffect, useRef } from "react";
import * as echarts from "echarts";
import type { ECharts, EChartsOption } from "echarts";

// Props do componente
type Props = {
  option: EChartsOption;
  height?: number;
  onChartReady?: (chart: ECharts | null) => void;
};

export default function EChart({
  option,
  height = 360,
  onChartReady,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const onReadyRef = useRef(onChartReady);
  onReadyRef.current = onChartReady;

  // Responsável por inicializar o gráfico
  useEffect(() => {
    if (!ref.current) return;

    const chart = echarts.init(ref.current);
    onReadyRef.current?.(chart);

    const onResize = () => chart.resize();
    window.addEventListener("resize", onResize); // Adiciona o evento de resize para o gráfico

    return () => {
      window.removeEventListener("resize", onResize);
      onReadyRef.current?.(null);
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
