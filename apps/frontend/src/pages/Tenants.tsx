import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AddIcon from "@mui/icons-material/Add";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import IconButton from "@mui/material/IconButton";
import LinkOffRoundedIcon from "@mui/icons-material/LinkOffRounded";
import LinkRoundedIcon from "@mui/icons-material/LinkRounded";
import ListItemIcon from "@mui/material/ListItemIcon";
import MenuItem from "@mui/material/MenuItem";
import Menu from "@mui/material/Menu";
import MoreVertRoundedIcon from "@mui/icons-material/MoreVertRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import type { RentFrequency, Tenant, UserSearchResult } from "@rent-manager/shared";
import { useLazySearchUsersQuery } from "../api/authApi";
import {
  useCreateTenantMutation,
  useDeleteTenantMutation,
  useLinkTenantUserMutation,
  useListTenantsQuery,
  useUnlinkTenantUserMutation,
  useUpdateTenantMutation,
} from "../api/tenantsApi";
import { useCreateLeaseMutation, useListLeasesQuery } from "../api/leasesApi";
import { useListUnitsQuery } from "../api/unitsApi";
import { useAppSelector } from "../app/hooks";
import { parseMoneyToMinor } from "../utils/money";
import { estimateBackfillPeriods, FREQUENCY_LABELS } from "../utils/rentFrequency";

