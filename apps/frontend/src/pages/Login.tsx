import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useLoginMutation, useRegisterMutation } from "../api/authApi";
import { useAppDispatch } from "../app/hooks";
import { setCredentials } from "../features/auth/authSlice";

export default function Login() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("demo@rentmanager.test");
  const [password, setPassword] = useState("password123");

  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [login, loginState] = useLoginMutation();
  const [register, registerState] = useRegisterMutation();

  const error = loginState.error || registerState.error;
  const isLoading = loginState.isLoading || registerState.isLoading;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      const result =
        mode === "login"
          ? await login({ email, password }).unwrap()
          : await register({ name, email, password }).unwrap();
      dispatch(setCredentials(result));
      navigate("/dashboard");
    } catch {
      // error is surfaced via loginState/registerState.error below
    }
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: "grey.100",
      }}
    >
      <Paper sx={{ p: 4, width: 380 }} elevation={3}>
        <Typography variant="h5" gutterBottom>
          Property Rent Manager
        </Typography>
        <Tabs value={mode} onChange={(_e, v) => setMode(v)} sx={{ mb: 2 }}>
          <Tab label="Sign in" value="login" />
          <Tab label="Create account" value="register" />
        </Tabs>
        <Box component="form" onSubmit={handleSubmit} sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {mode === "register" && (
            <TextField label="Name" value={name} onChange={(e) => setName(e.target.value)} required fullWidth />
          )}
          <TextField
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            fullWidth
          />
          <TextField
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            fullWidth
          />
          {error && <Alert severity="error">Something went wrong. Check your credentials.</Alert>}
          <Button type="submit" variant="contained" disabled={isLoading}>
            {mode === "login" ? "Sign in" : "Create account"}
          </Button>
        </Box>
        {mode === "login" && (
          <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: "block" }}>
            Demo login is pre-filled — run the seed script first (npm run seed).
          </Typography>
        )}
      </Paper>
    </Box>
  );
}
