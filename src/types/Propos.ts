import type { ResultViewProps } from "@elastic/react-search-ui-views";
import type { ChartOptions } from "chart.js";
import type { ComponentType } from "react";
import type { CustomSearchDriverOptions } from "./Entities";
export type IndicatorsProps = {
  filters?: any;
  resultSearchTerm?: any;
  isLoading?: any;
};

export interface CustomChartOptions extends ChartOptions {
  title: string; // este campo é somente para ser usado na tradução
}

export type SortOptionsType = {
  label: any;
  name: string;
  value: any[];
};

export type Index = {
  config: CustomSearchDriverOptions;
  sortOptions: SortOptionsType[];
  name: string;
  label: string;
  customView: ComponentType<ResultViewProps>;
  indicators: ComponentType<any>;
};
