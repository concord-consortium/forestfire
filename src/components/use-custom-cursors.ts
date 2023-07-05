import { useStores } from "../use-stores";
import sparkCursorImg from "../assets/interactions/spark-cursor.png";
import { Interaction } from "../models/ui";
import { useEffect } from "react";
import { mainContentId } from "../types";

const interactionCursors: {[key in Interaction]?: string} = {
  [Interaction.PlaceSpark]: `url(${sparkCursorImg}) 32 64, crosshair`,
  [Interaction.HoverOverDraggable]: "grab",
};

export const useCustomCursor = () => {
  const { ui } = useStores();

  useEffect(() => {
    const element = document.getElementById(mainContentId);
    if (!element) {
      return;
    }
    if (ui.dragging) {
      element.style.cursor = "move";
      return;
    }
    if (ui.interaction && interactionCursors[ui.interaction]) {
      element.style.cursor = interactionCursors[ui.interaction] as string;
      return;
    }
    element.style.cursor = "default";
  }, [ui.interaction, ui.dragging]);
};
