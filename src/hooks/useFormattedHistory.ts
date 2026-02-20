import { useMemo } from "react";
import { formatColor, type ColorFormat } from "../shared/color";

const MAX_HISTORY_ITEMS = 10;

/**
 * Custom hook to format color history items based on the selected format
 * Memoizes the result to avoid unnecessary recalculations
 */
export const useFormattedHistory = (
  history: ColorHistoryItem[],
  colorFormat: ColorFormat
) => {
  return useMemo(() => {
    return history.slice(0, MAX_HISTORY_ITEMS).map((item) => ({
      ...item,
      formatted: formatColor(item.hex, colorFormat),
    }));
  }, [history, colorFormat]);
};
