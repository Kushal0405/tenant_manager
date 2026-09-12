import ArrowDownwardRoundedIcon from "@mui/icons-material/ArrowDownwardRounded";
import ArrowUpwardRoundedIcon from "@mui/icons-material/ArrowUpwardRounded";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useMemo, useState } from "react";
import { mockTransactions } from "../data/mockPortfolio";

const currency = (value: number) => `₹${value.toLocaleString("en-IN")}`;

type Filter = "all" | "credit" | "debit";

export default function Billing() {
  const [filter, setFilter] = useState<Filter>("all");

  const credits = mockTransactions.filter((t) => t.type === "credit").reduce((sum, t) => sum + t.amount, 0);
  const debits = mockTransactions.filter((t) => t.type === "debit").reduce((sum, t) => sum + t.amount, 0);

  const filtered = useMemo(() => {
    if (filter === "credit") return mockTransactions.filter((t) => t.type === "credit");
    if (filter === "debit") return mockTransactions.filter((t) => t.type === "debit");
    return mockTransactions;
  }, [filter]);

  return (
    <Box>
      <Typography variant="h4" sx={{ fontSize: 24, mb: 2 }}>
        Billing
      </Typography>

      <Box sx={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 1.5, mb: 2.5 }}>
        <Paper variant="outlined" sx={{ borderRadius: 3, p: 1.5, borderColor: "#EDE9FE" }}>
          <Typography sx={{ fontSize: 15, fontWeight: 800, color: "secondary.main" }}>{currency(credits)}</Typography>
          <Typography sx={{ fontSize: 10, color: "text.secondary", fontWeight: 700, mt: 0.5, textTransform: "uppercase" }}>
            Credits
          </Typography>
        </Paper>
        <Paper variant="outlined" sx={{ borderRadius: 3, p: 1.5, borderColor: "#EDE9FE" }}>
          <Typography sx={{ fontSize: 15, fontWeight: 800, color: "error.main" }}>{currency(debits)}</Typography>
          <Typography sx={{ fontSize: 10, color: "text.secondary", fontWeight: 700, mt: 0.5, textTransform: "uppercase" }}>
            Debits
          </Typography>
        </Paper>
        <Paper variant="outlined" sx={{ borderRadius: 3, p: 1.5, borderColor: "#EDE9FE" }}>
          <Typography sx={{ fontSize: 15, fontWeight: 800 }}>{mockTransactions.length}</Typography>
          <Typography sx={{ fontSize: 10, color: "text.secondary", fontWeight: 700, mt: 0.5, textTransform: "uppercase" }}>
            Records
          </Typography>
        </Paper>
      </Box>

      <Stack direction="row" spacing={1} sx={{ mb: 2.5, flexWrap: "wrap" }}>
        <FilterPill label="All" active={filter === "all"} onClick={() => setFilter("all")} />
        <FilterPill label="Credits" active={filter === "credit"} onClick={() => setFilter("credit")} />
        <FilterPill label="Debits" active={filter === "debit"} onClick={() => setFilter("debit")} />
      </Stack>

      <Typography sx={{ fontSize: 13, fontWeight: 800, mb: 1.5 }}>Recent entries</Typography>
      <Stack spacing={1.25}>
        {filtered.map((tx) => (
          <Paper
            key={tx.id}
            variant="outlined"
            sx={{ borderRadius: 3, p: 1.5, borderColor: "#EDE9FE", display: "flex", alignItems: "center", gap: 1.5 }}
          >
            <Box
              sx={{
                width: 38,
                height: 38,
                borderRadius: 2.5,
                flexShrink: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                bgcolor: tx.type === "credit" ? "#ECFDF5" : "#FEF2F2",
                color: tx.type === "credit" ? "#059669" : "#DC2626",
              }}
            >
              {tx.type === "credit" ? (
                <ArrowUpwardRoundedIcon fontSize="small" />
              ) : (
                <ArrowDownwardRoundedIcon fontSize="small" />
              )}
            </Box>
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Typography sx={{ fontSize: 13, fontWeight: 700 }} noWrap>
                {tx.title}
              </Typography>
              <Typography sx={{ fontSize: 11, color: "text.secondary" }} noWrap>
                {tx.meta}
              </Typography>
            </Box>
            <Box sx={{ textAlign: "right", flexShrink: 0 }}>
              <Typography sx={{ fontSize: 13.5, fontWeight: 800, color: tx.type === "credit" ? "secondary.main" : "error.main" }}>
                {tx.type === "credit" ? "+" : "−"}
                {currency(tx.amount)}
              </Typography>
              <Typography sx={{ fontSize: 10, color: "text.secondary", mt: 0.25 }}>
                {tx.type === "credit" ? "Collection" : "Expense"}
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
