import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useMemo, useState } from "react";
import { mockLessees } from "../data/mockPortfolio";

const currency = (value: number) => `₹${value.toLocaleString("en-IN")}`;

type Filter = "all" | "active" | "vacated";

export default function Tenants() {
  const [filter, setFilter] = useState<Filter>("all");

  const activeCount = mockLessees.filter((l) => l.status === "active").length;
  const vacatedCount = mockLessees.filter((l) => l.status === "vacated").length;

  const filtered = useMemo(() => {
    if (filter === "active") return mockLessees.filter((l) => l.status === "active");
    if (filter === "vacated") return mockLessees.filter((l) => l.status === "vacated");
    return mockLessees;
  }, [filter]);

  return (
    <Box>
      <Typography variant="h4" sx={{ fontSize: 24, mb: 2 }}>
        Tenants
      </Typography>

      <Stack direction="row" spacing={1} sx={{ mb: 2.5, flexWrap: "wrap" }}>
        <FilterPill label={`All (${mockLessees.length})`} active={filter === "all"} onClick={() => setFilter("all")} />
        <FilterPill label={`Active (${activeCount})`} active={filter === "active"} onClick={() => setFilter("active")} />
        <FilterPill label={`Vacated (${vacatedCount})`} active={filter === "vacated"} onClick={() => setFilter("vacated")} />
      </Stack>

      <Stack spacing={1.5}>
        {filtered.map((lessee) => (
          <Paper
            key={lessee.id}
            variant="outlined"
            sx={{ borderRadius: 3, p: 1.5, borderColor: "#EDE9FE", display: "flex", alignItems: "center", gap: 1.5 }}
          >
            <Avatar sx={{ background: lessee.avatarGradient, width: 44, height: 44, fontWeight: 800, fontSize: 15 }}>
              {lessee.initials}
            </Avatar>
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Typography sx={{ fontSize: 14, fontWeight: 800 }} noWrap>
                {lessee.name}
              </Typography>
              <Typography sx={{ fontSize: 11.5, color: "text.secondary", mb: 0.5 }} noWrap>
                {lessee.propertyName} · {lessee.unitLabel}
              </Typography>
              <Chip
                label={lessee.status === "active" ? "Active" : "Vacated"}
                size="small"
                sx={{
                  height: 20,
                  fontSize: 9.5,
                  bgcolor: lessee.status === "active" ? "#ECFDF5" : "#F1F5F9",
                  color: lessee.status === "active" ? "#059669" : "#64748B",
                }}
              />
            </Box>
            <Box sx={{ textAlign: "right", flexShrink: 0 }}>
              <Typography sx={{ fontSize: 13, fontWeight: 800 }}>
                {lessee.monthlyRent ? currency(lessee.monthlyRent) : "—"}
              </Typography>
              <Typography sx={{ fontSize: 10, color: "text.secondary", mt: 0.25 }}>
                {lessee.monthlyRent ? "per month" : "moved out"}
              </Typography>
            </Box>
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
