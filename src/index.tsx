import { Provider } from "mobx-react";
import { configure } from "mobx";
import React from "react";
import { createRoot } from "react-dom/client";
import { AppComponent } from "./components/app";
import { ThemeProvider } from "@mui/material/styles";
import { createStores } from "./models/stores";
import hurricanesTheme from "./material-ui-theme";
import { defaults } from "chart.js";

import cssExports from "./components/common.scss";

// Disable mobx strict mode. Make v6 compatible with v4/v5 that was not enforcing strict mode by default.
configure({ enforceActions: "never", safeDescriptors: false });

const stores = createStores();

// Configure chart.js defaults
defaults.font.family = cssExports.robotoFontFamily;
defaults.color = cssExports.controlGray;
defaults.font.size = 14;

const container = document.getElementById("app");

if (container) {
  const root = createRoot(container);
  root.render(
    <Provider stores={stores}>
      <ThemeProvider theme={hurricanesTheme}>
        <AppComponent />
      </ThemeProvider>
    </Provider>
  );
}
