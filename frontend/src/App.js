import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Outlet, useLocation, Navigate } from "react-router-dom";
import { capturePageView } from "@/services/analyticsService";
import { runProductionAudit } from "@/utils/productionAudit";

function ScrollToTop() {
  const { pathname, search, hash } = useLocation();

  useEffect(() => {
    // Run production audit on boot to verify records and log console warnings for dummy data
    runProductionAudit();

    // Log pageview to PostHog analytics
    capturePageView(pathname);

    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }

    if (!hash) {
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    } else {
      const targetId = hash.replace("#", "");
      const elem = document.getElementById(targetId);
      if (elem) {
        elem.scrollIntoView({ behavior: "smooth" });
      } else {
        window.scrollTo(0, 0);
      }
    }
  }, [pathname, search, hash]);

  return null;
}
import { Toaster } from "sonner";
import "@/App.css";
import { AuthProvider } from "@/context/AuthContext";
import { TenantProvider } from "@/context/TenantContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { CompareProvider } from "@/context/CompareContext";
import CompareDrawer from "@/components/site/CompareDrawer";
import { ProtectedRoute } from "@/components/site/ProtectedRoute";
import Navbar from "@/components/site/Navbar";
import Footer from "@/components/site/Footer";
import InstallPrompt from "@/components/site/InstallPrompt";
import MobileBottomNav from "@/components/site/MobileBottomNav";
import NetworkStatusBanner from "@/components/site/NetworkStatusBanner";
import SystemStatusAlert from "@/components/site/SystemStatusAlert";
import PWAUpdateToast from "@/components/site/PWAUpdateToast";
import Offline from "@/components/site/Offline";
import OnboardingModal from "@/components/OnboardingModal";
import ProductionAudit from "@/components/ProductionAudit.jsx";
import PWASplashScreen from "@/components/site/PWASplashScreen";

import Home from "@/pages/Home";
import Explore from "@/pages/Explore";
import AITripDiscoveryDashboard from "@/pages/AITripDiscoveryDashboard";
import Storefront from "@/pages/Storefront";
import ImpersonationBanner from "@/components/site/ImpersonationBanner";
import TripDetail from "@/pages/TripDetail";
import Booking from "@/pages/Booking";
import Checkout from "@/pages/Checkout";
import Cart from "@/pages/Cart";
import PaymentConfirmation from "@/pages/PaymentConfirmation";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import MyBookings from "@/pages/MyBookings";
import Help from "@/pages/Help";
import Destinations from "@/pages/Destinations";
import Communities from "@/pages/Communities";
import CommunityDetail from "@/pages/CommunityDetail";
import CommunityDiscussion from "@/pages/CommunityDiscussion";
import Rentals from "@/pages/Rentals";
import RentalDetail from "@/pages/RentalDetail";
import MyRentals from "@/pages/MyRentals";
import WalletPage from "@/pages/Wallet";
import Articles from "@/pages/Articles";
import ArticleDetail from "@/pages/ArticleDetail";
import Promos from "@/pages/Promos";
import DestinationDetail from "@/pages/DestinationDetail";
import About from "@/pages/About";
import Contact from "@/pages/Contact";
import Terms from "@/pages/Terms";
import Privacy from "@/pages/Privacy";
import Reviews from "@/pages/Reviews";
import UserProfile from "@/pages/UserProfile";
import Wishlist from "@/pages/Wishlist";
import UserMessages from "@/pages/UserMessages";
import UserTransactions from "@/pages/UserTransactions";
import UserSupport from "@/pages/UserSupport";
import CategoryPage from "@/pages/CategoryPage";
import SafetyCenter from "@/pages/SafetyCenter";
import BackpackerDashboard from "@/pages/backpacker/BackpackerDashboard";
import FloatingChatHub from "@/components/site/FloatingChatHub";

