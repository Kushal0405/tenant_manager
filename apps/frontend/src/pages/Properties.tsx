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
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import type { Property, PropertyType } from "@rent-manager/shared";
import { useCreatePropertyMutation, useListPropertiesQuery } from "../api/propertiesApi";
import { useCreateUnitMutation, useListUnitsQuery } from "../api/unitsApi";
import { formatMoney, parseMoneyToMinor } from "../utils/money";

function AddPropertyDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [name, setName] = useState("");
  const [type, setType] = useState<PropertyType>("residential");
  const [line1, setLine1] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [zip, setZip] = useState("");
  const [country, setCountry] = useState("India");
  const [createProperty, { isLoading }] = useCreatePropertyMutation();

  async function handleSubmit() {
    await createProperty({ name, type, address: { line1, city, state, zip, country } }).unwrap();
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
          <MenuItem value="residential">Residential</MenuItem>
          <MenuItem value="commercial">Commercial</MenuItem>
          <MenuItem value="mixed">Mixed</MenuItem>
        </TextField>
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
          disabled={!name || !line1 || !city || isLoading}
          onClick={handleSubmit}
        >
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function AddUnitDialog({ property, open, onClose }: { property: Property; open: boolean; onClose: () => void }) {
  const [label, setLabel] = useState("");
  const [bedrooms, setBedrooms] = useState("1");
  const [bathrooms, setBathrooms] = useState("1");
  const [sqft, setSqft] = useState("500");
  const [rent, setRent] = useState("");
  const [createUnit, { isLoading }] = useCreateUnitMutation();

  async function handleSubmit() {
    await createUnit({
      property: property.id,
      label,
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
            <Chip size="small" label={property.type} sx={{ mt: 1 }} />
          </Box>
          <Button size="small" startIcon={<AddIcon />} onClick={() => setAddUnitOpen(true)}>
            Add Unit
          </Button>
        </Stack>

        <Table size="small" sx={{ mt: 2 }}>
          <TableHead>
            <TableRow>
              <TableCell>Unit</TableCell>
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
                <TableCell colSpan={5}>
                  <Typography color="text.secondary" variant="body2">
                    No units yet.
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
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
