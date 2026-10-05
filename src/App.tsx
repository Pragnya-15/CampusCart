import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { AppLayout } from '@/components/Layouts';
import { HomePage } from '@/pages/HomePage';
import { LoginPage } from '@/pages/LoginPage';
import { SignupPage } from '@/pages/SignupPage';
import { ForgotPasswordPage } from '@/pages/ForgotPasswordPage';
import { MarketplacePage } from '@/pages/MarketplacePage';
import { ItemDetailPage } from '@/pages/ItemDetailPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { SellPage } from '@/pages/SellPage';
import { MyListingsPage } from '@/pages/MyListingsPage';
import { FavoritesPage } from '@/pages/FavoritesPage';
import { RequestsPage } from '@/pages/RequestsPage';
import { MessagesPage } from '@/pages/MessagesPage';
import { SwapsPage } from '@/pages/SwapsPage';
import { RecommendationsPage } from '@/pages/RecommendationsPage';
import { ProfilePage } from '@/pages/ProfilePage';
import { ImpactPage } from '@/pages/ImpactPage';
import { AdminPage } from '@/pages/AdminPage';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public routes with full layout */}
          <Route path="/" element={<AppLayout><HomePage /></AppLayout>} />
          <Route path="/marketplace" element={<AppLayout><MarketplacePage /></AppLayout>} />
          <Route path="/item/:id" element={<AppLayout><ItemDetailPage /></AppLayout>} />
          <Route path="/impact" element={<AppLayout><ImpactPage /></AppLayout>} />

          {/* Auth routes (no navbar/footer) */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />

          {/* Protected routes */}
          <Route path="/dashboard" element={<ProtectedRoute><AppLayout><DashboardPage /></AppLayout></ProtectedRoute>} />
          <Route path="/sell" element={<ProtectedRoute><AppLayout><SellPage /></AppLayout></ProtectedRoute>} />
          <Route path="/my-listings" element={<ProtectedRoute><AppLayout><MyListingsPage /></AppLayout></ProtectedRoute>} />
          <Route path="/favorites" element={<ProtectedRoute><AppLayout><FavoritesPage /></AppLayout></ProtectedRoute>} />
          <Route path="/requests" element={<ProtectedRoute><AppLayout><RequestsPage /></AppLayout></ProtectedRoute>} />
          <Route path="/messages" element={<ProtectedRoute><AppLayout><MessagesPage /></AppLayout></ProtectedRoute>} />
          <Route path="/swaps" element={<ProtectedRoute><AppLayout><SwapsPage /></AppLayout></ProtectedRoute>} />
          <Route path="/recommendations" element={<ProtectedRoute><AppLayout><RecommendationsPage /></AppLayout></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><AppLayout><ProfilePage /></AppLayout></ProtectedRoute>} />

          {/* Admin route */}
          <Route path="/admin" element={<ProtectedRoute adminOnly><AppLayout><AdminPage /></AppLayout></ProtectedRoute>} />

          {/* Fallback */}
          <Route path="*" element={<AppLayout><HomePage /></AppLayout>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
