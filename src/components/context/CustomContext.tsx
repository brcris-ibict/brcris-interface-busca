import { createContext, type PropsWithChildren, useState } from "react";
import type { IndicatorType } from "../../types/Entities";

interface CustomContextProps {
  indicators: IndicatorType[][];
  setIndicatorsData: (data: Array<IndicatorType[]>) => void;
  isEmpty: () => boolean;
  showAdvanced: boolean;
  setShowAdvanced: (show: boolean | ((prev: boolean) => boolean)) => void;
}

const CustomContext = createContext<CustomContextProps>(
  {} as CustomContextProps,
);
export default CustomContext;

export function CustomProvider(props: PropsWithChildren<object>) {
  const [indicators, setIndicators] = useState<Array<IndicatorType[]>>(
    [] as Array<IndicatorType[]>,
  );
  const [showAdvanced, setShowAdvanced] = useState(false);

  function setIndicatorsData(data: Array<IndicatorType[]>) {
    setIndicators(data);
  }

  function isEmpty(): boolean {
    return (
      indicators?.length < 1 ||
      indicators[0] == null ||
      indicators[0].length < 1
    );
  }

  return (
    <CustomContext.Provider
      value={{
        indicators,
        setIndicatorsData,
        isEmpty,
        showAdvanced,
        setShowAdvanced,
      }}
    >
      {props.children}
    </CustomContext.Provider>
  );
}
