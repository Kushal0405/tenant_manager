import { createTheme } from "@mui/material/styles";

/**
 * Design tokens mirrored from the standalone tenant-manager frontend
 * (shadcn/ui "new-york" style, neutral base). We stay on MUI here — this only
 * re-skins MUI so the two apps read as the same product: a near-black primary,
 * a slate-grey scale, a 10px corner radius, hairline borders, and compact type.
 */

const slate = {
  50: "#f8fafc",
  100: "#f1f5f9",
  200: "#e2e8f0",
  300: "#cbd5e1",
  400: "#94a3b8",
  500: "#64748b",
  600: "#475569",
  700: "#334155",
  800: "#1e293b",
  900: "#0f172a",
};

// oklch(0.205 0 0) — the reference's near-black primary, as sRGB hex.
const ink = "#232323";
const RADIUS = 10;

export const theme = createTheme({
  palette: {
    mode: "light",
    primary: { main: ink, contrastText: "#fafafa" },
    secondary: { main: "#15803d" },
    error: { main: "#dc2626" },
    warning: { main: "#d97706" },
    success: { main: "#16a34a" },
    info: { main: slate[500] },
    background: {
      default: slate[50],
      paper: "#ffffff",
    },
    text: {
      primary: slate[900],
      secondary: slate[500],
    },
    divider: slate[200],
    grey: slate,
  },
  shape: {
    borderRadius: RADIUS,
  },
  typography: {
    fontFamily:
      '"Inter", system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    h4: { fontSize: "1.5rem", fontWeight: 600, letterSpacing: "-0.02em" },
    h5: { fontSize: "1.25rem", fontWeight: 600, letterSpacing: "-0.02em" },
    h6: { fontSize: "0.95rem", fontWeight: 600, letterSpacing: "-0.01em" },
    subtitle2: { fontWeight: 600, letterSpacing: "-0.01em" },
    body2: { fontSize: "0.85rem" },
    caption: { fontSize: "0.75rem", color: slate[500] },
    button: { textTransform: "none", fontWeight: 500, letterSpacing: 0 },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: { backgroundColor: slate[50], color: slate[900] },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: { backgroundImage: "none" },
        outlined: { borderColor: slate[200] },
      },
    },
    MuiCard: {
      defaultProps: { variant: "outlined" },
      styleOverrides: {
        root: {
          borderColor: slate[200],
          borderRadius: RADIUS,
          boxShadow: "0 1px 2px 0 rgba(15, 23, 42, 0.04)",
        },
      },
    },
    MuiCardContent: {
      styleOverrides: {
        root: { "&:last-child": { paddingBottom: 20 } },
      },
    },
    MuiAppBar: {
      defaultProps: { elevation: 0, color: "inherit" },
      styleOverrides: {
        root: {
          backgroundColor: "rgba(255,255,255,0.8)",
          backdropFilter: "blur(8px)",
          color: slate[900],
          borderBottom: `1px solid ${slate[200]}`,
        },
      },
    },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: { borderRadius: RADIUS, paddingInline: 14 },
        sizeSmall: { paddingInline: 10 },
        contained: {
          boxShadow: "none",
          "&:hover": { boxShadow: "none", backgroundColor: "#000000" },
        },
        outlined: {
          borderColor: slate[300],
          color: slate[700],
          "&:hover": { borderColor: slate[400], backgroundColor: slate[50] },
        },
        text: { color: slate[600], "&:hover": { backgroundColor: slate[100] } },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { borderRadius: 6, fontWeight: 500, fontSize: "0.72rem" },
        sizeSmall: { height: 20 },
        colorDefault: {
          backgroundColor: slate[100],
          color: slate[600],
        },
        outlined: { borderColor: slate[300] },
      },
    },
    MuiTextField: {
      defaultProps: { size: "small" },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: RADIUS,
          "& .MuiOutlinedInput-notchedOutline": { borderColor: slate[300] },
          "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: slate[400] },
        },
      },
    },
    MuiTable: {
      styleOverrides: { root: { "--TableCell-borderColor": slate[200] } },
    },
    MuiTableCell: {
      styleOverrides: {
        root: { borderColor: slate[200] },
        head: {
          fontSize: "0.72rem",
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: "0.04em",
          color: slate[500],
          backgroundColor: slate[50],
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: { "&:hover": { backgroundColor: slate[50] } },
      },
    },
    MuiTabs: {
      styleOverrides: {
        root: { minHeight: 40, borderBottom: `1px solid ${slate[200]}` },
        indicator: { backgroundColor: ink, height: 2 },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          minHeight: 40,
          textTransform: "none",
          fontWeight: 500,
          fontSize: "0.85rem",
          color: slate[500],
          "&.Mui-selected": { color: slate[900], fontWeight: 600 },
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 14,
          border: `1px solid ${slate[200]}`,
          boxShadow: "0 20px 40px rgba(15, 23, 42, 0.12)",
        },
      },
    },
    MuiDialogTitle: {
      styleOverrides: {
        root: { fontSize: "1.05rem", fontWeight: 600, letterSpacing: "-0.01em" },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: { borderRadius: RADIUS },
        standardInfo: { backgroundColor: slate[100], color: slate[700] },
      },
    },
    MuiDivider: {
      styleOverrides: { root: { borderColor: slate[200] } },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: slate[900],
          borderRadius: 6,
          fontSize: "0.72rem",
        },
      },
    },
  },
});

export const sidebarTokens = {
  width: 248,
  bg: "#ffffff",
  border: slate[200],
  itemActiveBg: slate[100],
  itemActiveText: slate[900],
  itemText: slate[500],
  itemHoverBg: slate[50],
};