function TenantFormDialog({
  open,
  onClose,
  tenant,
}: {
  open: boolean;
  onClose: () => void;
  tenant?: Tenant;
}) {
  const isEdit = Boolean(tenant);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [alternatePhone, setAlternatePhone] = useState("");
  const [idProofType, setIdProofType] = useState("");
  const [idProofNumber, setIdProofNumber] = useState("");
  const [createTenant, createState] = useCreateTenantMutation();
  const [updateTenant, updateState] = useUpdateTenantMutation();
  const isLoading = createState.isLoading || updateState.isLoading;
  const error = createState.error || updateState.error;

  useEffect(() => {
    if (!open) return;
    setName(tenant?.name ?? "");
    setEmail(tenant?.email ?? "");
    setPhone(tenant?.phone ?? "");
    setAlternatePhone(tenant?.alternatePhone ?? "");
    setIdProofType(tenant?.idProofType ?? "");
    setIdProofNumber(tenant?.idProofNumber ?? "");
  }, [open, tenant]);

  async function handleSubmit() {
    const body = {
      name,
      email,
      phone,
      alternatePhone: alternatePhone || undefined,
      idProofType: idProofType || undefined,
      idProofNumber: idProofNumber || undefined,
    };
    if (isEdit && tenant) {
      await updateTenant({ id: tenant.id, body }).unwrap();
    } else {
      await createTenant(body).unwrap();
    }
    onClose();
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>{isEdit ? "Edit Tenant" : "Add Tenant"}</DialogTitle>
      <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
        <TextField label="Name" value={name} onChange={(e) => setName(e.target.value)} fullWidth />
        <TextField label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} fullWidth />
        <TextField label="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} fullWidth />
        <TextField
          label="Alternate phone (optional)"
          value={alternatePhone}
          onChange={(e) => setAlternatePhone(e.target.value)}
          fullWidth
        />
        <Stack direction="row" spacing={2}>
          <TextField
            label="ID proof type (optional)"
            value={idProofType}
            onChange={(e) => setIdProofType(e.target.value)}
            fullWidth
          />
          <TextField
            label="ID proof number (optional)"
            value={idProofNumber}
            onChange={(e) => setIdProofNumber(e.target.value)}
            fullWidth
          />
        </Stack>
        {error && <Alert severity="error">Could not save the tenant.</Alert>}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" disabled={!name || !email || !phone || isLoading} onClick={handleSubmit}>
          {isEdit ? "Save changes" : "Save"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function LinkUserDialog({ tenant, open, onClose }: { tenant: Tenant; open: boolean; onClose: () => void }) {
  const [mode, setMode] = useState<"search" | "invite">("search");
  const [term, setTerm] = useState("");
  const [selected, setSelected] = useState<UserSearchResult | null>(null);
  const [name, setName] = useState(tenant.name);
  const [email, setEmail] = useState(tenant.email);
  const [search, { data: results = [], isFetching }] = useLazySearchUsersQuery();
  const [linkUser, { isLoading, error }] = useLinkTenantUserMutation();

  useEffect(() => {
    if (!open) return;
    setMode("search");
    setTerm("");
    setSelected(null);
    setName(tenant.name);
    setEmail(tenant.email);
  }, [open, tenant]);

  useEffect(() => {
    if (mode !== "search" || term.trim().length < 2) return;
    const t = setTimeout(() => search(term.trim()), 300);
    return () => clearTimeout(t);
  }, [term, mode, search]);

  async function handleLink() {
    const body =
      mode === "search" && selected ? { userId: selected.id } : { name, email };
    await linkUser({ id: tenant.id, body }).unwrap();
    onClose();
  }

  const canLink = mode === "search" ? Boolean(selected) : Boolean(name && email);

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>Link a user account</DialogTitle>
      <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
        <DialogContentText sx={{ fontSize: "0.85rem" }}>
          Linking an account lets {tenant.name} sign in and see their own rent ledger.
        </DialogContentText>
        <Stack direction="row" spacing={1}>
          <Button
            size="small"
            variant={mode === "search" ? "contained" : "outlined"}
            onClick={() => setMode("search")}
          >
            Find existing user
          </Button>
          <Button
            size="small"
            variant={mode === "invite" ? "contained" : "outlined"}
            onClick={() => setMode("invite")}
          >
            Invite by email
          </Button>
        </Stack>

        {mode === "search" ? (
          <>
            <TextField
              label="Search by name or email"
              value={term}
              onChange={(e) => {
                setTerm(e.target.value);
                setSelected(null);
              }}
              fullWidth
            />
            <Box sx={{ maxHeight: 200, overflowY: "auto", border: "1px solid", borderColor: "divider", borderRadius: 2 }}>
              {isFetching && <Typography sx={{ p: 1.5 }} variant="body2" color="text.secondary">Searching…</Typography>}
              {!isFetching && term.trim().length >= 2 && results.length === 0 && (
                <Typography sx={{ p: 1.5 }} variant="body2" color="text.secondary">
                  No users found — try “Invite by email”.
                </Typography>
              )}
              {results.map((u) => (
                <Box
                  key={u.id}
                  onClick={() => setSelected(u)}
                  sx={{
                    px: 1.5,
                    py: 1,
                    cursor: "pointer",
                    bgcolor: selected?.id === u.id ? "action.selected" : undefined,
                    "&:hover": { bgcolor: "action.hover" },
                  }}
                >
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>{u.name}</Typography>
                  <Typography variant="caption" color="text.secondary">{u.email}</Typography>
                </Box>
              ))}
            </Box>
          </>
        ) : (
          <>
            <TextField label="Name" value={name} onChange={(e) => setName(e.target.value)} fullWidth />
            <TextField label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} fullWidth />
            <Typography variant="caption" color="text.secondary">
              If no account exists for this email, one is created — the user sets a password via the reset flow.
            </Typography>
          </>
        )}
        {error && <Alert severity="error">Could not link the account.</Alert>}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" disabled={!canLink || isLoading} onClick={handleLink}>
          Link account
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function DeleteTenantDialog({ tenant, open, onClose }: { tenant: Tenant; open: boolean; onClose: () => void }) {
  const [deleteTenant, { isLoading, error }] = useDeleteTenantMutation();

  async function handleDelete() {
    await deleteTenant(tenant.id).unwrap();
    onClose();
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>Delete {tenant.name}?</DialogTitle>
      <DialogContent>
        <DialogContentText sx={{ fontSize: "0.85rem" }}>
          This removes the tenant record. Tenants with any lease history can’t be deleted.
        </DialogContentText>
        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            Could not delete — this tenant has lease history.
          </Alert>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" color="error" disabled={isLoading} onClick={handleDelete}>
          Delete
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function TenantRowMenu({
  tenant,
  onEdit,
  onLink,
  onDelete,
}: {
  tenant: Tenant;
  onEdit: () => void;
  onLink: () => void;
  onDelete: () => void;
}) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [unlinkUser, { isLoading: unlinking }] = useUnlinkTenantUserMutation();
  const close = () => setAnchorEl(null);

  return (
    <>
      <IconButton size="small" onClick={(e) => setAnchorEl(e.currentTarget)}>
        <MoreVertRoundedIcon fontSize="small" />
      </IconButton>
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={close}>
        <MenuItem
          onClick={() => {
            close();
            onEdit();
          }}
        >
          <ListItemIcon>
            <EditOutlinedIcon fontSize="small" />
          </ListItemIcon>
          Edit details
        </MenuItem>
        {tenant.linkedUserId ? (
          <MenuItem
            disabled={unlinking}
            onClick={async () => {
              close();
              await unlinkUser(tenant.id).unwrap();
            }}
          >
            <ListItemIcon>
              <LinkOffRoundedIcon fontSize="small" />
            </ListItemIcon>
            Unlink user account
          </MenuItem>
        ) : (
          <MenuItem
            onClick={() => {
              close();
              onLink();
            }}
          >
            <ListItemIcon>
              <LinkRoundedIcon fontSize="small" />
            </ListItemIcon>
            Link user account
          </MenuItem>
        )}
        <MenuItem
          onClick={() => {
            close();
            onDelete();
          }}
          sx={{ color: "error.main" }}
        >
          <ListItemIcon sx={{ color: "error.main" }}>
            <DeleteOutlineRoundedIcon fontSize="small" />
          </ListItemIcon>
          Delete tenant
        </MenuItem>
      </Menu>
    </>
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
  const [editTenant, setEditTenant] = useState<Tenant | null>(null);
  const [linkTenant, setLinkTenant] = useState<Tenant | null>(null);
  const [deleteTenant, setDeleteTenant] = useState<Tenant | null>(null);
  const [leaseDialogTenant, setLeaseDialogTenant] = useState<Tenant | null>(null);
  const navigate = useNavigate();
  const currentUser = useAppSelector((state) => state.auth.user);

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
            <TableCell>Contact</TableCell>
            <TableCell>Account</TableCell>
            <TableCell>Lease</TableCell>
            <TableCell align="right">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {tenants.map((tenant) => {
            const activeLease = leases.find((l) => l.tenant === tenant.id && l.status === "active");
            const isSelf = tenant.linkedUserId === currentUser?.id;
            return (
              <TableRow key={tenant.id} hover>
                <TableCell>
                  <Box
                    component="button"
                    onClick={() => navigate(`/tenants/${tenant.id}`)}
                    sx={{
                      p: 0,
                      border: 0,
                      bgcolor: "transparent",
                      font: "inherit",
                      color: "primary.main",
                      fontWeight: 600,
                      cursor: "pointer",
                      "&:hover": { textDecoration: "underline" },
                    }}
                  >
                    {tenant.name}
                  </Box>
                  {isSelf && <Chip size="small" label="You" sx={{ ml: 1 }} />}
                </TableCell>
                <TableCell>
                  <Typography variant="body2">{tenant.email}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {tenant.phone}
                  </Typography>
                </TableCell>
                <TableCell>
                  {tenant.linkedUserId ? (
                    <Chip
                      size="small"
                      color="success"
                      variant="outlined"
                      label={isSelf ? "You" : tenant.linkedUserName ?? "Linked"}
                    />
                  ) : (
                    <Chip size="small" label="Not linked" />
                  )}
                </TableCell>
                <TableCell>
                  {activeLease ? (
                    <Chip size="small" color="success" label="Active" />
                  ) : (
                    <Chip size="small" label="No active lease" />
                  )}
                </TableCell>
                <TableCell align="right">
                  <Stack direction="row" spacing={0.5} justifyContent="flex-end" alignItems="center">
                    {activeLease ? (
                      <Button size="small" onClick={() => navigate(`/leases/${activeLease.id}`)}>
                        View Ledger
                      </Button>
                    ) : (
                      <Button size="small" onClick={() => setLeaseDialogTenant(tenant)}>
                        New Lease
                      </Button>
                    )}
                    <TenantRowMenu
                      tenant={tenant}
                      onEdit={() => setEditTenant(tenant)}
                      onLink={() => setLinkTenant(tenant)}
                      onDelete={() => setDeleteTenant(tenant)}
                    />
                  </Stack>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      <TenantFormDialog open={addTenantOpen} onClose={() => setAddTenantOpen(false)} />
      {editTenant && (
        <TenantFormDialog
          open={Boolean(editTenant)}
          tenant={editTenant}
          onClose={() => setEditTenant(null)}
        />
      )}
      {linkTenant && (
        <LinkUserDialog
          tenant={linkTenant}
          open={Boolean(linkTenant)}
          onClose={() => setLinkTenant(null)}
        />
      )}
      {deleteTenant && (
        <DeleteTenantDialog
          tenant={deleteTenant}
          open={Boolean(deleteTenant)}
          onClose={() => setDeleteTenant(null)}
        />
      )}
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
