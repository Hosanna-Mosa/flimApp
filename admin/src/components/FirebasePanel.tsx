import { ExternalLink, Flame, Info } from 'lucide-react';
import { FirebaseReport } from '@/types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const FIREBASE_PROJECT = 'flimy-app-demo';
const consoleUrl = (section: string) =>
  `https://console.firebase.google.com/project/${FIREBASE_PROJECT}/${section}`;

const duration = (seconds: number) => {
  if (!seconds) return '—';
  if (seconds < 60) return `${seconds}s`;
  return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
};

/**
 * Firebase Analytics, read through the GA4 Data API.
 *
 * Crashlytics is a link rather than a table on purpose: Google publishes no
 * read API for it, so any crash figures shown here would have to be invented.
 */
export function FirebasePanel({ report }: { report: FirebaseReport | null }) {
  if (!report) return null;

  if (!report.configured) {
    return (
      <Card className="p-5">
        <div className="flex items-start gap-3">
          <div className="rounded-md bg-muted p-2">
            <Flame className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="flex-1 space-y-3">
            <div>
              <h2 className="font-semibold">Firebase</h2>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Not connected yet. Everything above works without it — this section adds what only
                the app itself can see: sessions, time spent, device and country.
              </p>
            </div>

            <div className="rounded-md bg-muted/50 p-3 text-sm">
              <p className="font-medium">To connect it</p>
              <ol className="mt-2 list-decimal space-y-1 pl-4 text-muted-foreground">
                <li>
                  In Google Analytics, open Admin → Property Settings and copy the numeric{' '}
                  <strong>Property ID</strong> (not the G- id).
                </li>
                <li>
                  Create a service account key and give it <strong>Viewer</strong> on that property.
                </li>
                <li>
                  Set <code className="text-xs">GA4_PROPERTY_ID</code> and{' '}
                  <code className="text-xs">GOOGLE_APPLICATION_CREDENTIALS</code> on the server, then
                  restart it.
                </li>
              </ol>
            </div>

            <p className="flex items-start gap-2 text-xs text-muted-foreground">
              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              Numbers only start once a build containing the Firebase SDK is released and people
              update. Until then this stays empty even when connected.
            </p>

            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" asChild>
                <a href={consoleUrl('analytics')} target="_blank" rel="noreferrer">
                  Open Firebase Analytics <ExternalLink className="ml-1.5 h-3.5 w-3.5" />
                </a>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <a href={consoleUrl('crashlytics')} target="_blank" rel="noreferrer">
                  Open Crashlytics <ExternalLink className="ml-1.5 h-3.5 w-3.5" />
                </a>
              </Button>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  const t = report.totals;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="font-semibold">From Firebase</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Last {report.days} days, as reported by the app itself.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild>
            <a href={consoleUrl('analytics')} target="_blank" rel="noreferrer">
              Firebase console <ExternalLink className="ml-1.5 h-3.5 w-3.5" />
            </a>
          </Button>
        </div>
      </div>

      {report.errors && report.errors.length > 0 && (
        <Card className="border-destructive/30 p-4">
          <p className="text-sm font-medium text-destructive">
            Some reports could not be read
          </p>
          <ul className="mt-1 list-disc pl-5 text-xs text-muted-foreground">
            {report.errors.map((e) => (
              <li key={e}>{e}</li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-muted-foreground">
            Usually the service account is missing Viewer access on the property.
          </p>
        </Card>
      )}

      {t && (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
          {[
            { label: 'Active users', value: t.activeUsers },
            { label: 'New users', value: t.newUsers },
            { label: 'Sessions', value: t.sessions },
            { label: 'Screen views', value: t.screenViews },
            { label: 'Avg session', value: duration(t.avgEngagementSeconds) },
          ].map((s) => (
            <Card key={s.label} className="p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">{s.label}</p>
              <p className="mt-1 text-2xl font-semibold tabular-nums">{s.value}</p>
            </Card>
          ))}
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <h3 className="mb-3 font-semibold">Most opened screens</h3>
          {!report.screens?.length ? (
            <p className="text-sm text-muted-foreground">Nothing reported yet.</p>
          ) : (
            <div className="space-y-2">
              {report.screens.slice(0, 10).map((s) => (
                <div key={s.screen} className="flex items-center justify-between gap-3 text-sm">
                  <code className="truncate text-xs">{s.screen}</code>
                  <span className="flex shrink-0 items-baseline gap-3">
                    <span className="text-xs text-muted-foreground tabular-nums">
                      {s.activeUsers} users
                    </span>
                    <span className="font-medium tabular-nums">{s.screenPageViews}</span>
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="p-5">
          <h3 className="mb-3 font-semibold">Events</h3>
          {!report.events?.length ? (
            <p className="text-sm text-muted-foreground">Nothing reported yet.</p>
          ) : (
            <div className="space-y-2">
              {report.events.slice(0, 10).map((e) => (
                <div key={e.event} className="flex items-center justify-between gap-3 text-sm">
                  <code className="truncate text-xs">{e.event}</code>
                  <span className="flex shrink-0 items-baseline gap-3">
                    <span className="text-xs text-muted-foreground tabular-nums">
                      {e.activeUsers} users
                    </span>
                    <span className="font-medium tabular-nums">{e.eventCount}</span>
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <h3 className="mb-3 font-semibold">Devices</h3>
          {!report.platforms?.length ? (
            <p className="text-sm text-muted-foreground">Nothing reported yet.</p>
          ) : (
            <div className="space-y-2">
              {report.platforms.map((p) => (
                <div key={p.platform} className="flex items-center justify-between text-sm">
                  <span>{p.platform}</span>
                  <span className="font-medium tabular-nums">{p.activeUsers}</span>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="p-5">
          <h3 className="mb-3 font-semibold">Where they are</h3>
          {!report.countries?.length ? (
            <p className="text-sm text-muted-foreground">Nothing reported yet.</p>
          ) : (
            <div className="space-y-2">
              {report.countries.map((c) => (
                <div key={c.country} className="flex items-center justify-between text-sm">
                  <span>{c.country}</span>
                  <span className="font-medium tabular-nums">{c.activeUsers}</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <Card className="p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="font-semibold">Crashes</h3>
            <p className="mt-0.5 max-w-xl text-sm text-muted-foreground">
              Crashlytics has no API to read from, so crash reports cannot be shown here — this link
              is the only way to see them. Server-side faults are a different thing and do appear in
              the panel, under Errors.
            </p>
          </div>
          <Button variant="outline" size="sm" asChild>
            <a href={consoleUrl('crashlytics')} target="_blank" rel="noreferrer">
              Open Crashlytics <ExternalLink className="ml-1.5 h-3.5 w-3.5" />
            </a>
          </Button>
        </div>
      </Card>
    </div>
  );
}
