import type { ChartOptions } from "chart.js";

export class OptionsPie implements ChartOptions<"pie"> {
  title: string;

  responsive = true;
  plugins: ChartOptions<"pie">["plugins"] = {
    legend: {
      position: "bottom",
      display: true,
    },
    title: {
      display: true,
      text: "",
    },
  };

  constructor(title: string) {
    this.title = title;
    if (this.plugins?.title) {
      this.plugins.title.text = title;
    }
  }
}

export class OptionsBar implements ChartOptions<"bar"> {
  title: string;

  responsive = true;
  aspectRatio = 1;

  parsing = {
    xAxisKey: "key",
    yAxisKey: "doc_count",
  };

  plugins: ChartOptions<"bar">["plugins"] = {
    legend: {
      position: "bottom",
      display: true,
    },
    title: {
      display: true,
      text: "",
    },
  };

  scales: ChartOptions<"bar">["scales"] = {
    x: {
      ticks: {
        display: true,
      },
      stacked: true,
    },
    y: {
      stacked: true,
    },
  };

  constructor(title: string, xlabelsDisplay = true) {
    this.title = title;

    if (this.plugins?.title) {
      this.plugins.title.text = title;
    }

    if (this.scales?.x?.ticks) {
      this.scales.x.ticks.display = xlabelsDisplay;
    }
  }
}
