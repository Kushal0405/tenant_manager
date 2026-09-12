import AddRoundedIcon from "@mui/icons-material/AddRounded";
import ApartmentRoundedIcon from "@mui/icons-material/ApartmentRounded";
import BoltRoundedIcon from "@mui/icons-material/BoltRounded";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import MoreVertRoundedIcon from "@mui/icons-material/MoreVertRounded";
import PlaceRoundedIcon from "@mui/icons-material/PlaceRounded";
import ReceiptLongRoundedIcon from "@mui/icons-material/ReceiptLongRounded";
import RequestQuoteRoundedIcon from "@mui/icons-material/RequestQuoteRounded";
import TaskAltRoundedIcon from "@mui/icons-material/TaskAltRounded";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { ReactNode } from "react";
import { Link as RouterLink } from "react-router-dom";
import { mockPortfolioSummary, mockProperties } from "../data/mockPortfolio";

const currency = (value: number) => `₹${value.toLocaleString("en-IN")}`;

const QUICK_ACTIONS = [
  { label: "Expense", icon: <ReceiptLongRoundedIcon fontSize="small" />, color: "#E11D48", bg: "#FEF2F2" },
  { label: "Property Bill", icon: <RequestQuoteRoundedIcon fontSize="small" />, color: "#059669", bg: "#ECFDF5" },
  { label: "Settle Pending", icon: <TaskAltRoundedIcon fontSize="small" />, color: "#6D28D9", bg: "#F3EEFF" },
  { label: "Meters", icon: <BoltRoundedIcon fontSize="small" />, color: "#B45309", bg: "#FEF3C7" },
  { label: "Add Property", icon: <AddRoundedIcon fontSize="small" />, color: "#2563EB", bg: "#EFF6FF" },
];

const SUMMARY_TILES = [
  { label: "Expected Rent", value: mockPortfolioSummary.expectedRent, tone: "#6D28D9" },
  { label: "Received", value: mockPortfolioSummary.received, tone: "#059669" },
  { label: "Pending", value: mockPortfolioSummary.pending, tone: "#DC2626" },
  { label: "Bills Due", value: mockPortfolioSummary.billsDue, tone: "#6D28D9" },
];

