import { useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Divider from "@mui/material/Divider";
import Grid from "@mui/material/Grid";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import Tab from "@mui/material/Tab";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Tabs from "@mui/material/Tabs";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import type { InvoiceLineItemType, PaymentMethod, RentFrequency } from "@rent-manager/shared";
import { useCreateChargeMutation } from "../api/invoicesApi";
import {
  useAmendLeaseMutation,
  useGetLeaseInvoicesQuery,
  useGetLeaseLedgerQuery,
  useGetLeaseQuery,
  useTerminateLeaseMutation,
} from "../api/leasesApi";
import {
  useBillMeterReadingMutation,
  useCreateMeterReadingMutation,
  useListMeterReadingsQuery,
} from "../api/meterReadingsApi";
import { useListMetersQuery } from "../api/metersApi";
import { useRecordPaymentMutation } from "../api/paymentsApi";
import { useListPropertiesQuery } from "../api/propertiesApi";
import { useListTenantsQuery } from "../api/tenantsApi";
import { useListUnitsQuery } from "../api/unitsApi";
import { formatMoney, parseMoneyToMinor } from "../utils/money";

const FREQUENCY_LABELS: Record<RentFrequency, string> = {
  monthly: "Monthly",
  quarterly: "Quarterly",
  half_yearly: "Half-yearly",
  yearly: "Yearly",
};

const STATUS_COLOR: Record<string, "success" | "warning" | "error" | "default"> = {
  active: "success",
  expired: "default",
  terminated: "error",
  unpaid: "default",
  partial: "warning",
  paid: "success",
  overdue: "error",
};

function AmendLeaseDialog({
  leaseId,
  current,
  open,
  onClose,
}: {
  leaseId: string;
  current: {
    rentAmountMinor: number;
    depositAmountMinor: number;
    dueDayOfMonth: number;
    endDate: string;
    rentFrequency: RentFrequency;
  };
  open: boolean;
  onClose: () => void;
}) {
  const [rent, setRent] = useState((current.rentAmountMinor / 100).toString());
  const [deposit, setDeposit] = useState((current.depositAmountMinor / 100).toString());
  const [dueDayOfMonth, setDueDayOfMonth] = useState(current.dueDayOfMonth.toString());
  const [endDate, setEndDate] = useState(current.endDate.slice(0, 10));
  const [rentFrequency, setRentFrequency] = useState<RentFrequency>(current.rentFrequency);
  const [effectiveDate, setEffectiveDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [reason, setReason] = useState("");
  const [amendLease, { isLoading, error }] = useAmendLeaseMutation();

  async function handleSubmit() {
    const changes: Record<string, unknown> = {};
    const rentMinor = parseMoneyToMinor(rent);
    const depositMinor = parseMoneyToMinor(deposit);
    if (rentMinor !== current.rentAmountMinor) changes.rentAmountMinor = rentMinor;
    if (depositMinor !== current.depositAmountMinor) changes.depositAmountMinor = depositMinor;
    if (Number(dueDayOfMonth) !== current.dueDayOfMonth) changes.dueDayOfMonth = Number(dueDayOfMonth);
    if (endDate !== current.endDate.slice(0, 10)) changes.endDate = endDate;
    if (rentFrequency !== current.rentFrequency) changes.rentFrequency = rentFrequency;

    await amendLease({ leaseId, effectiveDate, reason: reason || undefined, changes }).unwrap();
    onClose();
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Amend Rental Agreement</DialogTitle>
      <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
        <Typography variant="body2" color="text.secondary">
          Change any terms below — only fields you edit will be recorded as an amendment.
        </Typography>
        <Stack direction="row" spacing={2}>
          <TextField label="Rent (₹/mo)" type="number" value={rent} onChange={(e) => setRent(e.target.value)} fullWidth />
          <TextField label="Deposit (₹)" type="number" value={deposit} onChange={(e) => setDeposit(e.target.value)} fullWidth />
        </Stack>
        <Stack direction="row" spacing={2}>
          <TextField
            label="Due day of month"
            type="number"
            value={dueDayOfMonth}
            onChange={(e) => setDueDayOfMonth(e.target.value)}
            fullWidth
          />
          <TextField
            label="New end date"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
            fullWidth
          />
        </Stack>
        <TextField
          select
          label="Rent frequency"
          value={rentFrequency}
          onChange={(e) => setRentFrequency(e.target.value as RentFrequency)}
          fullWidth
        >
          {(Object.keys(FREQUENCY_LABELS) as RentFrequency[]).map((f) => (
            <MenuItem key={f} value={f}>
              {FREQUENCY_LABELS[f]}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          label="Effective date"
          type="date"
          value={effectiveDate}
          onChange={(e) => setEffectiveDate(e.target.value)}
          InputLabelProps={{ shrink: true }}
          fullWidth
        />
        <TextField label="Reason (optional)" value={reason} onChange={(e) => setReason(e.target.value)} fullWidth />
        {error && <Alert severity="error">Could not save the amendment.</Alert>}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" disabled={isLoading} onClick={handleSubmit}>
          Save Amendment
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function TerminateLeaseDialog({
  leaseId,
  depositAmountMinor,
  open,
  onClose,
}: {
  leaseId: string;
  depositAmountMinor: number;
  open: boolean;
  onClose: () => void;
}) {
  const [terminatedAt, setTerminatedAt] = useState(() => new Date().toISOString().slice(0, 10));
  const [depositReturned, setDepositReturned] = useState((depositAmountMinor / 100).toString());
  const [note, setNote] = useState("");
  const [terminateLease, { isLoading, error }] = useTerminateLeaseMutation();

  async function handleSubmit() {
    await terminateLease({
      leaseId,
      terminatedAt,
      depositReturnedMinor: parseMoneyToMinor(depositReturned),
      depositDeductionNote: note || undefined,
    }).unwrap();
    onClose();
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>Terminate Lease</DialogTitle>
      <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
        <TextField
          label="Termination date"
          type="date"
          value={terminatedAt}
          onChange={(e) => setTerminatedAt(e.target.value)}
          InputLabelProps={{ shrink: true }}
          fullWidth
        />
        <TextField
          label="Deposit returned (₹)"
          type="number"
          value={depositReturned}
          onChange={(e) => setDepositReturned(e.target.value)}
          helperText={`Deposit held: ${formatMoney(depositAmountMinor)}`}
          fullWidth
        />
        <TextField
          label="Deduction note (optional)"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          fullWidth
          multiline
        />
        {error && <Alert severity="error">Could not terminate the lease.</Alert>}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button color="error" variant="contained" disabled={isLoading} onClick={handleSubmit}>
          Terminate
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

function ChargeDialog({ leaseId, open, onClose }: { leaseId: string; open: boolean; onClose: () => void }) {
  const [type, setType] = useState<InvoiceLineItemType>("utility");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [createCharge, { isLoading, error }] = useCreateChargeMutation();

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
        <Button variant="contained" disabled={isLoading || !description || !amount} onClick={handleSubmit}>
          Add Charge
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function MeterReadingsPanel({ unitId, leaseId }: { unitId: string; leaseId: string }) {
  const { data: subMeters = [] } = useListMetersQuery({ unit: unitId, kind: "sub" });
  const { data: readings = [] } = useListMeterReadingsQuery({ unit: unitId });
  const [meterId, setMeterId] = useState("");
  const [currentReadingValue, setCurrentReadingValue] = useState("");
  const [ratePerUnit, setRatePerUnit] = useState("8");
  const [readingDate, setReadingDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [createReading, { isLoading: creating }] = useCreateMeterReadingMutation();
  const [billReading, { isLoading: billing }] = useBillMeterReadingMutation();

  async function handleAddReading() {
    await createReading({
      meter: meterId,
      readingDate,
      currentReadingValue: Number(currentReadingValue),
      ratePerUnitMinor: parseMoneyToMinor(ratePerUnit),
    }).unwrap();
    setCurrentReadingValue("");
  }

  if (subMeters.length === 0) {
    return (
      <Typography color="text.secondary" variant="body2">
        No sub-meter has been assigned to this unit yet. Add one from the Properties page (main meter on
        the property, then a sub-meter for this unit) before recording readings.
      </Typography>
    );
  }

  return (
    <Stack spacing={2}>
      <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
        <TextField select label="Meter" value={meterId} onChange={(e) => setMeterId(e.target.value)} size="small" sx={{ minWidth: 180 }}>
          {subMeters.map((m) => (
            <MenuItem key={m.id} value={m.id}>
              {m.label} ({m.utilityType})
            </MenuItem>
          ))}
        </TextField>
        <TextField
          label="Reading date"
          type="date"
          size="small"
          value={readingDate}
          onChange={(e) => setReadingDate(e.target.value)}
          InputLabelProps={{ shrink: true }}
        />
        <TextField
          label="Current reading"
          type="number"
          size="small"
          value={currentReadingValue}
          onChange={(e) => setCurrentReadingValue(e.target.value)}
        />
        <TextField
          label="Rate/unit (₹)"
          type="number"
          size="small"
          value={ratePerUnit}
          onChange={(e) => setRatePerUnit(e.target.value)}
        />
        <Button variant="contained" size="small" disabled={creating || !meterId || !currentReadingValue} onClick={handleAddReading}>
          Record Reading
        </Button>
      </Stack>

      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Date</TableCell>
            <TableCell>Meter</TableCell>
            <TableCell>Previous</TableCell>
            <TableCell>Current</TableCell>
            <TableCell>Consumed</TableCell>
            <TableCell>Amount</TableCell>
            <TableCell align="right">Action</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {readings.map((r) => (
            <TableRow key={r.id}>
              <TableCell>{r.readingDate.slice(0, 10)}</TableCell>
              <TableCell>{r.meterType}</TableCell>
              <TableCell>{r.previousReadingValue}</TableCell>
              <TableCell>{r.currentReadingValue}</TableCell>
              <TableCell>{r.unitsConsumed}</TableCell>
              <TableCell>{formatMoney(r.amountMinor)}</TableCell>
              <TableCell align="right">
                {r.billed ? (
                  <Chip size="small" label="Billed" />
                ) : (
                  <Button
                    size="small"
                    disabled={billing}
                    onClick={() => billReading({ id: r.id, lease: leaseId })}
                  >
                    Bill to lease
                  </Button>
                )}
              </TableCell>
            </TableRow>
          ))}
          {readings.length === 0 && (
            <TableRow>
              <TableCell colSpan={7}>
                <Typography color="text.secondary" variant="body2">
                  No meter readings recorded yet.
                </Typography>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </Stack>
  );
}

export default function LeaseLedger() {
  const { id } = useParams<{ id: string }>();
  const leaseId = id!;
  const { data: lease } = useGetLeaseQuery(leaseId);
  const { data: ledger = [] } = useGetLeaseLedgerQuery(leaseId);
  const { data: invoices = [] } = useGetLeaseInvoicesQuery(leaseId);
  const { data: tenants = [] } = useListTenantsQuery();
  const { data: units = [] } = useListUnitsQuery();
  const { data: properties = [] } = useListPropertiesQuery();

  const [tab, setTab] = useState(0);
  const [amendOpen, setAmendOpen] = useState(false);
  const [terminateOpen, setTerminateOpen] = useState(false);
  const [chargeOpen, setChargeOpen] = useState(false);
  const [payingInvoice, setPayingInvoice] = useState<{ id: string; outstanding: number } | null>(null);

  const tenant = tenants.find((t) => t.id === lease?.tenant);
  const unit = units.find((u) => u.id === lease?.unit);
  const property = properties.find((p) => p.id === unit?.property);

  const currentBalance = useMemo(() => ledger.at(-1)?.runningBalanceMinor ?? 0, [ledger]);

  if (!lease) return <Typography>Loading…</Typography>;

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 2 }}>
        <Box>
          <Typography variant="h4">{tenant?.name ?? "Tenant"}</Typography>
          <Typography color="text.secondary">
            {unit?.label} — {property?.name}
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Chip label={lease.status} color={STATUS_COLOR[lease.status]} />
          {lease.status === "active" && (
            <>
              <Button variant="outlined" onClick={() => setAmendOpen(true)}>
                Amend Agreement
              </Button>
              <Button variant="outlined" color="error" onClick={() => setTerminateOpen(true)}>
                Terminate
              </Button>
            </>
          )}
        </Stack>
      </Stack>

      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={12} md={8}>
          <Card variant="outlined">
            <CardContent>
              <Grid container spacing={2}>
                <Grid item xs={6} sm={3}>
                  <Typography variant="caption" color="text.secondary">Rent</Typography>
                  <Typography>{formatMoney(lease.rentAmountMinor)}/mo</Typography>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Typography variant="caption" color="text.secondary">Deposit</Typography>
                  <Typography>{formatMoney(lease.depositAmountMinor)}</Typography>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Typography variant="caption" color="text.secondary">Due day</Typography>
                  <Typography>{lease.dueDayOfMonth}</Typography>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Typography variant="caption" color="text.secondary">Frequency</Typography>
                  <Typography>{FREQUENCY_LABELS[lease.rentFrequency]}</Typography>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Typography variant="caption" color="text.secondary">Term</Typography>
                  <Typography variant="body2">
                    {lease.startDate.slice(0, 10)} → {lease.endDate.slice(0, 10)}
                  </Typography>
                </Grid>
              </Grid>
              {lease.backfilledThrough && (
                <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
                  Historical rent was auto-generated (paid) from the lease start through{" "}
                  {lease.backfilledThrough.slice(0, 10)} — see the Invoices tab.
                </Typography>
              )}
              {lease.amendments.length > 0 && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="subtitle2" gutterBottom>
                    Amendment history
                  </Typography>
                  <Stack spacing={1}>
                    {lease.amendments.map((a, i) => (
                      <Typography key={i} variant="body2" color="text.secondary">
                        {a.effectiveDate.slice(0, 10)}: {Object.keys(a.changes).join(", ")}
                        {a.reason ? ` — ${a.reason}` : ""}
                      </Typography>
                    ))}
                  </Stack>
                </>
              )}
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card variant="outlined" sx={{ height: "100%" }}>
            <CardContent>
              <Typography variant="caption" color="text.secondary">Current rent balance</Typography>
              <Typography variant="h5" color={currentBalance > 0 ? "error.main" : "success.main"}>
                {formatMoney(currentBalance)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {currentBalance > 0 ? "Owed by tenant" : "Settled"}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Tabs value={tab} onChange={(_e, v) => setTab(v)} sx={{ mb: 2 }}>
        <Tab label="Ledger" />
        <Tab label="Invoices" />
        <Tab label="Utility Meters" />
      </Tabs>

      {tab === 0 && (
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Date</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Description</TableCell>
              <TableCell align="right">Amount</TableCell>
              <TableCell align="right">Balance</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {ledger.map((entry) => (
              <TableRow key={entry.id}>
                <TableCell>{entry.date.slice(0, 10)}</TableCell>
                <TableCell>
                  <Chip size="small" label={entry.type.replace("_", " ")} />
                </TableCell>
                <TableCell>{entry.description}</TableCell>
                <TableCell align="right" sx={{ color: entry.amountMinor >= 0 ? "error.main" : "success.main" }}>
                  {entry.amountMinor >= 0 ? "+" : ""}
                  {formatMoney(entry.amountMinor)}
                </TableCell>
                <TableCell align="right">{formatMoney(entry.runningBalanceMinor)}</TableCell>
              </TableRow>
            ))}
            {ledger.length === 0 && (
              <TableRow>
                <TableCell colSpan={5}>
                  <Typography color="text.secondary" variant="body2">No ledger activity yet.</Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      )}

      {tab === 1 && (
        <Box>
          <Stack direction="row" justifyContent="flex-end" sx={{ mb: 1 }}>
            <Button variant="outlined" onClick={() => setChargeOpen(true)}>
              Add Manual Charge
            </Button>
          </Stack>
          <Table size="small">
            <TableHead>
              <TableRow>
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
                const outstanding = invoice.totalMinor - invoice.amountPaidMinor;
                return (
                  <TableRow key={invoice.id}>
                    <TableCell>{invoice.month}</TableCell>
                    <TableCell>{invoice.dueDate.slice(0, 10)}</TableCell>
                    <TableCell align="right">{formatMoney(invoice.totalMinor)}</TableCell>
                    <TableCell align="right">{formatMoney(invoice.amountPaidMinor)}</TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={0.5}>
                        <Chip size="small" label={invoice.status} color={STATUS_COLOR[invoice.status]} />
                        {invoice.isBackfilled && <Chip size="small" variant="outlined" label="Historical" />}
                      </Stack>
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
              {invoices.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6}>
                    <Typography color="text.secondary" variant="body2">No invoices yet.</Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Box>
      )}

      {tab === 2 && unit && <MeterReadingsPanel unitId={unit.id} leaseId={lease.id} />}

      <AmendLeaseDialog
        leaseId={lease.id}
        current={{
          rentAmountMinor: lease.rentAmountMinor,
          depositAmountMinor: lease.depositAmountMinor,
          dueDayOfMonth: lease.dueDayOfMonth,
          endDate: lease.endDate,
          rentFrequency: lease.rentFrequency,
        }}
        open={amendOpen}
        onClose={() => setAmendOpen(false)}
      />
      <TerminateLeaseDialog
        leaseId={lease.id}
        depositAmountMinor={lease.depositAmountMinor}
        open={terminateOpen}
        onClose={() => setTerminateOpen(false)}
      />
      <ChargeDialog leaseId={lease.id} open={chargeOpen} onClose={() => setChargeOpen(false)} />
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
