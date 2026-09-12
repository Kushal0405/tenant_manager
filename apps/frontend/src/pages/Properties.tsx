import AddRoundedIcon from "@mui/icons-material/AddRounded";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useMemo, useState } from "react";
import { mockProperties } from "../data/mockPortfolio";

const currency = (value: number) => `₹${value.toLocaleString("en-IN")}`;

type Filter = "all" | "occupied" | "vacant";

export default function Properties() {
  const [filter, setFilter] = useState<Filter>("all");

  const occupiedCount = mockProperties.filter((p) => p.occupiedUnits > 0).length;
  const vacantCount = mockProperties.filter((p) => p.occupiedUnits === 0).length;

  const filtered = useMemo(() => {
    if (filter === "occupied") return mockProperties.filter((p) => p.occupiedUnits > 0);
    if (filter === "vacant") return mockProperties.filter((p) => p.occupiedUnits === 0);
    return mockProperties;
  }, [filter]);

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Typography variant="h4" sx={{ fontSize: 24 }}>
          My Properties
        </Typography>
        <Button variant="contained" startIcon={<AddRoundedIcon />} sx={{ bgcolor: "primary.main" }}>
          Add Property
        </Button>
      </Stack>

      <Stack direction="row" spacing={1} sx={{ mb: 2.5, flexWrap: "wrap" }}>
        <FilterPill label={`All (${mockProperties.length})`} active={filter === "all"} onClick={() => setFilter("all")} />
        <FilterPill label={`Occupied (${occupiedCount})`} active={filter === "occupied"} onClick={() => setFilter("occupied")} />
        <FilterPill label={`Vacant (${vacantCount})`} active={filter === "vacant"} onClick={() => setFilter("vacant")} />
      </Stack>

      <Stack spacing={1.5}>
        {filtered.map((property) => (
          <Paper
            key={property.id}
            variant="outlined"
            sx={{
              borderRadius: 3,
              p: 1.5,
              borderColor: "#EDE9FE",
              display: "flex",
              alignItems: "center",
              gap: 1.5,
              cursor: "pointer",
              "&:hover": { borderColor: "primary.main" },
            }}
          >
            <Box
              sx={{
                width: 56,
                height: 56,
                borderRadius: 2.5,
                flexShrink: 0,
                background: property.gradient,
              }}
            />
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Typography sx={{ fontSize: 14.5, fontWeight: 800 }} noWrap>
                {property.name}
              </Typography>
              <Typography sx={{ fontSize: 12, color: "text.secondary" }}>{property.city}</Typography>
              {property.occupiedUnits > 0 ? (
                <>
                  <Typography sx={{ fontSize: 11.5, color: "text.secondary", mt: 0.25 }}>
                    {property.floors} Floors · {property.totalUnits} Units
                  </Typography>
                  <Typography sx={{ fontSize: 13, fontWeight: 700, color: "secondary.main", mt: 0.5 }}>
                    {currency(property.monthlyRent)} / month
                  </Typography>
                </>
              ) : (
                <Typography sx={{ fontSize: 11.5, color: "error.main", fontWeight: 700, mt: 0.25 }}>
                  Vacant property
                </Typography>
              )}
            </Box>
            <ChevronRightRoundedIcon sx={{ color: "text.secondary", flexShrink: 0 }} />
          </Paper>
        ))}
      </Stack>
    </Box>
  );
}

function FilterPill({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <Chip
      label={label}
      onClick={onClick}
      variant={active ? "filled" : "outlined"}
      sx={{
        fontSize: 12,
        bgcolor: active ? "#EDE9FE" : "transparent",
        color: active ? "primary.dark" : "text.secondary",
        borderColor: active ? "primary.main" : "#E2E8F0",
      }}
    />
  );
}
