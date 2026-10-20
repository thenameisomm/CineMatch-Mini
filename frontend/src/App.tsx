import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import { ThemeProvider } from '@shared/components/ui/theme-provider';
import { Navbar } from '@shared/components/layout/navbar';
import { Footer } from '@shared/components/layout/footer';
import { ProtectedRoute } from '@features/auth/components/protected-route';
import { HomePage } from '@features/home/pages/home-page';
import { BrowsePage } from '@features/browse/pages/browse-page';
import { SearchPage } from '@features/search/pages/search-page';
import { ContentDetailPage } from '@features/content/pages/content-detail-page';
import { WatchlistPage } from '@features/watchlist/pages/watchlist-page';
import { RatingsPage } from '@features/ratings/pages/ratings-page';
import { RecommendationsPage } from '@features/recommendations/pages/recommendations-page';
import { ProfilePage } from '@features/profile/pages/profile-page';
import { LoginPage } from '@features/auth/pages/login-page';
import { RegisterPage } from '@features/auth/pages/register-page';

// Recharts is heavy — split it out of the initial bundle.
const AnalyticsPage = lazy(() =>
  import('@features/analytics/pages/analytics-page').then(m => ({ default: m.AnalyticsPage }))
);

function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <BrowserRouter>
        <div className="flex flex-col min-h-screen">
          <Navbar />
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/browse" element={<BrowsePage />} />
              <Route path="/search" element={<SearchPage />} />
              <Route path="/content/:type/:id" element={<ContentDetailPage />} />
              <Route
                path="/watchlist"
                element={
                  <ProtectedRoute>
                    <WatchlistPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/ratings"
                element={
                  <ProtectedRoute>
                    <RatingsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/recommendations"
                element={
                  <ProtectedRoute>
                    <RecommendationsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <ProfilePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/analytics"
                element={
                  <Suspense
                    fallback={
                      <div className="container mx-auto px-4 py-16 text-center text-muted-foreground">
                        Loading charts…
                      </div>
                    }
                  >
                    <AnalyticsPage />
                  </Suspense>
                }
              />
              <Route path="/auth/login" element={<LoginPage />} />
              <Route path="/auth/register" element={<RegisterPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
