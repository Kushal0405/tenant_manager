import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AddIcon from "@mui/icons-material/Add";
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
import type { RentFrequency, Tenant } from "@rent-manager/shared";
import { useCreateTenantMutation, useListTenantsQuery, useMarkSelfAsLesseeMutation } from "../api/tenantsApi";
import { useCreateLeaseMutation, useListLeasesQuery } from "../api/leasesApi";
import { useListUnitsQuery } from "../api/unitsApi";
import { useAppSelector } from "../app/hooks";
import { parseMoneyToMinor } from "../utils/money";

const FREQUENCY_LABELS: Record<RentFrequency, string> = {
  monthly: "Monthly",
  quarterly: "Quarterly",
  half_yearly: "Half-yearly",
  yearly: "Yearly",
};

const FREQUENCY_MONTHS: Record<RentFrequency, number> = {
  monthly: 1,
  quarterly: 3,
  half_yearly: 6,
  yearly: 12,
};

/** Rough client-side estimate of how many past periods will be backfilled — the server computes the real figure. */
function estimateBackfillPeriods(startDate: string, frequency: RentFrequency): number {
  const start = new Date(startDate);
  const now = new Date();
  const months = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());
  return Math.max(0, Math.floor(months / FREQUENCY_MONTHS[frequency]));
}

function AddTenantDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [createTenant, { isLoading }] = useCreateTenantMutation();

  async function handleSubmit() {
    await createTenant({ name, email, phone }).unwrap();
    onClose();
    setName("");
    setEmail("");
    setPhone("");
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>Add Tenant</DialogTitle>
      <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
        <TextField label="Name" value={name} onChange={(e) => setName(e.target.value)} fullWidth />
        <TextField label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} fullWidth />
        <TextField label="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} fullWidth />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" disabled={!name || !email || !phone || isLoading} onClick={handleSubmit}>
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function MarkSelfAsLesseeDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [phone, setPhone] = useState("");
  const [idProofType, setIdProofType] = useState("");
  const [idProofNumber, setIdProofNumber] = useState("");
  const [markSelf, { isLoading, error }] = useMarkSelfAsLesseeMutation();

  async function handleSubmit() {
    await markSelf({
      phone,
      idProofType: idProofType || undefined,
      idProofNumber: idProofNumber || undefined,
    }).unwrap();
    onClose();
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>Mark Myself as a Lessee</DialogTitle>
      <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
        <Typography variant="body2" color="text.secondary">
          If you're renting a place yourself, this adds you as a tenant record (using your account's
          name and email) so it can be tracked the same way as any other lessee.
        </Typography>
        <TextField label="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} fullWidth />
        <TextField label="ID proof type (optional)" value={idProofType} onChange={(e) => setIdProofType(e.target.value)} fullWidth />
        <TextField label="ID proof number (optional)" value={idProofNumber} onChange={(e) => setIdProofNumber(e.target.value)} fullWidth />
        {error && <Alert severity="error">Could not complete this action.</Alert>}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" disabled={!phone || isLoading} onClick={handleSubmit}>
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function NewLeaseDialog({ tenant, open, onClose }: { tenant: Tenant; open: boolean; onClose: () => void }) {
  const { data: units = [] } = useListUnitsQuery();
  const vacantUnits = units.filter((u) => u.status === "vacant");
  const [unitId, setUnitId] = useState("");
  const [rent, setRent] = useState("");
  const [deposit, setDeposit] = useState("");
  const [dueDayOfMonth, setDueDayOfMonth] = useState("5");
  const [rentFrequency, setRentFrequency] = useState<RentFrequency>("monthly");
  const [graceDays, setGraceDays] = useState("5");
  const [lateFeeMinor, setLateFeeMinor] = useState("500");
  const [startDate, setStartDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() + 1);
    return d.toISOString().slice(0, 10);
  });
  const [createLease, { isLoading }] = useCreateLeaseMutation();

  const selectedUnit = vacantUnits.find((u) => u.id === unitId);
  const backfillPeriods = estimateBackfillPeriods(startDate, rentFrequency);

  async function handleSubmit() {
    await createLease({
      unit: unitId,
      tenant: tenant.id,
      startDate,
      endDate,
      rentAmountMinor: parseMoneyToMinor(rent),
      depositAmountMinor: parseMoneyToMinor(deposit),
      dueDayOfMonth: Number(dueDayOfMonth),
      rentFrequency,
      lateFeeRule: { graceDays: Number(graceDays), feeType: "flat", feeValueMinor: parseMoneyToMinor(lateFeeMinor) },
    }).unwrap();
    onClose();
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>New Rental Agreement for {tenant.name}</DialogTitle>
      <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
        <TextField
          select
          label="Unit"
          value={unitId}
          onChange={(e) => {
            setUnitId(e.target.value);
            const unit = vacantUnits.find((u) => u.id === e.target.value);
            if (unit) setRent((unit.baseRentMinor / 100).toString());
          }}
          fullWidth
        >
          {vacantUnits.length === 0 && <MenuItem disabled value="">No vacant units</MenuItem>}
          {vacantUnits.map((unit) => (
            <MenuItem key={unit.id} value={unit.id}>
              {unit.label}
            </MenuItem>
          ))}
        </TextField>
        <Stack direction="row" spacing={2}>
          <TextField
            label="Rent start date"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
            fullWidth
          />
          <TextField
            label="End date"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
            fullWidth
          />
        </Stack>
        <Stack direction="row" spacing={2}>
          <TextField label="Rent amount (₹)" type="number" value={rent} onChange={(e) => setRent(e.target.value)} fullWidth />
          <TextField label="Deposit (₹)" type="number" value={deposit} onChange={(e) => setDeposit(e.target.value)} fullWidth />
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
        <Stack direction="row" spacing={2}>
          <TextField
            label="Due day of month"
            type="number"
            value={dueDayOfMonth}
            onChange={(e) => setDueDayOfMonth(e.target.value)}
            fullWidth
          />
          <TextField label="Grace days" type="number" value={graceDays} onChange={(e) => setGraceDays(e.target.value)} fullWidth />
          <TextField
            label="Late fee (₹ flat)"
            type="number"
            value={lateFeeMinor}
            onChange={(e) => setLateFeeMinor(e.target.value)}
            fullWidth
          />
        </Stack>
        {selectedUnit && (
          <Typography variant="caption" color="text.secondary">
            Suggested rent prefilled from the unit's base rent — adjust if needed.
          </Typography>
        )}
        {backfillPeriods > 0 && (
          <Alert severity="info">
            The rent start date is in the past — this will automatically generate {backfillPeriods} past{" "}
            {FREQUENCY_LABELS[rentFrequency].toLowerCase()} invoice{backfillPeriods === 1 ? "" : "s"}, marked as
            paid, so the ledger reflects the full rental history. The current period is left for you to bill
            normally.
          </Alert>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" disabled={!unitId || !rent || !deposit || isLoading} onClick={handleSubmit}>
          Create Lease
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default function Tenants() {
  const { data: tenants = [], isLoading } = useListTenantsQuery();
  const { data: leases = [] } = useListLeasesQuery();
  const [addTenantOpen, setAddTenantOpen] = useState(false);
  const [markSelfOpen, setMarkSelfOpen] = useState(false);
  const [leaseDialogTenant, setLeaseDialogTenant] = useState<Tenant | null>(null);
  const navigate = useNavigate();
  const currentUser = useAppSelector((state) => state.auth.user);

  const isAlreadySelfLessee = tenants.some((t) => t.linkedUserId === currentUser?.id);

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Typography variant="h4">Tenants</Typography>
        <Stack direction="row" spacing={1}>
          {!isAlreadySelfLessee && (
            <Button variant="outlined" onClick={() => setMarkSelfOpen(true)}>
              Mark Myself as a Lessee
            </Button>
          )}
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setAddTenantOpen(true)}>
            Add Tenant
          </Button>
        </Stack>
      </Stack>

      {isLoading && <Typography>Loading…</Typography>}

      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Name</TableCell>
            <TableCell>Email</TableCell>
            <TableCell>Phone</TableCell>
            <TableCell>Lease</TableCell>
            <TableCell align="right">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {tenants.map((tenant) => {
            const activeLease = leases.find((l) => l.tenant === tenant.id && l.status === "active");
            return (
              <TableRow key={tenant.id}>
                <TableCell>
                  {tenant.name}
                  {tenant.linkedUserId === currentUser?.id && (
                    <Chip size="small" label="You" sx={{ ml: 1 }} />
                  )}
                </TableCell>
                <TableCell>{tenant.email}</TableCell>
                <TableCell>{tenant.phone}</TableCell>
                <TableCell>
                  {activeLease ? (
                    <Chip size="small" color="success" label="Active" />
                  ) : (
                    <Chip size="small" label="No active lease" />
                  )}
                </TableCell>
                <TableCell align="right">
                  {activeLease ? (
                    <Button size="small" onClick={() => navigate(`/leases/${activeLease.id}`)}>
                      View Ledger
                    </Button>
                  ) : (
                    <Button size="small" onClick={() => setLeaseDialogTenant(tenant)}>
                      New Lease
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      <AddTenantDialog open={addTenantOpen} onClose={() => setAddTenantOpen(false)} />
      <MarkSelfAsLesseeDialog open={markSelfOpen} onClose={() => setMarkSelfOpen(false)} />
      {leaseDialogTenant && (
        <NewLeaseDialog
          tenant={leaseDialogTenant}
          open={Boolean(leaseDialogTenant)}
          onClose={() => setLeaseDialogTenant(null)}
        />
      )}
    </Box>
  );
}