import AdminLayout from "@/pages/admin/AdminLayout";
import AdminLogin from "@/pages/admin/AdminLogin";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import AdminBookings from "@/pages/admin/AdminBookings";
import AdminPayments from "@/pages/admin/AdminPayments";
import AdminTrips from "@/pages/admin/AdminTrips";
import AdminCommunities from "@/pages/admin/AdminCommunities";
import AdminRentals from "@/pages/admin/AdminRentals";
import AdminLandingBuilder from "@/pages/admin/AdminLandingBuilder";
import AdminWebsiteOverview from "@/pages/admin/website/AdminWebsiteOverview";
import AdminWebsiteTemplates from "@/pages/admin/website/AdminWebsiteTemplates";
import AdminWebsitePages from "@/pages/admin/website/AdminWebsitePages";
import AdminWebsiteNavigation from "@/pages/admin/website/AdminWebsiteNavigation";
import AdminWebsiteBranding from "@/pages/admin/website/AdminWebsiteBranding";
import AdminWebsiteDomain from "@/pages/admin/website/AdminWebsiteDomain";
import AdminWebsiteSEO from "@/pages/admin/website/AdminWebsiteSEO";
import AdminWebsiteAnalytics from "@/pages/admin/website/AdminWebsiteAnalytics";
import AdminWebsiteSettings from "@/pages/admin/website/AdminWebsiteSettings";
import TenantSubscription from "@/pages/admin/TenantSubscription";
import AISuperAdminCommandCenter from "@/pages/admin/AISuperAdminCommandCenter";
import AITrustRiskCenter from "@/pages/admin/AITrustRiskCenter";
import AIGrowthIntelligence from "@/pages/admin/AIGrowthIntelligence";
import TenantPublicPreview from "@/pages/TenantPublicPreview";

import SuperLayout from "@/pages/super/SuperLayout";
import SuperDashboard from "@/pages/super/SuperDashboard";
import SuperMasterData from "@/pages/super/SuperMasterData";
import SuperTenants from "@/pages/super/SuperTenants";
import SuperTenantDetail from "@/pages/super/SuperTenantDetail";
import SuperVendors from "@/pages/super/SuperVendors";
import SuperSubscriptions from "@/pages/super/SuperSubscriptions";
import SuperAdvertising from "@/pages/super/SuperAdvertising";
import SuperBillingRequests from "@/pages/super/SuperBillingRequests";
import SuperWebsitePlatform from "@/pages/super/SuperWebsitePlatform";
import SuperPayments from "@/pages/super/SuperPayments";
import SuperCustomerCare from "@/pages/super/SuperCustomerCare";
import SuperSettings from "@/pages/super/SuperSettings";
import SuperSecurity from "@/pages/super/SuperSecurity";
import SuperAIControl from "@/pages/super/SuperAIControl";
import SuperSEOControl from "@/pages/super/SuperSEOControl";
import SuperCommunity from "@/pages/super/SuperCommunity";
import SuperBackpackerOperations from "@/pages/super/SuperBackpackerOperations";

import VendorLayout from "@/pages/vendor/VendorLayout";
import VendorDashboard from "@/pages/vendor/VendorDashboard";
import VendorAICopilot from "@/pages/vendor/VendorAICopilot";
import VendorOnboard from "@/pages/vendor/VendorOnboard";
import VendorProfile from "@/pages/vendor/VendorProfile";
import VendorProducts from "@/pages/vendor/VendorProducts";
import VendorBookings from "@/pages/vendor/VendorBookings";
import VendorCustomers from "@/pages/vendor/VendorCustomers";
import VendorFinance from "@/pages/vendor/VendorFinance";
import VendorPromotions from "@/pages/vendor/VendorPromotions";
import VendorAnalytics from "@/pages/vendor/VendorAnalytics";
import VendorSettings from "@/pages/vendor/VendorSettings";
import VendorCommunity from "@/pages/vendor/VendorCommunity";
import VendorCommunications from "@/pages/vendor/VendorCommunications";

import PartnerRegister from "@/pages/partner/PartnerRegister";
import PartnerLogin from "@/pages/partner/PartnerLogin";

function SiteShell() {
  const location = useLocation();
  const hideChrome =
    location.pathname === "/login" ||
    location.pathname === "/register" ||
    location.pathname === "/admin/login";
  return (
    <div className="App flex flex-col min-h-screen pb-16 md:pb-0">
      <NetworkStatusBanner />
      <PWAUpdateToast />
      <OnboardingModal />
      {!hideChrome && <Navbar />}
      <main className="flex-1">
        <Outlet />
      </main>
      {!hideChrome && <Footer />}
      {!hideChrome && <FloatingChatHub />}
      {!hideChrome && <CompareDrawer />}
      {!hideChrome && <MobileBottomNav />}
    </div>
  );
}

/** Catch /@handle URLs and redirect to the working /handle/:handle route.
 * React Router 7 has trouble with '@' in path patterns, so we use a splat catchall. */
