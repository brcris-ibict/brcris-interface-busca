import { createContext, useContext } from "react";

export type DisplayFieldsContextValue = {
  selectedFields: string[];
};

const DisplayFieldsContext = createContext<DisplayFieldsContextValue>({
  selectedFields: [],
});

export const useDisplayFields = () => useContext(DisplayFieldsContext);

export const DisplayFieldsProvider = DisplayFieldsContext.Provider;
