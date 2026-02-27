import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { Layout } from "./components/layout/Layout";
import { ProtectedRoute } from "./components/layout/ProtectedRoute";
import { Dashboard } from "./pages/Dashboard";
import { Users } from "./pages/Users";
import { Courses } from "./pages/Courses";
import { Files } from "./pages/Files";
import { CourseMonitor } from "./pages/CourseMonitor";
import { Portfolio } from "./pages/Portfolio";
import { Products } from "./pages/Products";
import { RevitFiles } from "./pages/RevitFiles";
import { Resources } from "./pages/Resources";
import { DaharPDF } from "./pages/DaharPDF";
import { TerraSim } from "./pages/TerraSim";
import { Cashflow } from "./pages/Cashflow";
import { CashflowReport } from "./pages/CashflowReport";
import { CourseReport } from "./pages/CourseReport";
import { Software } from "./pages/Software";
import { Settings } from "./pages/Settings";
import { Login } from "./pages/Login";
import { ProductPayment } from "./pages/ProductPayment";
import { PromotionalEmail } from "./pages/PromotionalEmail";
import { ServerMonitor } from "./pages/ServerMonitor";
import { PaperLinker } from "./pages/PaperLinker";
import { EngineeringLog } from "./pages/EngineeringLog";
import { DerivationTracker } from "./pages/DerivationTracker";
import { Bibliography } from "./pages/Bibliography";
import { Documentation } from "./pages/Documentation";
import { SecondBrain } from "./pages/SecondBrain";
import { GeotechVisualizer } from "./pages/GeotechVisualizer";
import { BlogMonitor } from "./pages/BlogMonitor";
import { DELinkMonitor } from "./pages/DELinkMonitor";
import { Chat } from "./pages/Chat";
import { ChatProvider } from "./contexts/ChatContext";

// Temporary placeholder components for routes

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />

        {/* Protected Dashboard Routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={
            <ChatProvider>
              <Layout />
            </ChatProvider>
          }>
            <Route index element={<Dashboard />} />
            <Route path="users" element={<Users />} />
            <Route path="course-monitor" element={<CourseMonitor />} />
            <Route path="courses" element={<Courses />} />
            <Route path="files" element={<Files />} />
            <Route path="portfolio" element={<Portfolio />} />
            <Route path="products" element={<Products />} />
            <Route path="revit-files" element={<RevitFiles />} />
            <Route path="resources" element={<Resources />} />
            <Route path="daharpdf" element={<DaharPDF />} />
            <Route path="terrasim" element={<TerraSim />} />
            <Route path="cashflow" element={<Cashflow />} />
            <Route path="cashflow-report" element={<CashflowReport />} />
            <Route path="course-report" element={<CourseReport />} />
            <Route path="product-payment" element={<ProductPayment />} />
            <Route path="promotional-email" element={<PromotionalEmail />} />
            <Route path="software" element={<Software />} />
            <Route path="server-monitor" element={<ServerMonitor />} />
            <Route path="paper-linker" element={<PaperLinker />} />
            <Route path="engineering-log" element={<EngineeringLog />} />
            <Route path="derivations" element={<DerivationTracker />} />
            <Route path="bibliography" element={<Bibliography />} />
            <Route path="documentation" element={<Documentation />} />
            <Route path="second-brain" element={<SecondBrain />} />
            <Route path="geotech-visualizer" element={<GeotechVisualizer />} />
            <Route path="blog-monitor" element={<BlogMonitor />} />
            <Route path="delink-monitor" element={<DELinkMonitor />} />
            <Route path="chat" element={<Chat />} />
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
