import { useEffect, useRef } from "react";
import * as echarts from "echarts";
import type { ECharts, EChartsOption } from "echarts";

// Props do componente
type Props = {
  option: EChartsOption;
  height?: number;
  renderer?: "canvas" | "svg";
  onChartReady?: (chart: ECharts | null) => void;
};

export default function EChart({
  option,
  height = 360,
  renderer = "svg",
  onChartReady,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const onReadyRef = useRef(onChartReady);
  onReadyRef.current = onChartReady;
  const optionRef = useRef(option);
  optionRef.current = option;

  // Responsável por inicializar o gráfico (recria se o renderer mudar)
  useEffect(() => {
    if (!ref.current) return;

    const chart = echarts.init(ref.current, undefined, { renderer });
    chart.setOption(optionRef.current, true);
    onReadyRef.current?.(chart);

    const onResize = () => chart.resize();
    window.addEventListener("resize", onResize); // Adiciona o evento de resize para o gráfico

    return () => {
      window.removeEventListener("resize", onResize);
      onReadyRef.current?.(null);
      chart.dispose();
    };
  }, [renderer]);

  // Responsável por atualizar o gráfico quando o option mudar
  useEffect(() => {
    if (!ref.current) return;
    const chart = echarts.getInstanceByDom(ref.current);
    chart?.setOption(option, true);

  }, [option]);

  return <div ref={ref} style={{ width: "100%", height }} />;
}
