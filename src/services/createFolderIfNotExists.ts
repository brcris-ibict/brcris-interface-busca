import fs from "fs";

export function createFolderIfNotExists(folderPath: string | undefined) {
  try {
    if (folderPath && !fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath);
      console.log(folderPath, "Diretório criado com sucesso!");
    }
  } catch (err) {
    console.error("Erro ao criar diretório:", err.message);
  }
}
