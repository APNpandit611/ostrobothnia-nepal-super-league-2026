import { useEffect, useRef } from "react";
import { ClerkProvider, SignIn, SignUp, useClerk } from "@clerk/react";
import { publishableKeyFromHost } from "@clerk/react/internal";
import { shadcn } from "@clerk/themes";
import { Switch, Route, useLocation, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "./components/theme-provider";
import { Layout } from "./components/layout";
import { AuthGuard } from "./components/auth-guard";
import NotFound from "@/pages/not-found";

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
import JoinKsb from "./pages/join-ksb";
import RegisterTeam from "./pages/register-team";
import UpdateSquad from "./pages/update-squad";
import SquadPoster from "./pages/squad-poster";

const queryClient = new QueryClient();

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

const clerkPubKey = publishableKeyFromHost(
  window.location.hostname,
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
);

const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;

function stripBase(path: string): string {
  return basePath && path.startsWith(basePath)
    ? path.slice(basePath.length) || "/"
    : path;
}

if (!clerkPubKey) {
  throw new Error("Missing VITE_CLERK_PUBLISHABLE_KEY");
}

const clerkAppearance = {
  theme: shadcn,
  cssLayerName: "clerk",
  options: {
    logoPlacement: "inside" as const,
    logoLinkUrl: basePath || "/",
    logoImageUrl: `${window.location.origin}${basePath}/logo.svg`,
    socialButtonsPlacement: "top" as const,
    socialButtonsVariant: "blockButton" as const,
  },
  variables: {
    colorPrimary: "#16a34a",
    colorForeground: "#fafafa",
    colorMutedForeground: "#a1a1aa",
    colorDanger: "#ef4444",
    colorBackground: "#09090b",
    colorInput: "#18181b",
    colorInputForeground: "#f4f4f5",
    colorNeutral: "#3f3f46",
    fontFamily: "Inter, system-ui, sans-serif",
    borderRadius: "0.5rem",
  },
  elements: {
    rootBox: "w-full flex justify-center",
    cardBox: "bg-zinc-900 rounded-2xl w-[440px] max-w-full overflow-hidden shadow-2xl border border-zinc-800",
    card: "!shadow-none !border-0 !bg-transparent !rounded-none",
    footer: "!shadow-none !border-0 !bg-transparent !rounded-none",
    headerTitle: "text-zinc-50 font-black",
    headerSubtitle: "text-zinc-400",
    socialButtonsBlockButtonText: "text-zinc-100 font-semibold",
    formFieldLabel: "text-zinc-300",
    footerActionLink: "text-green-400",
    footerActionText: "text-zinc-500",
    dividerText: "text-zinc-500",
    identityPreviewEditButton: "text-green-400",
    formFieldSuccessText: "text-green-400",
    alertText: "text-zinc-200",
    logoBox: "mb-1",
    logoImage: "h-10 w-auto",
    socialButtonsBlockButton: "border border-zinc-700 bg-zinc-800 hover:bg-zinc-700 transition-colors",
    formButtonPrimary: "bg-green-600 hover:bg-green-500 text-white font-bold transition-colors",
    formFieldInput: "bg-zinc-800 border-zinc-700 text-zinc-50 placeholder:text-zinc-500",
    footerAction: "bg-zinc-950/50 border-t border-zinc-800",
    dividerLine: "bg-zinc-700",
    alert: "border-zinc-700 bg-zinc-800/50",
    otpCodeFieldInput: "bg-zinc-800 border-zinc-700 text-zinc-50",
    formFieldRow: "",
    main: "",
  },
};

function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <SignIn routing="path" path={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`} />
    </div>
  );
}

function SignUpPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <SignUp routing="path" path={`${basePath}/sign-up`} signInUrl={`${basePath}/sign-in`} />
    </div>
  );
}

function ClerkQueryClientCacheInvalidator() {
  const { addListener } = useClerk();
  const qc = useQueryClient();
  const prevUserIdRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    const unsubscribe = addListener(({ user }) => {
      const userId = user?.id ?? null;
      if (prevUserIdRef.current !== undefined && prevUserIdRef.current !== userId) {
        qc.clear();
      }
      prevUserIdRef.current = userId;
    });
    return unsubscribe;
  }, [addListener, qc]);

  return null;
}

function Router() {
  return (
    <Switch>
      <Route path="/sign-in/*?" component={SignInPage} />
      <Route path="/sign-up/*?" component={SignUpPage} />

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
      <Route path="/register-team">
        <Layout><RegisterTeam /></Layout>
      </Route>
      <Route path="/update-squad">
        <Layout><UpdateSquad /></Layout>
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

function ClerkProviderWithRoutes() {
  const [, setLocation] = useLocation();

  return (
    <ClerkProvider
      publishableKey={clerkPubKey}
      proxyUrl={clerkProxyUrl}
      appearance={clerkAppearance}
      signInUrl={`${basePath}/sign-in`}
      signUpUrl={`${basePath}/sign-up`}
      localization={{
        signIn: {
          start: {
            title: "Sign in to ONSL 2026",
            subtitle: "Verify your identity to manage your team",
          },
        },
        signUp: {
          start: {
            title: "Create Account",
            subtitle: "Sign up to register your team for ONSL 2026",
          },
        },
      }}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
    >
      <QueryClientProvider client={queryClient}>
        <ClerkQueryClientCacheInvalidator />
        <TooltipProvider>
          <Router />
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="nsl-theme">
      <WouterRouter base={basePath}>
        <ClerkProviderWithRoutes />
      </WouterRouter>
    </ThemeProvider>
  );
}

export default App;
