import { useState } from "react";
import { Link as RouterLink, useNavigate, useParams } from "react-router-dom";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import LinkOffRoundedIcon from "@mui/icons-material/LinkOffRounded";
import LinkRoundedIcon from "@mui/icons-material/LinkRounded";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import Grid from "@mui/material/Grid";
import Link from "@mui/material/Link";
import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";
import type { LeaseStatus, TenantLeaseSummary } from "@rent-manager/shared";
import {
  useGetTenantQuery,
  useUnlinkTenantUserMutation,
} from "../api/tenantsApi";
import { formatMoney } from "../utils/money";
import { FREQUENCY_LABELS } from "../utils/rentFrequency";

const LEASE_STATUS_COLOR: Record<LeaseStatus, "success" | "default" | "error"> = {
  active: "success",
  expired: "default",
  terminated: "error",
};

function Field({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <Box>
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ textTransform: "uppercase", letterSpacing: "0.04em", fontWeight: 600 }}
      >
        {label}
      </Typography>
      <Typography variant="body2" sx={{ mt: 0.25 }}>
        {value}
      </Typography>
    </Box>
  );
}

function SettlementNote({ leases }: { leases: TenantLeaseSummary[] }) {
  const terminated = leases.filter((l) => l.status === "terminated");
  if (terminated.length === 0) return null;

  const unsettled = terminated.filter(
    (l) => l.depositAmountMinor > 0 && (l.depositReturnedMinor ?? 0) === 0,
  );
  const owed = terminated.filter((l) => l.currentBalanceMinor > 0);

  if (unsettled.length === 0 && owed.length === 0) {
    return (
      <Card sx={{ borderColor: "success.main" }}>
        <CardContent>
          <Typography variant="subtitle2" color="success.main">
            All past agreements settled
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Deposits returned and balances cleared on every terminated lease.
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card sx={{ borderColor: "warning.main" }}>
      <CardContent>
        <Typography variant="subtitle2" color="warning.main">
          Settlement pending
        </Typography>
        {unsettled.map((l) => (
          <Typography key={l.leaseId} variant="body2" color="text.secondary">
            {l.unitLabel} ({l.propertyName}): deposit of {formatMoney(l.depositAmountMinor)} not yet
            returned.
          </Typography>
        ))}
        {owed.map((l) => (
          <Typography key={`bal-${l.leaseId}`} variant="body2" color="text.secondary">
            {l.unitLabel} ({l.propertyName}): outstanding balance of{" "}
            {formatMoney(l.currentBalanceMinor)}.
          </Typography>
        ))}
      </CardContent>
    </Card>
  );
}

export default function TenantDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: tenant, isLoading } = useGetTenantQuery(id!);
  const [unlinkUser, { isLoading: unlinking }] = useUnlinkTenantUserMutation();
  const [showLinkHint, setShowLinkHint] = useState(false);

  if (isLoading) return <Typography>Loading…</Typography>;
  if (!tenant) return <Typography>Tenant not found.</Typography>;

  const activeLeases = tenant.leases.filter((l) => l.status === "active");
  const pastLeases = tenant.leases.filter((l) => l.status !== "active");

  return (
    <Box>
      <Button
        size="small"
        startIcon={<ArrowBackRoundedIcon />}
        onClick={() => navigate("/tenants")}
        sx={{ mb: 1 }}
      >
        Tenants
      </Button>

      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 2 }}>
        <Box>
          <Typography variant="h4">{tenant.name}</Typography>
          <Typography color="text.secondary">
            {tenant.email} · {tenant.phone}
          </Typography>
        </Box>
        <Stack direction="row" spacing={1} alignItems="center">
          {tenant.linkedUserId ? (
            <Button
              size="small"
              variant="outlined"
              startIcon={<LinkOffRoundedIcon />}
              disabled={unlinking}
              onClick={() => unlinkUser(tenant.id)}
            >
              Unlink account
            </Button>
          ) : (
            <Button
              size="small"
              variant="outlined"
              startIcon={<LinkRoundedIcon />}
              onClick={() => setShowLinkHint(true)}
            >
              Link account
            </Button>
          )}
          <Button
            size="small"
            variant="outlined"
            startIcon={<EditOutlinedIcon />}
            component={RouterLink}
            to="/tenants"
          >
            Edit
          </Button>
        </Stack>
      </Stack>

      {showLinkHint && !tenant.linkedUserId && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Use the row menu on the Tenants list to link or invite a user account.
        </Typography>
      )}

      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={12} md={7}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Profile
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Field label="Email" value={tenant.email} />
                </Grid>
                <Grid item xs={6}>
                  <Field label="Phone" value={tenant.phone} />
                </Grid>
                <Grid item xs={6}>
                  <Field label="Alternate phone" value={tenant.alternatePhone} />
                </Grid>
                <Grid item xs={6}>
                  <Field
                    label="ID proof"
                    value={
                      tenant.idProofType || tenant.idProofNumber
                        ? `${tenant.idProofType ?? ""} ${tenant.idProofNumber ?? ""}`.trim()
                        : undefined
                    }
                  />
                </Grid>
                <Grid item xs={12}>
                  <Field
                    label="Linked account"
                    value={
                      tenant.linkedUserId
                        ? `${tenant.linkedUserName ?? "User"}${
                            tenant.linkedUserEmail ? ` <${tenant.linkedUserEmail}>` : ""
                          }`
                        : "Not linked"
                    }
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={5}>
          <SettlementNote leases={tenant.leases} />
        </Grid>
      </Grid>

      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Current agreements
          </Typography>
          <LeaseTable
            rows={activeLeases}
            emptyText="No active rental agreement."
            onOpen={(leaseId) => navigate(`/leases/${leaseId}`)}
          />
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Association history
          </Typography>
          <LeaseTable
            rows={pastLeases}
            emptyText="No past agreements."
            onOpen={(leaseId) => navigate(`/leases/${leaseId}`)}
          />
        </CardContent>
      </Card>
    </Box>
  );
}

