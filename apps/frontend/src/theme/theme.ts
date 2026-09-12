import { createTheme } from "@mui/material/styles";

export const theme = createTheme({
  palette: {
    mode: "light",
    primary: { main: "#6D28D9", dark: "#5B21B6", light: "#8B7CF6" },
    secondary: { main: "#059669" },
    error: { main: "#DC2626" },
    warning: { main: "#B45309" },
    info: { main: "#2563EB" },
    background: { default: "#F5F3FF", paper: "#FFFFFF" },
    text: { primary: "#111827", secondary: "#64748B" },
  },
  shape: {
    borderRadius: 8,
  },
  typography: {
    fontFamily: "'Inter', 'Manrope', system-ui, sans-serif",
    h4: { fontWeight: 800, letterSpacing: "-0.02em" },
    h6: { fontWeight: 800, letterSpacing: "-0.01em" },
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: "none",
          fontWeight: 700,
          borderRadius: 10,
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 700,
        },
      },
    },
  },
});
