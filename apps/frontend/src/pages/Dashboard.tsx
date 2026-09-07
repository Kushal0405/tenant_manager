import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Grid from "@mui/material/Grid";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";
import { useNavigate } from "react-router-dom";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useGetDashboardSummaryQuery, useGetIncomeStatementQuery } from "../api/reportsApi";
import { formatMoney } from "../utils/money";

function StatCard({ label, value, valueColor }: { label: string; value: string; valueColor?: string }) {
  return (
    <Card variant="outlined">
      <CardContent>
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ textTransform: "uppercase", letterSpacing: "0.04em", fontWeight: 600 }}
        >
          {label}
        </Typography>
        <Typography variant="h5" color={valueColor} sx={{ mt: 0.5 }}>
          {value}
        </Typography>
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  const { data: summary } = useGetDashboardSummaryQuery();
  const { data: incomeStatement } = useGetIncomeStatementQuery({ scope: "portfolio", periodType: "monthly" });
  const navigate = useNavigate();

  const chartData = (incomeStatement?.rows ?? []).slice(-6).map((row) => ({
    period: row.period,
    Income: row.incomeMinor / 100,
    Expenses: (row.expensesMinor + row.taxesMinor) / 100,
    Net: row.netMinor / 100,
  }));

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard label="Collected this month" value={formatMoney(summary?.collectedThisMonthMinor ?? 0)} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            label="Outstanding dues"
            value={formatMoney(summary?.outstandingDuesMinor ?? 0)}
            valueColor={summary && summary.outstandingDuesMinor > 0 ? "error.main" : undefined}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard label="Occupancy" value={`${summary?.occupancyPct ?? 0}%`} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard label="Overdue tenants" value={`${summary?.overdueTenants.length ?? 0}`} valueColor={summary?.overdueTenants.length ? "error.main" : undefined} />
        </Grid>
      </Grid>

      <Grid container spacing={2}>
        <Grid item xs={12} md={7}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Income vs. outflow (last 6 months)
              </Typography>
              <Box sx={{ width: "100%", height: 280 }}>
                <ResponsiveContainer>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="period" />
                    <YAxis />
                    <Tooltip formatter={(value: number) => `₹${value.toLocaleString("en-IN")}`} />
                    <Legend />
                    <Bar dataKey="Income" fill="#232323" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Expenses" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={5}>
          <Card variant="outlined" sx={{ height: "100%" }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Upcoming renewals
              </Typography>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Tenant</TableCell>
                    <TableCell>Unit</TableCell>
                    <TableCell align="right">Days left</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(summary?.upcomingRenewals ?? []).map((r) => (
                    <TableRow key={r.leaseId} hover sx={{ cursor: "pointer" }} onClick={() => navigate(`/leases/${r.leaseId}`)}>
                      <TableCell>{r.tenantName}</TableCell>
                      <TableCell>
                        {r.unitLabel} ({r.propertyName})
                      </TableCell>
                      <TableCell align="right">{r.daysUntilEnd}</TableCell>
                    </TableRow>
                  ))}
                  {(summary?.upcomingRenewals.length ?? 0) === 0 && (
                    <TableRow>
                      <TableCell colSpan={3}>
                        <Typography color="text.secondary" variant="body2">None in the next 60 days.</Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Overdue tenants
              </Typography>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Tenant</TableCell>
                    <TableCell>Unit</TableCell>
                    <TableCell>Property</TableCell>
                    <TableCell align="right">Amount overdue</TableCell>
                    <TableCell align="right">Days overdue</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(summary?.overdueTenants ?? []).map((t) => (
                    <TableRow key={t.invoiceId}>
                      <TableCell>{t.tenantName}</TableCell>
                      <TableCell>{t.unitLabel}</TableCell>
                      <TableCell>{t.propertyName}</TableCell>
                      <TableCell align="right" sx={{ color: "error.main" }}>{formatMoney(t.overdueAmountMinor)}</TableCell>
                      <TableCell align="right">{t.daysOverdue}</TableCell>
                    </TableRow>
                  ))}
                  {(summary?.overdueTenants.length ?? 0) === 0 && (
                    <TableRow>
                      <TableCell colSpan={5}>
                        <Typography color="text.secondary" variant="body2">No overdue tenants right now.</Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
