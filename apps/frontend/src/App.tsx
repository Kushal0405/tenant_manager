import { Navigate, Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import RequireAuth from "./components/RequireAuth";
import Billing from "./pages/Billing";
import Dashboard from "./pages/Dashboard";
import Expenses from "./pages/Expenses";
import LeaseLedger from "./pages/LeaseLedger";
import Login from "./pages/Login";
import Properties from "./pages/Properties";
import Reports from "./pages/Reports";
import Tenants from "./pages/Tenants";

export default function App() {
  return (
    <Routes>
      <Route path="login" element={<Login />} />
      <Route element={<RequireAuth />}>
        <Route element={<Layout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="properties" element={<Properties />} />
          <Route path="tenants" element={<Tenants />} />
          <Route path="leases/:id" element={<LeaseLedger />} />
          <Route path="billing" element={<Billing />} />
          <Route path="expenses" element={<Expenses />} />
          <Route path="reports" element={<Reports />} />
        </Route>
      </Route>
    </Routes>
  );
}
