import { useState } from "react";
import ApartmentRoundedIcon from "@mui/icons-material/ApartmentRounded";
import BarChartRoundedIcon from "@mui/icons-material/BarChartRounded";
import DashboardRoundedIcon from "@mui/icons-material/DashboardRounded";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import PaymentsRoundedIcon from "@mui/icons-material/PaymentsRounded";
import PeopleAltRoundedIcon from "@mui/icons-material/PeopleAltRounded";
import ReceiptLongRoundedIcon from "@mui/icons-material/ReceiptLongRounded";
import UnfoldMoreRoundedIcon from "@mui/icons-material/UnfoldMoreRounded";
import ViewSidebarRoundedIcon from "@mui/icons-material/ViewSidebarRounded";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";
import Drawer from "@mui/material/Drawer";
import IconButton from "@mui/material/IconButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../app/hooks";
import { logout } from "../features/auth/authSlice";
import { sidebarTokens } from "../theme/theme";

const SIDEBAR_WIDTH = 256;
const SIDEBAR_WIDTH_ICON = 60;
const HEADER_HEIGHT = 56;

const NAV_ITEMS = [
  { to: "/dashboard", label: "Dashboard", icon: <DashboardRoundedIcon /> },
  { to: "/properties", label: "Properties", icon: <ApartmentRoundedIcon /> },
  { to: "/tenants", label: "Tenants", icon: <PeopleAltRoundedIcon /> },
  { to: "/billing", label: "Billing", icon: <ReceiptLongRoundedIcon /> },
  { to: "/expenses", label: "Expenses", icon: <PaymentsRoundedIcon /> },
  { to: "/reports", label: "Reports", icon: <BarChartRoundedIcon /> },
];

function BrandCard({ collapsed }: { collapsed: boolean }) {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1.25,
        m: 1,
        p: 1,
        borderRadius: 2.5,
        border: `1px solid ${sidebarTokens.border}`,
        bgcolor: "#fff",
        boxShadow: "0 1px 2px 0 rgba(15,23,42,0.04)",
        overflow: "hidden",
      }}
    >
      <Box
        sx={{
          flexShrink: 0,
          width: 36,
          height: 36,
          borderRadius: 2,
          background: "linear-gradient(135deg, #334155 0%, #0f172a 100%)",
          color: "#fff",
          display: "grid",
          placeItems: "center",
          fontSize: 16,
          fontWeight: 700,
        }}
      >
        R
      </Box>
      {!collapsed && (
        <Box sx={{ minWidth: 0 }}>
          <Typography
            noWrap
            sx={{ fontWeight: 700, fontSize: "0.875rem", letterSpacing: "-0.01em", lineHeight: 1.2 }}
          >
            Rent Manager
          </Typography>
          <Typography
            noWrap
            sx={{ fontSize: "0.6875rem", fontWeight: 600, color: "primary.main", opacity: 0.6, mt: 0.25 }}
          >
            Property portfolio
          </Typography>
        </Box>
      )}
    </Box>
  );
}

function UserCard({
  collapsed,
  name,
  email,
  onLogout,
}: {
  collapsed: boolean;
  name?: string;
  email?: string;
  onLogout: () => void;
}) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const initials = (name ?? "U").slice(0, 2).toUpperCase();

  return (
    <Box sx={{ m: 1 }}>
      <Box
        component="button"
        onClick={(e) => setAnchorEl(e.currentTarget)}
        sx={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          gap: 1.25,
          p: 1,
          borderRadius: 2.5,
          border: `1px solid ${sidebarTokens.border}`,
          bgcolor: "#fff",
          cursor: "pointer",
          font: "inherit",
          textAlign: "left",
          transition: "background-color .15s",
          "&:hover": { bgcolor: sidebarTokens.itemHoverBg },
        }}
      >
        <Avatar
          sx={{
            width: 32,
            height: 32,
            borderRadius: 2,
            fontSize: "0.75rem",
            fontWeight: 700,
            bgcolor: "grey.100",
            color: "grey.700",
          }}
        >
          {initials}
        </Avatar>
        {!collapsed && (
          <>
            <Box sx={{ minWidth: 0, flexGrow: 1 }}>
              <Typography noWrap sx={{ fontWeight: 700, fontSize: "0.8125rem", letterSpacing: "-0.01em" }}>
                {name ?? "Account"}
              </Typography>
              <Typography noWrap sx={{ fontSize: "0.6875rem", color: "text.secondary", mt: 0.25 }}>
                {email ?? ""}
              </Typography>
            </Box>
            <UnfoldMoreRoundedIcon sx={{ fontSize: 16, color: "grey.400", flexShrink: 0 }} />
          </>
        )}
      </Box>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
        transformOrigin={{ vertical: "bottom", horizontal: "left" }}
        slotProps={{ paper: { sx: { minWidth: 200, borderRadius: 2.5, border: `1px solid ${sidebarTokens.border}` } } }}
      >
        <MenuItem
          onClick={() => {
            setAnchorEl(null);
            onLogout();
          }}
          sx={{ fontSize: "0.8125rem", fontWeight: 500, color: "error.main", borderRadius: 1.5, mx: 0.5 }}
        >
          <ListItemIcon sx={{ color: "error.main" }}>
            <LogoutRoundedIcon fontSize="small" />
          </ListItemIcon>
          Sign out
        </MenuItem>
      </Menu>
    </Box>
  );
}

