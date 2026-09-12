import ApartmentRoundedIcon from "@mui/icons-material/ApartmentRounded";
import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import { NavLink, Outlet } from "react-router-dom";

const NAV_ITEMS = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/properties", label: "Properties" },
  { to: "/tenants", label: "Tenants" },
  { to: "/billing", label: "Billing" },
  { to: "/expenses", label: "Expenses" },
  { to: "/reports", label: "Reports" },
];

export default function Layout() {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh", bgcolor: "background.default" }}>
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          bgcolor: "background.paper",
          color: "text.primary",
          borderBottom: "1px solid",
          borderColor: "#EDE9FE",
        }}
      >
        <Toolbar sx={{ gap: 1.5, py: 1 }}>
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: "10px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "linear-gradient(135deg,#8B7CF6,#6D28D9)",
              color: "#fff",
              flexShrink: 0,
            }}
          >
            <ApartmentRoundedIcon fontSize="small" />
          </Box>
          <Typography variant="h6" sx={{ flexGrow: 1, fontSize: 17 }}>
            Property Rent Manager
          </Typography>
          <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
            {NAV_ITEMS.map((item) => (
              <Box
                key={item.to}
                component={NavLink}
                to={item.to}
                sx={{
                  textDecoration: "none",
                  color: "text.secondary",
                  fontWeight: 700,
                  fontSize: 13.5,
                  px: 1.75,
                  py: 0.75,
                  borderRadius: "999px",
                  "&.active": {
                    color: "primary.dark",
                    bgcolor: "#EDE9FE",
                  },
                  "&:hover": { bgcolor: "#F3EEFF" },
                }}
              >
                {item.label}
              </Box>
            ))}
          </Box>
        </Toolbar>
      </AppBar>
      <Box component="main" sx={{ flexGrow: 1, p: { xs: 2, sm: 3 }, maxWidth: 1180, width: "100%", mx: "auto" }}>
        <Outlet />
      </Box>
    </Box>
  );
}
