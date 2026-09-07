import { useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import type { ReportPeriodType, ReportScopeType } from "@rent-manager/shared";
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { downloadIncomeStatementCsv, useGetIncomeStatementQuery } from "../api/reportsApi";
import { useListPropertiesQuery } from "../api/propertiesApi";
import { useListUnitsQuery } from "../api/unitsApi";
import { useAppSelector } from "../app/hooks";
import { formatMoney } from "../utils/money";

export default function Reports() {
  const [scope, setScope] = useState<ReportScopeType>("portfolio");
  const [scopeId, setScopeId] = useState("");
  const [periodType, setPeriodType] = useState<ReportPeriodType>("monthly");
  const token = useAppSelector((state) => state.auth.token);

  const { data: properties = [] } = useListPropertiesQuery();
  const { data: units = [] } = useListUnitsQuery();

  const { data: statement, isLoading } = useGetIncomeStatementQuery({
    scope,
    periodType,
    scopeId: scope === "portfolio" ? undefined : scopeId || undefined,
  });

  const chartData = (statement?.rows ?? []).map((row) => ({
    period: row.period,
    Income: row.incomeMinor / 100,
    Net: row.netMinor / 100,
  }));

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Reports
      </Typography>

      <Stack direction="row" spacing={2} flexWrap="wrap" sx={{ mb: 2 }} alignItems="center">
        <TextField
          select
          label="Scope"
          size="small"
          value={scope}
          onChange={(e) => {
            setScope(e.target.value as ReportScopeType);
            setScopeId("");
          }}
          sx={{ width: 160 }}
        >
          <MenuItem value="portfolio">Portfolio</MenuItem>
          <MenuItem value="property">Property</MenuItem>
          <MenuItem value="unit">Unit</MenuItem>
        </TextField>

        {scope === "property" && (
          <TextField select label="Property" size="small" value={scopeId} onChange={(e) => setScopeId(e.target.value)} sx={{ width: 220 }}>
            {properties.map((p) => (
              <MenuItem key={p.id} value={p.id}>
                {p.name}
              </MenuItem>
            ))}
          </TextField>
        )}

        {scope === "unit" && (
          <TextField select label="Unit" size="small" value={scopeId} onChange={(e) => setScopeId(e.target.value)} sx={{ width: 220 }}>
            {units.map((u) => (
              <MenuItem key={u.id} value={u.id}>
                {u.label}
              </MenuItem>
            ))}
          </TextField>
        )}

        <TextField
          select
          label="Period"
          size="small"
          value={periodType}
          onChange={(e) => setPeriodType(e.target.value as ReportPeriodType)}
          sx={{ width: 140 }}
        >
          <MenuItem value="monthly">Monthly</MenuItem>
          <MenuItem value="yearly">Yearly</MenuItem>
        </TextField>

        <Button
          variant="outlined"
          onClick={() => downloadIncomeStatementCsv(token, { scope, periodType, scopeId: scopeId || undefined })}
        >
          Export CSV
        </Button>
      </Stack>

      {isLoading && <Typography>Loading…</Typography>}

      <Card variant="outlined" sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Income & net trend
          </Typography>
          <Box sx={{ width: "100%", height: 260 }}>
            <ResponsiveContainer>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="period" />
                <YAxis />
                <Tooltip formatter={(value: number) => `₹${value.toLocaleString("en-IN")}`} />
                <Legend />
                <Line type="monotone" dataKey="Income" stroke="#232323" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="Net" stroke="#16a34a" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </Box>
        </CardContent>
      </Card>

      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Period</TableCell>
            <TableCell align="right">Income</TableCell>
            <TableCell align="right">Expenses</TableCell>
            <TableCell align="right">Taxes</TableCell>
            <TableCell align="right">Net</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {(statement?.rows ?? []).map((row) => (
            <TableRow key={row.period}>
              <TableCell>{row.period}</TableCell>
              <TableCell align="right">{formatMoney(row.incomeMinor)}</TableCell>
              <TableCell align="right">{formatMoney(row.expensesMinor)}</TableCell>
              <TableCell align="right">{formatMoney(row.taxesMinor)}</TableCell>
              <TableCell align="right" sx={{ fontWeight: 600 }}>{formatMoney(row.netMinor)}</TableCell>
            </TableRow>
          ))}
          {statement && (
            <TableRow>
              <TableCell sx={{ fontWeight: 600 }}>Total</TableCell>
              <TableCell align="right" sx={{ fontWeight: 600 }}>{formatMoney(statement.totals.incomeMinor)}</TableCell>
              <TableCell align="right" sx={{ fontWeight: 600 }}>{formatMoney(statement.totals.expensesMinor)}</TableCell>
              <TableCell align="right" sx={{ fontWeight: 600 }}>{formatMoney(statement.totals.taxesMinor)}</TableCell>
              <TableCell align="right" sx={{ fontWeight: 600 }}>{formatMoney(statement.totals.netMinor)}</TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </Box>
  );
}
