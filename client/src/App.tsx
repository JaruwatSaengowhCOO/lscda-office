import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import Login from "@/pages/Login";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";

// Public Pages
import Home from "./pages/public/Home";
import About from "./pages/public/About";
import OrgStructure from "./pages/public/OrgStructure";
import History from "./pages/public/History";
import Rules from "./pages/public/Rules";
import PrivacyPolicy from "./pages/public/PrivacyPolicy";
import PressReleases from "./pages/public/PressReleases";
import PressReleaseDetail from "./pages/public/PressReleaseDetail";
import PublicNotices from "./pages/public/PublicNotices";
import Careers from "./pages/public/Careers";
import CareerDetail from "./pages/public/CareerDetail";
import Contact from "./pages/public/Contact";
import SubmitTip from "./pages/public/SubmitTip";
import SubmitRequest from "./pages/public/SubmitRequest";
import CaseStatusCheck from "./pages/public/CaseStatusCheck";
import PublicDocuments from "./pages/public/PublicDocuments";

// Internal Pages
import Dashboard from "./pages/internal/Dashboard";
import CasesList from "./pages/internal/CasesList";
import CaseDetail from "./pages/internal/CaseDetail";
import CaseForm from "./pages/internal/CaseForm";
import DefendantsList from "./pages/internal/DefendantsList";
import DefendantDetail from "./pages/internal/DefendantDetail";
import ProsecutorsList from "./pages/internal/ProsecutorsList";
import CourtCalendar from "./pages/internal/CourtCalendar";
import WarrantsList from "./pages/internal/WarrantsList";
import EvidenceList from "./pages/internal/EvidenceList";
import LegalResearch from "./pages/internal/LegalResearch";
import VictimsList from "./pages/internal/VictimsList";
import ComplaintsList from "./pages/internal/ComplaintsList";
import PressReleasesAdmin from "./pages/internal/PressReleasesAdmin";
import DocumentsAdmin from "./pages/internal/DocumentsAdmin";
import CareersAdmin from "./pages/internal/CareersAdmin";
import Reports from "./pages/internal/Reports";
import StaffManagement from "./pages/internal/StaffManagement";
import Notifications from "./pages/internal/Notifications";

function Router() {
  return (
    <Switch>
      {/* Public Routes */}
      <Route path="/" component={Home} />
      <Route path="/about" component={About} />
      <Route path="/about/org-structure" component={OrgStructure} />
      <Route path="/about/history" component={History} />
      <Route path="/about/rules" component={Rules} />
      <Route path="/about/privacy-policy" component={PrivacyPolicy} />
      <Route path="/press-releases" component={PressReleases} />
      <Route path="/press-releases/:id" component={PressReleaseDetail} />
      <Route path="/notices" component={PublicNotices} />
      <Route path="/careers" component={Careers} />
      <Route path="/careers/:id" component={CareerDetail} />
      <Route path="/contact" component={Contact} />
      <Route path="/services/tip" component={SubmitTip} />
      <Route path="/services/request" component={SubmitRequest} />
      <Route path="/services/case-status" component={CaseStatusCheck} />
      <Route path="/services/documents" component={PublicDocuments} />

      {/* Internal Routes */}
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/dashboard/cases" component={CasesList} />
      <Route path="/dashboard/cases/new" component={CaseForm} />
      <Route path="/dashboard/cases/:id" component={CaseDetail} />
      <Route path="/dashboard/cases/:id/edit" component={CaseForm} />
      <Route path="/dashboard/defendants" component={DefendantsList} />
      <Route path="/dashboard/defendants/:id" component={DefendantDetail} />
      <Route path="/dashboard/prosecutors" component={ProsecutorsList} />
      <Route path="/dashboard/calendar" component={CourtCalendar} />
      <Route path="/dashboard/warrants" component={WarrantsList} />
      <Route path="/dashboard/evidence" component={EvidenceList} />
      <Route path="/dashboard/legal-research" component={LegalResearch} />
      <Route path="/dashboard/victims" component={VictimsList} />
      <Route path="/dashboard/complaints" component={ComplaintsList} />
      <Route path="/dashboard/press-releases" component={PressReleasesAdmin} />
      <Route path="/dashboard/documents" component={DocumentsAdmin} />
      <Route path="/dashboard/careers" component={CareersAdmin} />
      <Route path="/dashboard/reports" component={Reports} />
      <Route path="/dashboard/staff" component={StaffManagement} />
      <Route path="/dashboard/notifications" component={Notifications} />

      <Route path="/login" component={Login} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