function AtHandleRedirect() {
  const location = useLocation();
  const match = location.pathname.match(/^\/@([a-z0-9][a-z0-9-]*)$/i);
  if (match) return <Navigate to={`/handle/${match[1]}`} replace />;
  return <Navigate to="/" replace />;
}

function App() {
  return (
    <ThemeProvider>
      <TenantProvider>
        <AuthProvider>
          <CompareProvider>
          <BrowserRouter>
            <SystemStatusAlert />
            <ProductionAudit />
            <ScrollToTop />
            <Toaster richColors position="top-right" />
            <ImpersonationBanner />
            <InstallPrompt />
          <Routes>
            <Route element={<SiteShell />}>
              <Route path="/" element={<Home />} />
              <Route path="/backpacker" element={<BackpackerDashboard />} />
              <Route path="/explore" element={<Explore />} />
              <Route path="/ai-discovery" element={<AITripDiscoveryDashboard />} />
              <Route path="/ai-trip-discovery" element={<AITripDiscoveryDashboard />} />
              <Route path="/explore/:slug" element={<ArticleDetail />} />
              <Route path="/category/:categorySlug" element={<CategoryPage />} />
              <Route path="/open-trip/:destinationSlug" element={<CategoryPage />} />
              <Route path="/guide/:destinationSlug" element={<CategoryPage />} />
              <Route path="/porter/:destinationSlug" element={<CategoryPage />} />
              <Route path="/basecamp/:destinationSlug" element={<CategoryPage />} />
              <Route path="/sewa-alat-outdoor/:locationSlug" element={<Rentals />} />
              <Route path="/vendor/:vendorSlug" element={<Storefront />} />
              <Route path="/@:handle" element={<Storefront />} />
              <Route path="/handle/:handle" element={<Storefront />} />
              <Route path="*" element={<AtHandleRedirect />} />
              <Route path="/destinations" element={<Destinations />} />
              <Route path="/destination/:id" element={<DestinationDetail />} />
              <Route path="/safety" element={<SafetyCenter />} />
              <Route path="/emergency" element={<SafetyCenter />} />
              <Route path="/promos" element={<Promos />} />
              <Route path="/about" element={<About />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/reviews" element={<Reviews />} />
              <Route path="/articles" element={<Articles />} />
              <Route path="/article/:id" element={<ArticleDetail />} />
              <Route
                path="/wallet"
                element={
                  <ProtectedRoute>
                    <WalletPage />
                  </ProtectedRoute>
                }
              />
              <Route path="/help" element={<Help />} />
              <Route path="/communities" element={<Communities />} />
              <Route path="/community" element={<CommunityDiscussion />} />
              <Route path="/community/discussion" element={<CommunityDiscussion />} />
              <Route path="/community/:id" element={<CommunityDetail />} />
              <Route path="/rental" element={<Rentals />} />
              <Route path="/rental/:id" element={<RentalDetail />} />
              <Route
                path="/my-rentals"
                element={
                  <ProtectedRoute>
                    <MyRentals />
                  </ProtectedRoute>
                }
              />
              <Route path="/trip/:id" element={<TripDetail />} />
              <Route path="/login" element={<Login />} />
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/register" element={<Register />} />
              <Route path="/partner/register" element={<PartnerRegister />} />
              <Route path="/partner/login" element={<PartnerLogin />} />
              <Route path="/vendor/register" element={<PartnerRegister />} />
              <Route path="/vendor/login" element={<PartnerLogin />} />
              <Route path="/tenant/register" element={<PartnerRegister />} />
              <Route path="/tenant/login" element={<PartnerLogin />} />
              <Route path="/tenant/preview" element={<TenantPublicPreview />} />
              <Route
                path="/booking/:id"
                element={
                  <ProtectedRoute>
                    <Booking />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/cart"
                element={<Cart />}
              />
              <Route
                path="/checkout"
                element={
                  <ProtectedRoute>
                    <Checkout />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/payment/:id"
                element={
                  <ProtectedRoute>
                    <PaymentConfirmation />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/payment-confirmation/:id"
                element={
                  <ProtectedRoute>
                    <PaymentConfirmation />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/wishlist"
                element={<Wishlist />}
              />
              <Route
                path="/messages"
                element={
                  <ProtectedRoute>
                    <UserMessages />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/transactions"
                element={
                  <ProtectedRoute>
                    <UserTransactions />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/support"
                element={
                  <ProtectedRoute>
                    <UserSupport />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/my-bookings"
                element={
                  <ProtectedRoute>
                    <MyBookings />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <UserProfile />
                  </ProtectedRoute>
                }
              />
            </Route>

            <Route
              path="/admin"
              element={
                <ProtectedRoute adminOnly>
                  <AdminLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<AdminDashboard />} />
              <Route path="builder" element={<AdminLandingBuilder />} />
              <Route path="website" element={<AdminWebsiteOverview />} />
              <Route path="website/builder" element={<AdminLandingBuilder />} />
              <Route path="website/templates" element={<AdminWebsiteTemplates />} />
              <Route path="website/pages" element={<AdminWebsitePages />} />
              <Route path="website/navigation" element={<AdminWebsiteNavigation />} />
              <Route path="website/branding" element={<AdminWebsiteBranding />} />
              <Route path="website/domain" element={<AdminWebsiteDomain />} />
              <Route path="website/seo" element={<AdminWebsiteSEO />} />
              <Route path="website/analytics" element={<AdminWebsiteAnalytics />} />
              <Route path="website/settings" element={<AdminWebsiteSettings />} />
              <Route path="bookings" element={<AdminBookings />} />
              <Route path="payments" element={<AdminPayments />} />
              <Route path="trips" element={<AdminTrips />} />
              <Route path="communities" element={<AdminCommunities />} />
              <Route path="rentals" element={<AdminRentals />} />
              <Route path="subscription" element={<TenantSubscription />} />
              <Route path="ai-command-center" element={<AISuperAdminCommandCenter />} />
              <Route path="ai-growth-intelligence" element={<AIGrowthIntelligence />} />
              <Route path="ai-trust-risk" element={<AITrustRiskCenter />} />
            </Route>

            <Route
              path="/super"
              element={
                <ProtectedRoute superOnly>
                  <SuperLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<SuperDashboard />} />
              <Route path="ai-command-center" element={<AISuperAdminCommandCenter />} />
              <Route path="ai-growth-intelligence" element={<AIGrowthIntelligence />} />
              <Route path="ai-trust-risk" element={<AITrustRiskCenter />} />
              <Route path="master-data" element={<SuperMasterData />} />
              <Route path="subscriptions" element={<SuperSubscriptions />} />
              <Route path="advertising" element={<SuperAdvertising />} />
              <Route path="billing-requests" element={<SuperBillingRequests />} />
              <Route path="tenants" element={<SuperTenants />} />
              <Route path="tenants/:id" element={<SuperTenantDetail />} />
              <Route path="vendors" element={<SuperVendors />} />
              <Route path="payments" element={<SuperPayments />} />
              <Route path="website-platform" element={<SuperWebsitePlatform />} />
              <Route path="customer-care" element={<SuperCustomerCare />} />
              <Route path="security" element={<SuperSecurity />} />
              <Route path="ai-control" element={<SuperAIControl />} />
              <Route path="seo" element={<SuperSEOControl />} />
              <Route path="community" element={<SuperCommunity />} />
              <Route path="backpacker" element={<SuperBackpackerOperations />} />
              <Route path="settings" element={<SuperSettings />} />
            </Route>

            <Route
              path="/vendor/onboard"
              element={
                <ProtectedRoute>
                  <VendorOnboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/vendor"
              element={
                <ProtectedRoute anyRole={["vendor", "partner", "super_admin", "platform_admin", "admin"]}>
                  <VendorLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<VendorDashboard />} />
              <Route path="ai-copilot" element={<VendorAICopilot />} />
              <Route path="products" element={<VendorProducts />} />
              <Route path="bookings" element={<VendorBookings />} />
              <Route path="customers" element={<VendorCustomers />} />
              <Route path="communications" element={<VendorCommunications />} />
              <Route path="finance" element={<VendorFinance />} />
              <Route path="promotions" element={<VendorPromotions />} />
              <Route path="analytics" element={<VendorAnalytics />} />
              <Route path="community" element={<VendorCommunity />} />
              <Route path="settings" element={<VendorSettings />} />
              <Route path="profile" element={<VendorProfile />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </CompareProvider>
    </AuthProvider>
  </TenantProvider>
</ThemeProvider>
  );
}

export default App;
