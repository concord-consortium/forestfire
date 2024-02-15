import { TooltipItem } from "chart.js";

// Set fixed with so both total carbon and vegetation graphs have the same Y axis width.
export const Y_AXIS_WIDTH = 60; // px

export const tooltipTitle = (context: TooltipItem<"line" | "bar">[]) => {
  const label = context[0].label;
  return "Year: " + label; // Prefixing with "Year"
};
