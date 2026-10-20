import {
  Film,
  Search,
  BookOpen,
  Sparkles,
  ArrowRight,
  Zap,
  Brain,
  Database,
  Server,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@shared/components/ui/button';
import { Card, CardContent } from '@shared/components/ui/card';
import { ContentGrid } from '@shared/components/content-grid';
import { useTrending } from '@features/browse/hooks/use-browse';
import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';

interface HealthStatus {
  status: 'ok' | 'error';
  database?: string;
  timestamp?: string;
}

export function HomePage() {
  const [healthStatus, setHealthStatus] = useState<HealthStatus | null>(null);
  const [isChecking, setIsChecking] = useState(true);
  const { data: trending, isLoading: trendingLoading } = useTrending(10);

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const response = await fetch('/api/v1/health');
        const data = await response.json();
        setHealthStatus(data);
      } catch {
        setHealthStatus({ status: 'error' });
      } finally {
        setIsChecking(false);
      }
    };
    checkHealth();
  }, []);

  const features = [
    {
      icon: Search,
      title: 'Natural Language Search',
      description:
        'Ask in plain English — rule-based parsing extracts genres, runtime, mood, year, cast, and reference titles.',
    },
    {
      icon: Sparkles,
      title: 'Personalized Recommendations',
      description:
        'Content-based picks from your high ratings and watchlist, with a reason for every match.',
    },
    {
      icon: Brain,
      title: 'Explainable Similar Titles',
      description: 'See exactly which genres and keywords connect two titles — no black boxes.',
    },
    {
      icon: BookOpen,
      title: 'Watchlist & Ratings',
      description: "Track what you want to watch, rate what you've seen, and build your profile",
    },
  ];

  const stats = [
    { label: 'Titles in the local catalog', value: '24' },
    { label: 'Viva features', value: '10' },
    { label: 'Automated tests', value: '49' },
    { label: 'Third-party APIs', value: '0' },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-20 md:py-32 lg:py-40 overflow-hidden">
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
              <Zap className="h-4 w-4" />
              <span>Local-first · MongoDB · No external APIs</span>
            </div>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6">
              Find Your Perfect <span className="text-primary">Movie Night</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Search naturally. Get personalized recommendations. Build your watchlist. Everything
              runs locally against MongoDB — no API keys, no cloud services.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
              <Button size="lg" asChild className="w-full sm:w-auto">
                <Link to="/search">
                  <Search className="h-4 w-4 mr-2" />
                  Try Natural Language Search
                </Link>
              </Button>
              <Button variant="outline" size="lg" asChild className="w-full sm:w-auto">
                <Link to="/browse">
                  Browse Catalog
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
            </div>
            <div className="flex items-center justify-center gap-8 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Film className="h-4 w-4" />
                Movies & TV
              </span>
              <span className="flex items-center gap-1">
                <Brain className="h-4 w-4" />
                Rule-Based Search
              </span>
              <span className="flex items-center gap-1">
                <Database className="h-4 w-4" />
                Local MongoDB
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Trending now (live) */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="mb-6 flex items-end justify-between">
            <div>
              <h2 className="text-3xl font-bold">Trending now</h2>
              <p className="text-muted-foreground">Live from the catalog, ranked by popularity.</p>
            </div>
            <Button variant="outline" asChild>
              <Link to="/browse">
                Browse all <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
          <ContentGrid
            items={trending ?? []}
            isLoading={trendingLoading}
            emptyMessage="Catalog is empty — run the seed (see README)."
          />
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map(stat => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-primary mb-2">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Why CineMatch?</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Built for movie lovers who want to spend less time browsing and more time watching.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map(feature => (
              <Card key={feature.title} className="h-full transition-shadow hover:shadow-lg">
                <CardContent className="p-6">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-4">
                    <feature.icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground text-sm">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Backend Health Status */}
      <section className="py-10 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Server className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold">Backend Connection</h3>
            </div>
            {isChecking ? (
              <div className="text-center text-muted-foreground">
                <div className="flex justify-center gap-2 mb-2">
                  <div
                    className="w-2 h-2 bg-primary rounded-full animate-bounce"
                    style={{ animationDelay: '0ms' }}
                  />
                  <div
                    className="w-2 h-2 bg-primary rounded-full animate-bounce"
                    style={{ animationDelay: '150ms' }}
                  />
                  <div
                    className="w-2 h-2 bg-primary rounded-full animate-bounce"
                    style={{ animationDelay: '300ms' }}
                  />
                </div>
                <p>Checking backend connection...</p>
              </div>
            ) : healthStatus?.status === 'ok' ? (
              <div className="text-center text-green-600 dark:text-green-400">
                <div className="flex justify-center gap-2 mb-2">
                  <CheckCircle className="h-6 w-6" />
                </div>
                <p className="font-medium">Backend Connected</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Database: {healthStatus.database || 'connected'}
                  {healthStatus.timestamp &&
                    ` • ${new Date(healthStatus.timestamp).toLocaleTimeString()}`}
                </p>
              </div>
            ) : (
              <div className="text-center text-red-600 dark:text-red-400">
                <div className="flex justify-center gap-2 mb-2">
                  <AlertCircle className="h-6 w-6" />
                </div>
                <p className="font-medium">Backend Unavailable</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Make sure the backend server is running on port 3000
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to find your next favorite?</h2>
          <p className="text-primary-foreground/80 mb-8 max-w-xl mx-auto">
            Join thousands of movie lovers discovering content they actually want to watch.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" variant="secondary" asChild className="w-full sm:w-auto">
              <Link to="/auth/register">Create Free Account</Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              asChild
              className="w-full sm:w-auto border-primary-foreground text-primary-foreground hover:bg-primary-foreground/10"
            >
              <Link to="/browse">Explore Catalog</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