function LeaseTable({
  rows,
  emptyText,
  onOpen,
}: {
  rows: TenantLeaseSummary[];
  emptyText: string;
  onOpen: (leaseId: string) => void;
}) {
  return (
    <Table size="small">
      <TableHead>
        <TableRow>
          <TableCell>Unit</TableCell>
          <TableCell>Property</TableCell>
          <TableCell>Term</TableCell>
          <TableCell align="right">Rent</TableCell>
          <TableCell align="right">Balance</TableCell>
          <TableCell>Status</TableCell>
          <TableCell align="right">Ledger</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {rows.map((l) => (
          <TableRow key={l.leaseId} hover>
            <TableCell>{l.unitLabel}</TableCell>
            <TableCell>
              {l.propertyId ? (
                <Link component={RouterLink} to={`/properties`} underline="hover">
                  {l.propertyName}
                </Link>
              ) : (
                l.propertyName
              )}
            </TableCell>
            <TableCell>
              {l.startDate.slice(0, 10)} → {l.endDate.slice(0, 10)}
            </TableCell>
            <TableCell align="right">
              {formatMoney(l.rentAmountMinor)}
              <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                {FREQUENCY_LABELS[l.rentFrequency]}
              </Typography>
            </TableCell>
            <TableCell align="right" sx={{ color: l.currentBalanceMinor > 0 ? "error.main" : undefined }}>
              {formatMoney(l.currentBalanceMinor)}
            </TableCell>
            <TableCell>
              <Chip size="small" label={l.status} color={LEASE_STATUS_COLOR[l.status]} />
            </TableCell>
            <TableCell align="right">
              <Button size="small" onClick={() => onOpen(l.leaseId)}>
                Open
              </Button>
            </TableCell>
          </TableRow>
        ))}
        {rows.length === 0 && (
          <TableRow>
            <TableCell colSpan={7}>
              <Typography variant="body2" color="text.secondary">
                {emptyText}
              </Typography>
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}
