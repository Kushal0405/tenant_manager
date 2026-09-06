import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AddIcon from "@mui/icons-material/Add";
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
import type {
  MeterKind,
  MeterType,
  Property,
  PropertyRole,
  PropertyType,
  RentFrequency,
  Unit,
} from "@rent-manager/shared";
import { useListLeasesQuery } from "../api/leasesApi";
import { useCreateMeterMutation, useListMetersQuery } from "../api/metersApi";
import { useCreatePropertyMutation, useListPropertiesQuery } from "../api/propertiesApi";
import { useCreateUnitMutation, useListUnitsQuery } from "../api/unitsApi";
import { formatMoney, parseMoneyToMinor } from "../utils/money";
import { estimateBackfillPeriods, FREQUENCY_LABELS } from "../utils/rentFrequency";

const PROPERTY_TYPE_LABELS: Record<PropertyType, string> = {
  flat: "Flat (building)",
  hall: "Hall",
  plot: "Plot",
  shop: "Shop",
};

function AddPropertyDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const navigate = useNavigate();
  const [myRole, setMyRole] = useState<PropertyRole>("owner");
  const [name, setName] = useState("");
  const [type, setType] = useState<PropertyType>("flat");
  const [numberOfFloors, setNumberOfFloors] = useState("2");
  const [line1, setLine1] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [zip, setZip] = useState("");
  const [country, setCountry] = useState("India");

  // Lessee-only fields: who the landlord is, and the terms of the rent I pay them.
  const [landlordName, setLandlordName] = useState("");
  const [landlordPhone, setLandlordPhone] = useState("");
  const [landlordEmail, setLandlordEmail] = useState("");
  const [tenantPhone, setTenantPhone] = useState("");
  const [rent, setRent] = useState("");
  const [deposit, setDeposit] = useState("0");
  const [rentFrequency, setRentFrequency] = useState<RentFrequency>("monthly");
  const [dueDayOfMonth, setDueDayOfMonth] = useState("5");
  const [startDate, setStartDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() + 1);
    return d.toISOString().slice(0, 10);
  });

  const [createProperty, { isLoading, error }] = useCreatePropertyMutation();

  const isOwner = myRole === "owner";
  const isFlat = type === "flat";
  const backfillPeriods = isOwner ? 0 : estimateBackfillPeriods(startDate, rentFrequency);

  function reset() {
    setName("");
    setLine1("");
    setCity("");
    setState("");
    setZip("");
    setLandlordName("");
    setLandlordPhone("");
    setLandlordEmail("");
    setTenantPhone("");
    setRent("");
  }

  async function handleSubmit() {
    const result = await createProperty({
      name,
      type,
      myRole,
      numberOfFloors: isOwner && isFlat ? Number(numberOfFloors) : undefined,
      address: { line1, city, state, zip, country },
      landlord: isOwner
        ? undefined
        : { name: landlordName, phone: landlordPhone || undefined, email: landlordEmail || undefined },
      selfLease: isOwner
        ? undefined
        : {
            tenantPhone,
            rentAmountMinor: parseMoneyToMinor(rent),
            depositAmountMinor: parseMoneyToMinor(deposit),
            startDate,
            endDate,
            dueDayOfMonth: Number(dueDayOfMonth),
            rentFrequency,
          },
    }).unwrap();

    onClose();
    reset();
    if (result.lease) navigate(`/leases/${result.lease.id}`);
  }

  const canSubmit = isOwner
    ? Boolean(name && line1 && city && (!isFlat || numberOfFloors))
    : Boolean(name && line1 && city && landlordName && tenantPhone && rent);

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Add Property</DialogTitle>
      <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
        <Tabs value={myRole} onChange={(_e, v) => setMyRole(v)}>
          <Tab label="I own this property" value="owner" />
          <Tab label="I'm renting this property" value="lessee" />
        </Tabs>

        <TextField label="Name" value={name} onChange={(e) => setName(e.target.value)} fullWidth />
        <TextField select label="Type" value={type} onChange={(e) => setType(e.target.value as PropertyType)} fullWidth>
          {(Object.keys(PROPERTY_TYPE_LABELS) as PropertyType[]).map((t) => (
            <MenuItem key={t} value={t}>
              {PROPERTY_TYPE_LABELS[t]}
            </MenuItem>
          ))}
        </TextField>
        {isOwner && isFlat && (
          <TextField
            label="Number of floors"
            type="number"
            value={numberOfFloors}
            onChange={(e) => setNumberOfFloors(e.target.value)}
            fullWidth
          />
        )}
        {isOwner && !isFlat && (
          <Typography variant="caption" color="text.secondary">
            {PROPERTY_TYPE_LABELS[type]}s are tracked as a single rentable unit — no floors needed.
          </Typography>
        )}
        <TextField label="Address line 1" value={line1} onChange={(e) => setLine1(e.target.value)} fullWidth />
        <Stack direction="row" spacing={2}>
          <TextField label="City" value={city} onChange={(e) => setCity(e.target.value)} fullWidth />
          <TextField label="State" value={state} onChange={(e) => setState(e.target.value)} fullWidth />
        </Stack>
        <Stack direction="row" spacing={2}>
          <TextField label="ZIP" value={zip} onChange={(e) => setZip(e.target.value)} fullWidth />
          <TextField label="Country" value={country} onChange={(e) => setCountry(e.target.value)} fullWidth />
        </Stack>

        {!isOwner && (
          <>
            <Divider />
            <Typography variant="subtitle2">Landlord</Typography>
            <TextField label="Landlord name" value={landlordName} onChange={(e) => setLandlordName(e.target.value)} fullWidth />
            <Stack direction="row" spacing={2}>
              <TextField label="Landlord phone (optional)" value={landlordPhone} onChange={(e) => setLandlordPhone(e.target.value)} fullWidth />
              <TextField label="Landlord email (optional)" value={landlordEmail} onChange={(e) => setLandlordEmail(e.target.value)} fullWidth />
            </Stack>

            <Divider />
            <Typography variant="subtitle2">My rent</Typography>
            <TextField label="My phone" value={tenantPhone} onChange={(e) => setTenantPhone(e.target.value)} fullWidth />
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
            <TextField
              label="Due day of month"
              type="number"
              value={dueDayOfMonth}
              onChange={(e) => setDueDayOfMonth(e.target.value)}
              fullWidth
            />
            {backfillPeriods > 0 && (
              <Alert severity="info">
                The rent start date is in the past — this will automatically generate {backfillPeriods} past{" "}
                {FREQUENCY_LABELS[rentFrequency].toLowerCase()} record{backfillPeriods === 1 ? "" : "s"}, marked
                as paid, so your rent history is all there from day one.
              </Alert>
            )}
          </>
        )}
        {error && <Alert severity="error">Could not add the property.</Alert>}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" disabled={!canSubmit || isLoading} onClick={handleSubmit}>
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function AddUnitDialog({ property, open, onClose }: { property: Property; open: boolean; onClose: () => void }) {
  const isFlat = property.type === "flat";
  const [label, setLabel] = useState("");
  const [floor, setFloor] = useState("1");
  const [bedrooms, setBedrooms] = useState("1");
  const [bathrooms, setBathrooms] = useState("1");
  const [sqft, setSqft] = useState("500");
  const [rent, setRent] = useState("");
  const [createUnit, { isLoading }] = useCreateUnitMutation();

  async function handleSubmit() {
    await createUnit({
      property: property.id,
      label,
      floor: isFlat ? Number(floor) : undefined,
      bedrooms: Number(bedrooms),
      bathrooms: Number(bathrooms),
      sqft: Number(sqft),
      baseRentMinor: parseMoneyToMinor(rent),
    }).unwrap();
    onClose();
    setLabel("");
    setRent("");
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>Add Unit to {property.name}</DialogTitle>
      <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
        <TextField label="Unit label" value={label} onChange={(e) => setLabel(e.target.value)} fullWidth />
        {isFlat && (
          <TextField
            select
            label="Floor"
            value={floor}
            onChange={(e) => setFloor(e.target.value)}
            fullWidth
          >
            {Array.from({ length: property.numberOfFloors ?? 1 }, (_, i) => i + 1).map((f) => (
              <MenuItem key={f} value={f}>
                Floor {f}
              </MenuItem>
            ))}
          </TextField>
        )}
        <Stack direction="row" spacing={2}>
          <TextField
            label="Bedrooms"
            type="number"
            value={bedrooms}
            onChange={(e) => setBedrooms(e.target.value)}
            fullWidth
          />
          <TextField
            label="Bathrooms"
            type="number"
            value={bathrooms}
            onChange={(e) => setBathrooms(e.target.value)}
            fullWidth
          />
        </Stack>
        <TextField label="Sqft" type="number" value={sqft} onChange={(e) => setSqft(e.target.value)} fullWidth />
        <TextField
          label="Base rent (₹)"
          type="number"
          value={rent}
          onChange={(e) => setRent(e.target.value)}
          fullWidth
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" disabled={!label || !rent || isLoading} onClick={handleSubmit}>
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function AddMeterDialog({
  property,
  units,
  open,
  onClose,
}: {
  property: Property;
  units: Unit[];
  open: boolean;
  onClose: () => void;
}) {
  const [kind, setKind] = useState<MeterKind>("main");
  const [utilityType, setUtilityType] = useState<MeterType>("electricity");
  const [unitId, setUnitId] = useState("");
  const [label, setLabel] = useState("");
  const [meterNumber, setMeterNumber] = useState("");
  const { data: mainMeters = [] } = useListMetersQuery({ property: property.id, kind: "main" });
  const [createMeter, { isLoading, error }] = useCreateMeterMutation();

  const matchingMainMeter = mainMeters.find((m) => m.utilityType === utilityType);

  async function handleSubmit() {
    await createMeter({
      property: property.id,
      kind,
      utilityType,
      unit: kind === "sub" ? unitId : undefined,
      parentMeter: kind === "sub" ? matchingMainMeter?.id : undefined,
      label,
      meterNumber: meterNumber || undefined,
    }).unwrap();
    onClose();
    setLabel("");
    setMeterNumber("");
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>Add Meter to {property.name}</DialogTitle>
      <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
        <TextField select label="Meter type" value={kind} onChange={(e) => setKind(e.target.value as MeterKind)} fullWidth>
          <MenuItem value="main">Main (covers the whole property)</MenuItem>
          <MenuItem value="sub">Sub (covers one unit)</MenuItem>
        </TextField>
        <TextField
          select
          label="Utility"
          value={utilityType}
          onChange={(e) => setUtilityType(e.target.value as MeterType)}
          fullWidth
        >
          <MenuItem value="electricity">Electricity</MenuItem>
          <MenuItem value="water">Water</MenuItem>
          <MenuItem value="gas">Gas</MenuItem>
        </TextField>
        {kind === "sub" && (
          <>
            <TextField select label="Unit" value={unitId} onChange={(e) => setUnitId(e.target.value)} fullWidth>
              {units.map((u) => (
                <MenuItem key={u.id} value={u.id}>
                  {u.label}
                </MenuItem>
              ))}
            </TextField>
            {!matchingMainMeter && (
              <Typography variant="caption" color="error">
                Add a main {utilityType} meter for this property first.
              </Typography>
            )}
          </>
        )}
        <TextField label="Label" value={label} onChange={(e) => setLabel(e.target.value)} fullWidth />
        <TextField label="Meter number (optional)" value={meterNumber} onChange={(e) => setMeterNumber(e.target.value)} fullWidth />
        {error && <Typography color="error" variant="body2">Could not add the meter.</Typography>}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          variant="contained"
          disabled={isLoading || !label || (kind === "sub" && (!unitId || !matchingMainMeter))}
          onClick={handleSubmit}
        >
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function MetersSection({ property, units }: { property: Property; units: Unit[] }) {
  const { data: meters = [] } = useListMetersQuery({ property: property.id });
  const [addMeterOpen, setAddMeterOpen] = useState(false);

  function unitLabel(unitId?: string) {
    return units.find((u) => u.id === unitId)?.label ?? "—";
  }

  return (
    <Box sx={{ mt: 2 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="subtitle2">Meters</Typography>
        <Button size="small" startIcon={<AddIcon />} onClick={() => setAddMeterOpen(true)}>
          Add Meter
        </Button>
      </Stack>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Label</TableCell>
            <TableCell>Kind</TableCell>
            <TableCell>Utility</TableCell>
            <TableCell>Unit</TableCell>
            <TableCell>Meter #</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {meters.map((meter) => (
            <TableRow key={meter.id}>
              <TableCell>{meter.label}</TableCell>
              <TableCell>
                <Chip size="small" label={meter.kind} color={meter.kind === "main" ? "primary" : "default"} />
              </TableCell>
              <TableCell>{meter.utilityType}</TableCell>
              <TableCell>{meter.kind === "sub" ? unitLabel(meter.unit) : "Whole property"}</TableCell>
              <TableCell>{meter.meterNumber ?? "—"}</TableCell>
            </TableRow>
          ))}
          {meters.length === 0 && (
            <TableRow>
              <TableCell colSpan={5}>
                <Typography color="text.secondary" variant="body2">No meters yet.</Typography>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      <AddMeterDialog property={property} units={units} open={addMeterOpen} onClose={() => setAddMeterOpen(false)} />
    </Box>
  );
}

function LesseePropertyCard({ property, unit }: { property: Property; unit?: Unit }) {
  const navigate = useNavigate();
  const { data: leases = [] } = useListLeasesQuery(unit ? { unit: unit.id } : undefined);
  const lease = leases.find((l) => l.status === "active") ?? leases[0];

  return (
    <Card variant="outlined">
      <CardContent>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
          <Box>
            <Typography variant="h6">{property.name}</Typography>
            <Typography variant="body2" color="text.secondary">
              {property.address.line1}, {property.address.city}, {property.address.state} {property.address.zip}
            </Typography>
            <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
              <Chip size="small" label={PROPERTY_TYPE_LABELS[property.type]} />
              <Chip size="small" color="secondary" label="I'm the lessee" />
            </Stack>
          </Box>
          {lease && (
            <Button size="small" onClick={() => navigate(`/leases/${lease.id}`)}>
              View My Rent Ledger
            </Button>
          )}
        </Stack>
        <Divider sx={{ my: 2 }} />
        <Typography variant="subtitle2" gutterBottom>
          Landlord
        </Typography>
        <Typography variant="body2">
          {property.landlordName}
          {property.landlordPhone ? ` — ${property.landlordPhone}` : ""}
          {property.landlordEmail ? ` — ${property.landlordEmail}` : ""}
        </Typography>
        {unit && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Rent: {formatMoney(unit.baseRentMinor)} ({lease ? FREQUENCY_LABELS[lease.rentFrequency] : "—"})
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}

function OwnerPropertyCard({ property }: { property: Property }) {
  const { data: units = [] } = useListUnitsQuery({ property: property.id });
  const [addUnitOpen, setAddUnitOpen] = useState(false);

  return (
    <Card variant="outlined">
      <CardContent>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
          <Box>
            <Typography variant="h6">{property.name}</Typography>
            <Typography variant="body2" color="text.secondary">
              {property.address.line1}, {property.address.city}, {property.address.state} {property.address.zip}
            </Typography>
            <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
              <Chip size="small" label={PROPERTY_TYPE_LABELS[property.type]} />
              {property.type === "flat" && (
                <Chip size="small" variant="outlined" label={`${property.numberOfFloors} floors`} />
              )}
            </Stack>
          </Box>
          <Button size="small" startIcon={<AddIcon />} onClick={() => setAddUnitOpen(true)}>
            Add Unit
          </Button>
        </Stack>

        <Table size="small" sx={{ mt: 2 }}>
          <TableHead>
            <TableRow>
              <TableCell>Unit</TableCell>
              {property.type === "flat" && <TableCell>Floor</TableCell>}
              <TableCell>Beds/Baths</TableCell>
              <TableCell>Sqft</TableCell>
              <TableCell>Base rent</TableCell>
              <TableCell>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {units.map((unit) => (
              <TableRow key={unit.id}>
                <TableCell>{unit.label}</TableCell>
                {property.type === "flat" && <TableCell>{unit.floor ?? "—"}</TableCell>}
                <TableCell>
                  {unit.bedrooms} / {unit.bathrooms}
                </TableCell>
                <TableCell>{unit.sqft}</TableCell>
                <TableCell>{formatMoney(unit.baseRentMinor)}</TableCell>
                <TableCell>
                  <Chip
                    size="small"
                    label={unit.status}
                    color={unit.status === "occupied" ? "success" : "default"}
                  />
                </TableCell>
              </TableRow>
            ))}
            {units.length === 0 && (
              <TableRow>
                <TableCell colSpan={property.type === "flat" ? 6 : 5}>
                  <Typography color="text.secondary" variant="body2">
                    No units yet.
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        <Divider sx={{ my: 2 }} />
        <MetersSection property={property} units={units} />
      </CardContent>
      <AddUnitDialog property={property} open={addUnitOpen} onClose={() => setAddUnitOpen(false)} />
    </Card>
  );
}

function PropertyCard({ property }: { property: Property }) {
  const { data: units = [] } = useListUnitsQuery({ property: property.id });

  if (property.myRole === "lessee") {
    return <LesseePropertyCard property={property} unit={units[0]} />;
  }
  return <OwnerPropertyCard property={property} />;
}

export default function Properties() {
  const { data: properties = [], isLoading } = useListPropertiesQuery();
  const [addPropertyOpen, setAddPropertyOpen] = useState(false);

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Typography variant="h4">Properties</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setAddPropertyOpen(true)}>
          Add Property
        </Button>
      </Stack>

      {isLoading && <Typography>Loading…</Typography>}

      <Stack spacing={2}>
        {properties.map((property) => (
          <PropertyCard key={property.id} property={property} />
        ))}
      </Stack>

      <AddPropertyDialog open={addPropertyOpen} onClose={() => setAddPropertyOpen(false)} />
    </Box>
  );
}
