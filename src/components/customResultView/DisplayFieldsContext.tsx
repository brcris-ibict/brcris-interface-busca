import { createContext, useCallback, useContext } from "react";

export type DisplayFieldsContextValue = {
  selectedFields: string[];
};

const DisplayFieldsContext = createContext<DisplayFieldsContextValue>({
  selectedFields: [],
});

export const useDisplayFields = () => useContext(DisplayFieldsContext);

export const useDisplayFieldVisibility = () => {
  const { selectedFields } = useDisplayFields();

  return useCallback(
    (fieldKey: string) =>
      selectedFields.length === 0 || selectedFields.includes(fieldKey),
    [selectedFields],
  );
};

export const DisplayFieldsProvider = DisplayFieldsContext.Provider;
