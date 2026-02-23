import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { Layout } from "./components/layout/Layout";
import { ProtectedRoute } from "./components/layout/ProtectedRoute";
import { Dashboard } from "./pages/Dashboard";
import { Users } from "./pages/Users";
import { Courses } from "./pages/Courses";
import { Files } from "./pages/Files";
import { Portfolio } from "./pages/Portfolio";
import { Products } from "./pages/Products";
import { RevitFiles } from "./pages/RevitFiles";
import { Resources } from "./pages/Resources";
import { DaharPDF } from "./pages/DaharPDF";
import { TerraSim } from "./pages/TerraSim";
import { Cashflow } from "./pages/Cashflow";
import { Software } from "./pages/Software";
import { Settings } from "./pages/Settings";
import { Login } from "./pages/Login";
import { ProductPayment } from "./pages/ProductPayment";

// Temporary placeholder components for routes

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />

        {/* Protected Dashboard Routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="users" element={<Users />} />
            <Route path="courses" element={<Courses />} />
            <Route path="files" element={<Files />} />
            <Route path="portfolio" element={<Portfolio />} />
            <Route path="products" element={<Products />} />
            <Route path="revit-files" element={<RevitFiles />} />
            <Route path="resources" element={<Resources />} />
            <Route path="daharpdf" element={<DaharPDF />} />
            <Route path="terrasim" element={<TerraSim />} />
            <Route path="cashflow" element={<Cashflow />} />
            <Route path="product-payment" element={<ProductPayment />} />
            <Route path="software" element={<Software />} />
            <Route path="settings" element={<Settings />} />
          </Route>
        </Route>

        {/* Fallback route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
