import pino from "pino";
import { createFolderIfNotExists } from "./createFolderIfNotExists";

const config = {
  level: "info",
  formatters: {
    level: (label: string) => {
      return { level: label.toUpperCase() };
    },
  },
  timestamp: () => `,"time":"${new Date(Date.now()).toLocaleString()}"`,
};

createFolderIfNotExists(process.env.LOG_FOLDER_PATH);

const fileTransport = pino.transport({
  target: "pino/file",
  options: { destination: `${process.env.LOG_FOLDER_PATH}/app.log` },
});

const logger = pino(config, fileTransport);

export default logger;
