import type { ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import api from '@shared/lib/api';
import { Card, CardContent } from '@shared/components/ui/card';
import { Skeleton } from '@shared/components/ui/skeleton';
import { useCurrentUser } from '@features/auth/hooks/use-auth';

const COLORS = [
  '#8884d8',
  '#82ca9d',
  '#ffc658',
  '#ff8042',
  '#8dd1e1',
  '#a4de6c',
  '#d0ed57',
  '#ffc0cb',
];

function ChartCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Card>
      <CardContent className="p-4">
        <h3 className="mb-3 font-semibold">{title}</h3>
        {children}
      </CardContent>
    </Card>
  );
}

export function AnalyticsPage() {
  const { data: user } = useCurrentUser();
  const { data: mine, isLoading: loadingMine } = useQuery({
    queryKey: ['analytics', 'user'],
    queryFn: async () => (await api.get('/analytics/user')).data.data,
    enabled: Boolean(user),
    retry: false,
  });
  const { data: global, isLoading: loadingGlobal } = useQuery({
    queryKey: ['analytics', 'global'],
    queryFn: async () => (await api.get('/analytics/global')).data.data,
  });

  return (
    <div className="container mx-auto space-y-6 px-4 py-8">
      <h1 className="text-3xl font-bold">Analytics</h1>
      <p className="text-muted-foreground">
        Every chart below is a live MongoDB aggregation pipeline — no mock data.
      </p>

      {user ? (
        loadingMine ? (
          <Skeleton className="h-64 w-full" />
        ) : mine ? (
          <div className="grid gap-4 md:grid-cols-2">
            <ChartCard
              title={`Watch time by genre (${mine.totalWatchTimeMinutes ?? 0} min · ${mine.completionRate ?? 0}% completed)`}
            >
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={mine.watchTimeByGenre ?? []}
                    dataKey="minutes"
                    nameKey="genreName"
                    outerRadius={100}
                    label
                  >
                    {(mine.watchTimeByGenre ?? []).map((_: unknown, i: number) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </ChartCard>
            <ChartCard title="My rating distribution">
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={mine.ratingDistribution ?? []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="score" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>
        ) : null
      ) : (
        <p className="text-sm text-muted-foreground">
          Log in to see your personal dashboard. Global stats are below.
        </p>
      )}

      <h2 className="pt-2 text-2xl font-bold">Global catalog</h2>
      {loadingGlobal ? (
        <Skeleton className="h-64 w-full" />
      ) : (
        global && (
          <>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {[
                { label: 'Titles', value: global.contentCount },
                { label: 'Users', value: global.userCount },
                { label: 'Ratings', value: global.ratingsCount },
                { label: 'Watchlist items', value: global.watchlistCount },
              ].map(s => (
                <Card key={s.label}>
                  <CardContent className="p-4 text-center">
                    <p className="text-2xl font-bold">{s.value}</p>
                    <p className="text-xs text-muted-foreground">{s.label}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <ChartCard title="Titles per genre">
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={(global.genrePopularity ?? []).slice(0, 8)} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" allowDecimals={false} />
                    <YAxis type="category" dataKey="genreName" width={110} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#82ca9d" />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>
              <ChartCard title="Releases per year">
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart data={global.releaseTrends ?? []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="year" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Line type="monotone" dataKey="count" stroke="#8884d8" dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </ChartCard>
              <ChartCard title="Most prolific directors">
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={(global.topDirectors ?? []).slice(0, 8)} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" allowDecimals={false} />
                    <YAxis type="category" dataKey="name" width={130} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#ffc658" />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>
              <ChartCard title="Top search queries">
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={(global.searchTrends ?? []).slice(0, 8)} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" allowDecimals={false} />
                    <YAxis type="category" dataKey="query" width={130} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#ff8042" />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>
            </div>
          </>
        )
      )}
    </div>
  );
}
