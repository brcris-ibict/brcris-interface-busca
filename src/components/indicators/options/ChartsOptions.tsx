export class OptionsPie {
  title: string;
  responsive = true;
  plugins = {
    legend: {
      position: "bottom",
      display: true,
    },
    title: {
      display: true,
      text: "", // 'Research groups by Research line',
    },
  };
  constructor(title: string) {
    this.title = title;
    this.plugins.title.text = title;
  }
}

export class OptionsBar {
  title: string;
  responsive = true;
  aspectRatio = 1;
  parsing = {
    xAxisKey: "key",
    yAxisKey: "doc_count",
  };
  plugins = {
    legend: {
      position: "bottom",
      display: false,
    },
    title: {
      display: true,
      text: "",
    },
  };
  scales = {
    x: {
      ticks: {
        display: true,
      },
    },
  };

  constructor(title: string, xlabelsDisplay = true) {
    this.title = title;
    this.plugins.title.text = title;
    this.scales.x.ticks.display = xlabelsDisplay;
  }
}