export default function Dashboard() {
  return (
    <Box>
      <Typography variant="h4" sx={{ fontSize: 26, mb: 0.5 }}>
        Good morning, Nancy 👋
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 3, fontSize: 14 }}>
        Here&apos;s how your portfolio is doing today.
      </Typography>

      <SectionTitle>Quick actions</SectionTitle>
      <Stack direction="row" spacing={2.5} sx={{ overflowX: "auto", pb: 1, mb: 3 }}>
        {QUICK_ACTIONS.map((action) => (
          <Stack key={action.label} alignItems="center" spacing={0.75} sx={{ flexShrink: 0, width: 68 }}>
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                bgcolor: action.bg,
                color: action.color,
              }}
            >
              {action.icon}
            </Box>
            <Typography sx={{ fontSize: 10.5, fontWeight: 700, color: "text.secondary", textAlign: "center" }}>
              {action.label}
            </Typography>
          </Stack>
        ))}
      </Stack>

      <SectionTitle>Portfolio summary</SectionTitle>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr 1fr", sm: "repeat(4, 1fr)" },
          gap: 1.5,
          mb: 3,
        }}
      >
        {SUMMARY_TILES.map((tile) => (
          <Paper
            key={tile.label}
            variant="outlined"
            sx={{ borderRadius: 3, p: 1.75, borderColor: "#EDE9FE" }}
          >
            <Typography sx={{ fontSize: 18, fontWeight: 800, color: tile.tone }}>
              {currency(tile.value)}
            </Typography>
            <Typography sx={{ fontSize: 11, color: "text.secondary", fontWeight: 600, mt: 0.5 }}>
              {tile.label}
            </Typography>
          </Paper>
        ))}
      </Box>

      <SectionTitle>Your properties</SectionTitle>
      <Stack spacing={1.75}>
        {mockProperties.map((property) => (
          <Paper key={property.id} variant="outlined" sx={{ borderRadius: 3, p: 2, borderColor: "#EDE9FE" }}>
            <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1.5}>
              <Stack direction="row" spacing={1.5}>
                <Box
                  sx={{
                    width: 42,
                    height: 42,
                    borderRadius: 2.5,
                    flexShrink: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    bgcolor: property.role === "Owner" ? "#EFF6FF" : "#FEF3C7",
                    color: property.role === "Owner" ? "#2563EB" : "#B45309",
                  }}
                >
                  <ApartmentRoundedIcon fontSize="small" />
                </Box>
                <Box>
                  <Typography sx={{ fontSize: 15, fontWeight: 800 }}>{property.name}</Typography>
                  <Chip
                    label={property.role}
                    size="small"
                    sx={{
                      mt: 0.5,
                      height: 20,
                      fontSize: 9.5,
                      bgcolor: property.role === "Owner" ? "#ECFDF5" : "#EFF6FF",
                      color: property.role === "Owner" ? "#059669" : "#2563EB",
                    }}
                  />
                </Box>
              </Stack>
              <Stack direction="row" spacing={0.75} alignItems="center" flexShrink={0}>
                <Button
                  component={RouterLink}
                  to="/properties"
                  size="small"
                  endIcon={<ChevronRightRoundedIcon fontSize="small" />}
                  sx={{
                    bgcolor: "text.primary",
                    color: "#fff",
                    px: 1.25,
                    "&:hover": { bgcolor: "#000" },
                  }}
                >
                  View
                </Button>
                <Box
                  sx={{
                    width: 30,
                    height: 30,
                    borderRadius: 2,
                    border: "1px solid #EDE9FE",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "text.secondary",
                  }}
                >
                  <MoreVertRoundedIcon fontSize="small" />
                </Box>
              </Stack>
            </Stack>

            <Stack direction="row" spacing={0.5} alignItems="center" sx={{ mt: 1.5, color: "text.secondary" }}>
              <PlaceRoundedIcon sx={{ fontSize: 14 }} />
              <Typography sx={{ fontSize: 12 }}>
                {property.city}, {property.state}
              </Typography>
            </Stack>

            <Stack
              direction="row"
              spacing={1.25}
              alignItems="center"
              flexWrap="wrap"
              sx={{ mt: 1.5, bgcolor: "#FAF9FC", border: "1px solid #F1F5F9", borderRadius: 2, px: 1.5, py: 1 }}
            >
              <Box
                sx={{
                  width: 26,
                  height: 26,
                  borderRadius: "50%",
                  bgcolor: "#EFF6FF",
                  color: "#2563EB",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <ApartmentRoundedIcon sx={{ fontSize: 13 }} />
              </Box>
              <Typography sx={{ fontSize: 11.5, color: "text.secondary", fontWeight: 600 }}>Units</Typography>
              <Typography sx={{ fontSize: 14, fontWeight: 800 }}>{property.totalUnits}</Typography>
              <Chip
                label={
                  <span>
                    <b>{property.occupiedUnits}</b> Occupied
                  </span>
                }
                size="small"
                variant="outlined"
                sx={{ fontSize: 10.5, height: 22 }}
              />
              {property.totalUnits - property.occupiedUnits > 0 && (
                <Chip
                  label={`${property.totalUnits - property.occupiedUnits} To-Let`}
                  size="small"
                  variant="outlined"
                  sx={{ fontSize: 10.5, height: 22 }}
                />
              )}
            </Stack>

            {property.pendingSettlement > 0 && (
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
                sx={{ mt: 1.5, bgcolor: "#FEF2F2", border: "1px solid #FCA5A5", borderRadius: 2, px: 1.5, py: 1 }}
              >
                <Typography sx={{ fontSize: 11, fontWeight: 700, color: "#DC2626" }}>
                  Pending settlement
                </Typography>
                <Typography sx={{ fontSize: 13, fontWeight: 800, color: "#DC2626" }}>
                  {currency(property.pendingSettlement)}
                </Typography>
              </Stack>
            )}

            {property.remindersPending > 0 && (
              <Chip
                label={`${property.remindersPending} reminders pending`}
                size="small"
                sx={{ mt: 1.25, bgcolor: "#FEF3C7", color: "#B45309", fontSize: 11 }}
              />
            )}
          </Paper>
        ))}
      </Stack>
    </Box>
  );
}

function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <Typography sx={{ fontSize: 13, fontWeight: 800, mb: 1.5, mt: 0.5 }}>
      {children}
    </Typography>
  );
}
