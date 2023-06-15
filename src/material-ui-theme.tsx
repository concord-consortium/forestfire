import { createTheme, ThemeOptions } from "@mui/material/styles";

const options: ThemeOptions = {
  palette: {
    primary: {
      main: "#aaa"
    },
    secondary: {
      main: "#ff9900"
    }
  },
  shape: {
    borderRadius: 0
  },
  typography: {
    fontFamily: "Lato, Arial, sans-serif",
    button: {
      textTransform: "none",
      fontSize: "14px",
      fontWeight: "bold"
    }
  },
  components: {
    MuiButtonBase: {
      defaultProps: {
        disableRipple: true,
        disableTouchRipple: true,
        focusRipple: false
      }
    },
    MuiRadio: {
      defaultProps: {
        disableRipple: true,
      }
    },
    MuiButton: {
      styleOverrides: {
        root: {
          "&:hover": {
            backgroundColor: "#dfdfdf",
          },
          "&:disabled": {
            color: "inherit",
            opacity: 0.35
          }
        },
        text: {
          color: "#434343",
          padding: 0,
        }
      },
    }
  }
};
export default createTheme(options);
