import { useState } from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import type { InvoiceLineItemType, InvoiceStatus, PaymentMethod } from "@rent-manager/shared";
import { useCreateChargeMutation, useListInvoicesQuery, useRunBillingCycleMutation } from "../api/invoicesApi";
import { useListLeasesQuery } from "../api/leasesApi";
import { useRecordPaymentMutation } from "../api/paymentsApi";
import { useListTenantsQuery } from "../api/tenantsApi";
import { useListUnitsQuery } from "../api/unitsApi";
import { formatMoney, parseMoneyToMinor } from "../utils/money";

const STATUS_COLOR: Record<InvoiceStatus, "success" | "warning" | "error" | "default"> = {
  unpaid: "default",
  partial: "warning",
  paid: "success",
  overdue: "error",
};

function ChargeDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { data: leases = [] } = useListLeasesQuery({ status: "active" });
  const { data: tenants = [] } = useListTenantsQuery();
  const { data: units = [] } = useListUnitsQuery();
  const [leaseId, setLeaseId] = useState("");
  const [type, setType] = useState<InvoiceLineItemType>("utility");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [createCharge, { isLoading, error }] = useCreateChargeMutation();

  function leaseLabel(leaseId: string) {
    const lease = leases.find((l) => l.id === leaseId);
    const tenant = tenants.find((t) => t.id === lease?.tenant);
    const unit = units.find((u) => u.id === lease?.unit);
    return `${tenant?.name ?? "?"} — ${unit?.label ?? "?"}`;
  }

  async function handleSubmit() {
    await createCharge({ lease: leaseId, type, description, amountMinor: parseMoneyToMinor(amount) }).unwrap();
    onClose();
    setDescription("");
    setAmount("");
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>Add Manual Charge</DialogTitle>
      <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
        <TextField select label="Lease" value={leaseId} onChange={(e) => setLeaseId(e.target.value)} fullWidth>
          {leases.map((lease) => (
            <MenuItem key={lease.id} value={lease.id}>
              {leaseLabel(lease.id)}
            </MenuItem>
          ))}
        </TextField>
        <TextField select label="Type" value={type} onChange={(e) => setType(e.target.value as InvoiceLineItemType)} fullWidth>
          <MenuItem value="utility">Utility</MenuItem>
          <MenuItem value="maintenance">Maintenance</MenuItem>
          <MenuItem value="late_fee">Late fee</MenuItem>
          <MenuItem value="custom">Custom / one-off</MenuItem>
        </TextField>
        <TextField label="Description" value={description} onChange={(e) => setDescription(e.target.value)} fullWidth />
        <TextField label="Amount (₹)" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} fullWidth />
        {error && <Alert severity="error">Could not add the charge.</Alert>}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" disabled={isLoading || !leaseId || !description || !amount} onClick={handleSubmit}>
          Add Charge
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function PaymentDialog({
  invoiceId,
  outstandingMinor,
  open,
  onClose,
}: {
  invoiceId: string;
  outstandingMinor: number;
  open: boolean;
  onClose: () => void;
}) {
  const [amount, setAmount] = useState((outstandingMinor / 100).toString());
  const [method, setMethod] = useState<PaymentMethod>("bank");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [recordPayment, { isLoading, error }] = useRecordPaymentMutation();

  async function handleSubmit() {
    await recordPayment({ invoice: invoiceId, amountMinor: parseMoneyToMinor(amount), method, date }).unwrap();
    onClose();
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>Record Payment</DialogTitle>
      <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
        <TextField
          label="Amount (₹)"
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          helperText={`Outstanding: ${formatMoney(outstandingMinor)}`}
          fullWidth
        />
        <TextField select label="Method" value={method} onChange={(e) => setMethod(e.target.value as PaymentMethod)} fullWidth>
          <MenuItem value="cash">Cash</MenuItem>
          <MenuItem value="bank">Bank</MenuItem>
          <MenuItem value="upi">UPI</MenuItem>
          <MenuItem value="card">Card</MenuItem>
        </TextField>
        <TextField
          label="Date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          InputLabelProps={{ shrink: true }}
          fullWidth
        />
        {error && <Alert severity="error">Could not record the payment.</Alert>}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" disabled={isLoading || !amount} onClick={handleSubmit}>
          Record
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default function Billing() {
  const [statusFilter, setStatusFilter] = useState<string>("");
  const { data: invoices = [], isLoading } = useListInvoicesQuery(
    statusFilter ? { status: statusFilter } : undefined,
  );
  const { data: leases = [] } = useListLeasesQuery();
  const { data: tenants = [] } = useListTenantsQuery();
  const { data: units = [] } = useListUnitsQuery();
  const [runBillingCycle, { isLoading: running, data: runResult }] = useRunBillingCycleMutation();
  const [chargeOpen, setChargeOpen] = useState(false);
  const [payingInvoice, setPayingInvoice] = useState<{ id: string; outstanding: number } | null>(null);

  function tenantAndUnitFor(invoiceLeaseId: string) {
    const lease = leases.find((l) => l.id === invoiceLeaseId);
    const tenant = tenants.find((t) => t.id === lease?.tenant);
    const unit = units.find((u) => u.id === lease?.unit);
    return { tenantName: tenant?.name ?? "—", unitLabel: unit?.label ?? "—" };
  }

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }} flexWrap="wrap" gap={1}>
        <Typography variant="h4">Billing</Typography>
        <Stack direction="row" spacing={1}>
          <Button variant="outlined" disabled={running} onClick={() => runBillingCycle()}>
            Run Billing Cycle Now
          </Button>
          <Button variant="contained" onClick={() => setChargeOpen(true)}>
            Add Manual Charge
          </Button>
        </Stack>
      </Stack>

      {runResult && (
        <Alert severity="success" sx={{ mb: 2 }}>
          Generated {runResult.invoicesCreated} invoice(s), marked {runResult.markedOverdue} overdue, applied{" "}
          {runResult.lateFeesApplied} late fee(s).
        </Alert>
      )}

      <TextField
        select
        label="Filter by status"
        value={statusFilter}
        onChange={(e) => setStatusFilter(e.target.value)}
        size="small"
        sx={{ mb: 2, width: 220 }}
      >
        <MenuItem value="">All</MenuItem>
        <MenuItem value="unpaid">Unpaid</MenuItem>
        <MenuItem value="partial">Partial</MenuItem>
        <MenuItem value="paid">Paid</MenuItem>
        <MenuItem value="overdue">Overdue</MenuItem>
      </TextField>

      {isLoading && <Typography>Loading…</Typography>}

      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Tenant</TableCell>
            <TableCell>Unit</TableCell>
            <TableCell>Month</TableCell>
            <TableCell>Due date</TableCell>
            <TableCell align="right">Total</TableCell>
            <TableCell align="right">Paid</TableCell>
            <TableCell>Status</TableCell>
            <TableCell align="right">Action</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {invoices.map((invoice) => {
            const { tenantName, unitLabel } = tenantAndUnitFor(invoice.lease);
            const outstanding = invoice.totalMinor - invoice.amountPaidMinor;
            return (
              <TableRow key={invoice.id}>
                <TableCell>{tenantName}</TableCell>
                <TableCell>{unitLabel}</TableCell>
                <TableCell>{invoice.month}</TableCell>
                <TableCell>{invoice.dueDate.slice(0, 10)}</TableCell>
                <TableCell align="right">{formatMoney(invoice.totalMinor)}</TableCell>
                <TableCell align="right">{formatMoney(invoice.amountPaidMinor)}</TableCell>
                <TableCell>
                  <Chip size="small" label={invoice.status} color={STATUS_COLOR[invoice.status]} />
                </TableCell>
                <TableCell align="right">
                  {invoice.status !== "paid" && (
                    <Button size="small" onClick={() => setPayingInvoice({ id: invoice.id, outstanding })}>
                      Record Payment
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
          {invoices.length === 0 && !isLoading && (
            <TableRow>
              <TableCell colSpan={8}>
                <Typography color="text.secondary" variant="body2">No invoices found.</Typography>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <ChargeDialog open={chargeOpen} onClose={() => setChargeOpen(false)} />
      {payingInvoice && (
        <PaymentDialog
          invoiceId={payingInvoice.id}
          outstandingMinor={payingInvoice.outstanding}
          open={Boolean(payingInvoice)}
          onClose={() => setPayingInvoice(null)}
        />
      )}
    </Box>
  );
}