function SidebarBody({
  collapsed,
  user,
  onLogout,
  onNavigate,
}: {
  collapsed: boolean;
  user: { name?: string; email?: string } | null;
  onLogout: () => void;
  onNavigate?: () => void;
}) {
  return (
    <Box
      sx={{
        width: collapsed ? SIDEBAR_WIDTH_ICON : SIDEBAR_WIDTH,
        height: "100%",
        bgcolor: sidebarTokens.bg,
        borderRight: `1px solid ${sidebarTokens.border}`,
        display: "flex",
        flexDirection: "column",
        transition: "width .2s ease",
        overflow: "hidden",
      }}
    >
      <BrandCard collapsed={collapsed} />
      <Divider sx={{ mx: 1 }} />

      <Box component="nav" sx={{ px: 1, py: 1.5, flexGrow: 1, overflowY: "auto" }}>
        {NAV_ITEMS.map((item) => {
          const link = (
            <Box
              key={item.to}
              component={NavLink}
              to={item.to}
              onClick={onNavigate}
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1.25,
                height: 34,
                px: collapsed ? 0 : 1.25,
                justifyContent: collapsed ? "center" : "flex-start",
                mb: 0.25,
                borderRadius: 2,
                fontSize: "0.8125rem",
                fontWeight: 500,
                textDecoration: "none",
                color: sidebarTokens.itemText,
                transition: "background-color .15s, color .15s",
                "& svg": { fontSize: 18 },
                "&:hover": { bgcolor: sidebarTokens.itemHoverBg, color: sidebarTokens.itemActiveText },
                "&.active": {
                  bgcolor: sidebarTokens.itemActiveBg,
                  color: sidebarTokens.itemActiveText,
                  fontWeight: 600,
                },
              }}
            >
              {item.icon}
              {!collapsed && <span>{item.label}</span>}
            </Box>
          );
          return collapsed ? (
            <Tooltip key={item.to} title={item.label} placement="right">
              {link}
            </Tooltip>
          ) : (
            link
          );
        })}
      </Box>

      <Divider sx={{ mx: 1 }} />
      <UserCard collapsed={collapsed} name={user?.name} email={user?.email} onLogout={onLogout} />
    </Box>
  );
}

export default function Layout() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up("md"));
  const user = useAppSelector((state) => state.auth.user);
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  function handleLogout() {
    dispatch(logout());
    navigate("/login");
  }

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "background.default" }}>
      {isDesktop ? (
        <Box sx={{ flexShrink: 0 }}>
          <SidebarBody collapsed={collapsed} user={user} onLogout={handleLogout} />
        </Box>
      ) : (
        <Drawer
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          PaperProps={{ sx: { border: "none", width: SIDEBAR_WIDTH } }}
        >
          <SidebarBody
            collapsed={false}
            user={user}
            onLogout={handleLogout}
            onNavigate={() => setMobileOpen(false)}
          />
        </Drawer>
      )}

      <Box sx={{ flexGrow: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
        <Box
          component="header"
          sx={{
            position: "sticky",
            top: 0,
            zIndex: 10,
            height: HEADER_HEIGHT,
            display: "flex",
            alignItems: "center",
            gap: 0.5,
            px: { xs: 1.5, md: 2 },
            bgcolor: "rgba(255,255,255,0.8)",
            backdropFilter: "blur(8px)",
            borderBottom: `1px solid ${sidebarTokens.border}`,
          }}
        >
          <IconButton
            size="small"
            onClick={() =>
              isDesktop ? setCollapsed((c) => !c) : setMobileOpen(true)
            }
            sx={{ color: "text.secondary" }}
          >
            <ViewSidebarRoundedIcon fontSize="small" />
          </IconButton>
          <Divider orientation="vertical" flexItem sx={{ my: 1.75, mx: 0.5 }} />
          <Box sx={{ flexGrow: 1 }} />
          {user && (
            <Typography variant="body2" sx={{ color: "text.secondary" }}>
              {user.name}
            </Typography>
          )}
        </Box>

        <Box
          component="main"
          sx={{ flexGrow: 1, p: { xs: 2, md: 3 }, maxWidth: 1200, width: "100%", mx: "auto" }}
        >
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}
