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
import Tab from "@mui/material/Tab";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Tabs from "@mui/material/Tabs";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import type { ExpenseCategory, TaxType } from "@rent-manager/shared";
import { useCreateExpenseMutation, useListExpensesQuery } from "../api/expensesApi";
import { useListPropertiesQuery } from "../api/propertiesApi";
import {
  useCreateTaxPaymentMutation,
  useListTaxPaymentsQuery,
  useMarkTaxPaymentPaidMutation,
} from "../api/taxPaymentsApi";
import { formatMoney, parseMoneyToMinor } from "../utils/money";

function AddExpenseDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { data: properties = [] } = useListPropertiesQuery();
  const [property, setProperty] = useState("");
  const [category, setCategory] = useState<ExpenseCategory>("repair");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState("");
  const [createExpense, { isLoading, error }] = useCreateExpenseMutation();

  async function handleSubmit() {
    await createExpense({ property, category, amountMinor: parseMoneyToMinor(amount), date, note: note || undefined }).unwrap();
    onClose();
    setAmount("");
    setNote("");
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>Add Expense</DialogTitle>
      <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
        <TextField select label="Property" value={property} onChange={(e) => setProperty(e.target.value)} fullWidth>
          {properties.map((p) => (
            <MenuItem key={p.id} value={p.id}>
              {p.name}
            </MenuItem>
          ))}
        </TextField>
        <TextField select label="Category" value={category} onChange={(e) => setCategory(e.target.value as ExpenseCategory)} fullWidth>
          <MenuItem value="repair">Repair</MenuItem>
          <MenuItem value="utility">Utility</MenuItem>
          <MenuItem value="tax">Tax</MenuItem>
          <MenuItem value="insurance">Insurance</MenuItem>
          <MenuItem value="management_fee">Management fee</MenuItem>
          <MenuItem value="other">Other</MenuItem>
        </TextField>
        <TextField label="Amount (₹)" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} fullWidth />
        <TextField
          label="Date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          InputLabelProps={{ shrink: true }}
          fullWidth
        />
        <TextField label="Note (optional)" value={note} onChange={(e) => setNote(e.target.value)} fullWidth />
        {error && <Alert severity="error">Could not add the expense.</Alert>}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" disabled={isLoading || !property || !amount} onClick={handleSubmit}>
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function AddTaxPaymentDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { data: properties = [] } = useListPropertiesQuery();
  const [property, setProperty] = useState("");
  const [taxType, setTaxType] = useState<TaxType>("property_tax");
  const [period, setPeriod] = useState("");
  const [amount, setAmount] = useState("");
  const [dueDate, setDueDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [createTaxPayment, { isLoading, error }] = useCreateTaxPaymentMutation();

  async function handleSubmit() {
    await createTaxPayment({ property, taxType, period, amountMinor: parseMoneyToMinor(amount), dueDate }).unwrap();
    onClose();
    setPeriod("");
    setAmount("");
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>Add Tax / Government Bill</DialogTitle>
      <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
        <TextField select label="Property" value={property} onChange={(e) => setProperty(e.target.value)} fullWidth>
          {properties.map((p) => (
            <MenuItem key={p.id} value={p.id}>
              {p.name}
            </MenuItem>
          ))}
        </TextField>
        <TextField select label="Type" value={taxType} onChange={(e) => setTaxType(e.target.value as TaxType)} fullWidth>
          <MenuItem value="property_tax">Property tax</MenuItem>
          <MenuItem value="gst">GST</MenuItem>
          <MenuItem value="tds">TDS</MenuItem>
          <MenuItem value="water_bill">Water board bill</MenuItem>
          <MenuItem value="electricity_bill">Electricity board bill</MenuItem>
          <MenuItem value="gas_bill">Gas board bill</MenuItem>
          <MenuItem value="other">Other</MenuItem>
        </TextField>
        <TextField
          label="Period"
          placeholder="e.g. 2025-2026 or 2026-Q1"
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          fullWidth
        />
        <TextField label="Amount (₹)" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} fullWidth />
        <TextField
          label="Due date"
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          InputLabelProps={{ shrink: true }}
          fullWidth
        />
        {error && <Alert severity="error">Could not add the tax payment.</Alert>}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" disabled={isLoading || !property || !period || !amount} onClick={handleSubmit}>
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function ExpensesTab() {
  const { data: expenses = [] } = useListExpensesQuery();
  const { data: properties = [] } = useListPropertiesQuery();
  const [open, setOpen] = useState(false);

  return (
    <Box>
      <Stack direction="row" justifyContent="flex-end" sx={{ mb: 2 }}>
        <Button variant="contained" onClick={() => setOpen(true)}>
          Add Expense
        </Button>
      </Stack>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Property</TableCell>
            <TableCell>Category</TableCell>
            <TableCell>Date</TableCell>
            <TableCell align="right">Amount</TableCell>
            <TableCell>Note</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {expenses.map((expense) => (
            <TableRow key={expense.id}>
              <TableCell>{properties.find((p) => p.id === expense.property)?.name ?? "—"}</TableCell>
              <TableCell>
                <Chip size="small" label={expense.category.replace("_", " ")} />
              </TableCell>
              <TableCell>{expense.date.slice(0, 10)}</TableCell>
              <TableCell align="right">{formatMoney(expense.amountMinor)}</TableCell>
              <TableCell>{expense.note ?? "—"}</TableCell>
            </TableRow>
          ))}
          {expenses.length === 0 && (
            <TableRow>
              <TableCell colSpan={5}>
                <Typography color="text.secondary" variant="body2">No expenses recorded yet.</Typography>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      <AddExpenseDialog open={open} onClose={() => setOpen(false)} />
    </Box>
  );
}

function TaxPaymentsTab() {
  const { data: taxPayments = [] } = useListTaxPaymentsQuery();
  const { data: properties = [] } = useListPropertiesQuery();
  const [open, setOpen] = useState(false);
  const [markPaid] = useMarkTaxPaymentPaidMutation();

  return (
    <Box>
      <Stack direction="row" justifyContent="flex-end" sx={{ mb: 2 }}>
        <Button variant="contained" onClick={() => setOpen(true)}>
          Add Tax / Government Bill
        </Button>
      </Stack>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Property</TableCell>
            <TableCell>Type</TableCell>
            <TableCell>Period</TableCell>
            <TableCell>Due date</TableCell>
            <TableCell align="right">Amount</TableCell>
            <TableCell>Status</TableCell>
            <TableCell align="right">Action</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {taxPayments.map((tax) => (
            <TableRow key={tax.id}>
              <TableCell>{properties.find((p) => p.id === tax.property)?.name ?? "—"}</TableCell>
              <TableCell>
                <Chip size="small" label={tax.taxType.replace("_", " ")} />
              </TableCell>
              <TableCell>{tax.period}</TableCell>
              <TableCell>{tax.dueDate.slice(0, 10)}</TableCell>
              <TableCell align="right">{formatMoney(tax.amountMinor)}</TableCell>
              <TableCell>
                <Chip
                  size="small"
                  label={tax.status}
                  color={tax.status === "paid" ? "success" : tax.status === "overdue" ? "error" : "default"}
                />
              </TableCell>
              <TableCell align="right">
                {tax.status !== "paid" && (
                  <Button
                    size="small"
                    onClick={() => markPaid({ id: tax.id, paidDate: new Date().toISOString().slice(0, 10) })}
                  >
                    Mark Paid
                  </Button>
                )}
              </TableCell>
            </TableRow>
          ))}
          {taxPayments.length === 0 && (
            <TableRow>
              <TableCell colSpan={7}>
                <Typography color="text.secondary" variant="body2">No tax payments recorded yet.</Typography>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      <AddTaxPaymentDialog open={open} onClose={() => setOpen(false)} />
    </Box>
  );
}

export default function Expenses() {
  const [tab, setTab] = useState(0);

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Expenses
      </Typography>
      <Tabs value={tab} onChange={(_e, v) => setTab(v)} sx={{ mb: 2 }}>
        <Tab label="Property Expenses" />
        <Tab label="Tax & Government Payments" />
      </Tabs>
      {tab === 0 ? <ExpensesTab /> : <TaxPaymentsTab />}
    </Box>
  );
}
