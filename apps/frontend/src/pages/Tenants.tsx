import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AddIcon from "@mui/icons-material/Add";
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
import type { Tenant } from "@rent-manager/shared";
import { useCreateTenantMutation, useListTenantsQuery } from "../api/tenantsApi";
import { useCreateLeaseMutation, useListLeasesQuery } from "../api/leasesApi";
import { useListUnitsQuery } from "../api/unitsApi";
import { parseMoneyToMinor } from "../utils/money";

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

function NewLeaseDialog({ tenant, open, onClose }: { tenant: Tenant; open: boolean; onClose: () => void }) {
  const { data: units = [] } = useListUnitsQuery();
  const vacantUnits = units.filter((u) => u.status === "vacant");
  const [unitId, setUnitId] = useState("");
  const [rent, setRent] = useState("");
  const [deposit, setDeposit] = useState("");
  const [dueDayOfMonth, setDueDayOfMonth] = useState("5");
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

  async function handleSubmit() {
    await createLease({
      unit: unitId,
      tenant: tenant.id,
      startDate,
      endDate,
      rentAmountMinor: parseMoneyToMinor(rent),
      depositAmountMinor: parseMoneyToMinor(deposit),
      dueDayOfMonth: Number(dueDayOfMonth),
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
            label="Start date"
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
  const [leaseDialogTenant, setLeaseDialogTenant] = useState<Tenant | null>(null);
  const navigate = useNavigate();

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Typography variant="h4">Tenants</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setAddTenantOpen(true)}>
          Add Tenant
        </Button>
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
                <TableCell>{tenant.name}</TableCell>
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
