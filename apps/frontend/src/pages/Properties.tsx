import { useState } from "react";
import AddIcon from "@mui/icons-material/Add";
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
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import type { MeterKind, MeterType, Property, PropertyType, Unit } from "@rent-manager/shared";
import { useCreateMeterMutation, useListMetersQuery } from "../api/metersApi";
import { useCreatePropertyMutation, useListPropertiesQuery } from "../api/propertiesApi";
import { useCreateUnitMutation, useListUnitsQuery } from "../api/unitsApi";
import { formatMoney, parseMoneyToMinor } from "../utils/money";

const PROPERTY_TYPE_LABELS: Record<PropertyType, string> = {
  flat: "Flat (building)",
  hall: "Hall",
  plot: "Plot",
  shop: "Shop",
};

function AddPropertyDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [name, setName] = useState("");
  const [type, setType] = useState<PropertyType>("flat");
  const [numberOfFloors, setNumberOfFloors] = useState("2");
  const [line1, setLine1] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [zip, setZip] = useState("");
  const [country, setCountry] = useState("India");
  const [createProperty, { isLoading }] = useCreatePropertyMutation();

  const isFlat = type === "flat";

  async function handleSubmit() {
    await createProperty({
      name,
      type,
      numberOfFloors: isFlat ? Number(numberOfFloors) : undefined,
      address: { line1, city, state, zip, country },
    }).unwrap();
    onClose();
    setName("");
    setLine1("");
    setCity("");
    setState("");
    setZip("");
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Add Property</DialogTitle>
      <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
        <TextField label="Name" value={name} onChange={(e) => setName(e.target.value)} fullWidth />
        <TextField select label="Type" value={type} onChange={(e) => setType(e.target.value as PropertyType)} fullWidth>
          {(Object.keys(PROPERTY_TYPE_LABELS) as PropertyType[]).map((t) => (
            <MenuItem key={t} value={t}>
              {PROPERTY_TYPE_LABELS[t]}
            </MenuItem>
          ))}
        </TextField>
        {isFlat && (
          <TextField
            label="Number of floors"
            type="number"
            value={numberOfFloors}
            onChange={(e) => setNumberOfFloors(e.target.value)}
            fullWidth
          />
        )}
        {!isFlat && (
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
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          variant="contained"
          disabled={!name || !line1 || !city || (isFlat && !numberOfFloors) || isLoading}
          onClick={handleSubmit}
        >
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

function PropertyCard({ property }: { property: Property }) {
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
