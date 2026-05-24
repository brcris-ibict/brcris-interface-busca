import { useCallback, useEffect, useMemo, useState } from "react";
import type { DisplayField } from "../../../configs/DisplayFields";
import {
  getDefaultDisplayFields,
  getDisplayFieldsConfig,
} from "../../../configs/DisplayFields";

export function useSearchDisplayFields(entityKey: string) {
  const displayFieldsConfig = getDisplayFieldsConfig(entityKey);
  const storageKey = entityKey ? `displayFields:${entityKey}` : "";

  const fixedDisplayFields = useMemo(
    () =>
      (displayFieldsConfig || [])
        .filter((field) => field.fixed)
        .map((field) => field.key),
    [displayFieldsConfig],
  );

  const mergeWithFixedFields = useCallback(
    (fields: string[]) =>
      Array.from(new Set([...fixedDisplayFields, ...fields])),
    [fixedDisplayFields],
  );

  const [displayFields, setDisplayFields] = useState<string[]>(
    mergeWithFixedFields(getDefaultDisplayFields(entityKey)),
  );

  const selectedTableColumns = useMemo(() => {
    if (!displayFieldsConfig) return [];
    const visibleFields =
      displayFields.length === 0
        ? displayFieldsConfig
        : displayFieldsConfig.filter((field) =>
            displayFields.includes(field.key),
          );

    return visibleFields.filter(
      (field) => field.key !== "title" && field.key !== "name",
    );
  }, [displayFields, displayFieldsConfig]);

  useEffect(() => {
    if (!displayFieldsConfig || !storageKey) return;
    const saved = window.localStorage.getItem(storageKey);
    if (!saved) {
      setDisplayFields(
        mergeWithFixedFields(getDefaultDisplayFields(entityKey)),
      );
      return;
    }
    try {
      const parsed = JSON.parse(saved) as string[];
      setDisplayFields(mergeWithFixedFields(parsed));
    } catch {
      setDisplayFields(
        mergeWithFixedFields(getDefaultDisplayFields(entityKey)),
      );
    }
  }, [entityKey, displayFieldsConfig, storageKey, mergeWithFixedFields]);

  useEffect(() => {
    if (!displayFieldsConfig || !storageKey) return;
    window.localStorage.setItem(storageKey, JSON.stringify(displayFields));
  }, [displayFields, displayFieldsConfig, storageKey]);

  return {
    displayFieldsConfig: displayFieldsConfig as DisplayField[] | undefined,
    displayFields,
    setDisplayFields,
    mergeWithFixedFields,
    selectedTableColumns,
  };
}
