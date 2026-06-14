import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "./components/theme-provider";
import { Layout } from "./components/layout";
import { AuthGuard } from "./components/auth-guard";
import NotFound from "@/pages/not-found";

// Import pages
import Home from "./pages/home";
import Fixtures from "./pages/fixtures";
import Live from "./pages/live";
import Standings from "./pages/standings";
import Results from "./pages/results";
import Teams from "./pages/teams";
import Stats from "./pages/stats";
import AdminLogin from "./pages/admin/login";
import AdminDashboard from "./pages/admin/dashboard";
import AdminMatches from "./pages/admin/matches";
import AdminMatchDetail from "./pages/admin/match";
import AdminTeams from "./pages/admin/teams";
import About from "./pages/about";
import AdminTournament from "./pages/admin/tournament";
import Announcements from "./pages/announcements";
import AdminAnnouncements from "./pages/admin/announcements";
import AdminClubApplications from "./pages/admin/club-applications";
import AdminClubSettings from "./pages/admin/club-settings";
import Register from "./pages/register";
import JoinKsb from "./pages/join-ksb";
import RegisterTeam from "./pages/register-team";
import SquadPoster from "./pages/squad-poster";

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/">
        <Layout><Home /></Layout>
      </Route>
      <Route path="/fixtures">
        <Layout><Fixtures /></Layout>
      </Route>
      <Route path="/live">
        <Layout><Live /></Layout>
      </Route>
      <Route path="/standings">
        <Layout><Standings /></Layout>
      </Route>
      <Route path="/results">
        <Layout><Results /></Layout>
      </Route>
      <Route path="/teams">
        <Layout><Teams /></Layout>
      </Route>
      <Route path="/stats">
        <Layout><Stats /></Layout>
      </Route>
      <Route path="/about">
        <Layout><About /></Layout>
      </Route>
      <Route path="/announcements">
        <Layout><Announcements /></Layout>
      </Route>

      <Route path="/teams/:id">
        <SquadPoster />
      </Route>

      <Route path="/register">
        <Layout><JoinKsb /></Layout>
      </Route>
      <Route path="/register/team">
        <Layout><RegisterTeam /></Layout>
      </Route>

      <Route path="/admin">
        <Layout><AdminLogin /></Layout>
      </Route>
      
      <Route path="/admin/dashboard">
        <AuthGuard><Layout><AdminDashboard /></Layout></AuthGuard>
      </Route>
      <Route path="/admin/matches">
        <AuthGuard><Layout><AdminMatches /></Layout></AuthGuard>
      </Route>
      <Route path="/admin/match/:id">
        <AuthGuard><Layout><AdminMatchDetail /></Layout></AuthGuard>
      </Route>
      <Route path="/admin/teams">
        <AuthGuard><Layout><AdminTeams /></Layout></AuthGuard>
      </Route>
      <Route path="/admin/tournament">
        <AuthGuard><Layout><AdminTournament /></Layout></AuthGuard>
      </Route>
      <Route path="/admin/announcements">
        <AuthGuard><Layout><AdminAnnouncements /></Layout></AuthGuard>
      </Route>
      <Route path="/admin/club-applications">
        <AuthGuard><Layout><AdminClubApplications /></Layout></AuthGuard>
      </Route>
      <Route path="/admin/club-settings">
        <AuthGuard><Layout><AdminClubSettings /></Layout></AuthGuard>
      </Route>
      
      <Route>
        <Layout><NotFound /></Layout>
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="nsl-theme">
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
