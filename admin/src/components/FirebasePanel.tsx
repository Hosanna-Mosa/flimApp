import {
  ExternalLink, Flame, Globe, Info, Layers, MonitorSmartphone,
  MousePointerClick, ShieldAlert, Smartphone, Timer, Users,
} from 'lucide-react';
import { FirebaseReport } from '@/types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BreakdownList, Stat } from '@/components/BreakdownList';
import { cn } from '@/lib/utils';

const FIREBASE_PROJECT = 'flimy-app-demo';
const consoleUrl = (section: string) =>
  `https://console.firebase.google.com/project/${FIREBASE_PROJECT}/${section}`;

const duration = (seconds: number) => {
  if (!seconds) return '—';
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return s ? `${m}m ${s}s` : `${m}m`;
};

const num = (n: number | undefined) => (n ?? 0).toLocaleString('en-IN');

/** A titled block. Every Firebase section uses one so the page reads as a set. */
function Panel({
  title,
  description,
  icon: Icon,
  children,
  className,
}: {
  title: string;
  description?: string;
  icon?: React.ElementType;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Card className={cn('overflow-hidden p-0', className)}>
      <div className="flex items-start gap-3 border-b border-border bg-muted/30 px-5 py-3.5">
        {Icon && (
          <div className="mt-0.5 rounded-md bg-background p-1.5">
            <Icon className="h-3.5 w-3.5 text-muted-foreground" />
          </div>
        )}
        <div className="min-w-0">
          <h3 className="font-semibold leading-tight">{title}</h3>
          {description && (
            <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
          )}
        </div>
      </div>
      <div className="p-4">{children}</div>
    </Card>
  );
}

/**
 * Everything Firebase reports about the app, laid out so the whole picture is
 * visible without opening the Firebase console.
 *
 * Crash stack traces are the one thing that stays in the console — Crashlytics
 * publishes no read API — but the headline crash rate comes through GA4 and is
 * shown here, so app health is answerable from this page.
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
                Not connected. Everything above works without it — this section adds what only the
                app itself can see: sessions, screens, devices and crash rate.
              </p>
            </div>
            <div className="rounded-md bg-muted/50 p-3 text-sm text-muted-foreground">
              {report.reason}
            </div>
            <Button variant="outline" size="sm" asChild>
              <a href={consoleUrl('analytics')} target="_blank" rel="noreferrer">
                Open Firebase console <ExternalLink className="ml-1.5 h-3.5 w-3.5" />
              </a>
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  const t = report.totals;
  const st = report.stability;
  const eng = report.engagement;
  const crashFreePct = st?.crashFreeRate != null ? Math.round(st.crashFreeRate * 1000) / 10 : null;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">From the app itself</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Reported by Firebase over the last {report.days} days. This is behaviour the server
            cannot see — which screens people open, how long they stay, what they are running it on.
          </p>
        </div>
        <Button variant="outline" size="sm" asChild>
          <a href={consoleUrl('analytics')} target="_blank" rel="noreferrer">
            Firebase console <ExternalLink className="ml-1.5 h-3.5 w-3.5" />
          </a>
        </Button>
      </div>

      {report.errors && report.errors.length > 0 && (
        <Card className="border-destructive/30 p-4">
          <p className="text-sm font-medium text-destructive">Some reports could not be read</p>
          <ul className="mt-1 list-disc pl-5 text-xs text-muted-foreground">
            {report.errors.slice(0, 3).map((e) => (
              <li key={e}>{e}</li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-muted-foreground">
            Usually the service account is missing Viewer access on the property.
          </p>
        </Card>
      )}

      {/* Live */}
      {report.realtime && (
        <Card className="p-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="relative flex h-2.5 w-2.5 shrink-0">
                {report.realtime.activeUsers > 0 && (
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-70" />
                )}
                <span
                  className={cn(
                    'relative inline-flex h-2.5 w-2.5 rounded-full',
                    report.realtime.activeUsers > 0 ? 'bg-emerald-500' : 'bg-muted-foreground/40'
                  )}
                />
              </span>
              <div>
                <h3 className="font-semibold">Right now</h3>
                <p className="text-sm text-muted-foreground">In the last 30 minutes</p>
              </div>
            </div>
            <div className="flex gap-8">
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">People</p>
                <p className="text-2xl font-semibold tabular-nums">
                  {report.realtime.activeUsers}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Screen views</p>
                <p className="text-2xl font-semibold tabular-nums">
                  {report.realtime.screenViews}
                </p>
              </div>
            </div>
          </div>
        </Card>
      )}

      {report.stillProcessing && (
        <Card className="border-amber-500/30 p-4">
          <div className="flex items-start gap-3">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">People are using the app right now</span>
              , but the figures below still read zero. Firebase takes several hours to fold events
              into these reports. Nothing is broken.
            </p>
          </div>
        </Card>
      )}

      {/* Headline */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat icon={Users} label="Active users" value={num(t?.activeUsers)} hint={`${num(t?.newUsers)} of them new`} />
        <Stat icon={Layers} label="Sessions" value={num(t?.sessions)} hint={`${num(t?.screenViews)} screen views`} />
        <Stat
          icon={Timer}
          label="Avg session"
          value={duration(eng?.avgSessionSeconds || 0)}
          hint={eng?.screensPerSession ? `${eng.screensPerSession} screens each` : undefined}
        />
        <Stat
          icon={ShieldAlert}
          label="Crash-free users"
          value={crashFreePct != null ? `${crashFreePct}%` : '—'}
          hint={st?.affectedUsers ? `${st.affectedUsers} affected` : 'nobody affected'}
          tone={crashFreePct != null && crashFreePct < 99 ? 'bad' : crashFreePct != null ? 'good' : undefined}
        />
      </div>

      {/* Screens — asked for explicitly, so it gets the full width */}
      <Panel
        title="Which screens people open"
        description="Every screen in the app, ranked by how often it was opened."
      >
        <BreakdownList
          rows={(report.screens || []).map((s) => ({
            label: s.screen || '(unnamed)',
            value: s.screenPageViews,
          }))}
          unit="views"
          max={15}
          emptyText="No screen views recorded yet. These arrive once people use a build with tracking in it."
        />
      </Panel>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel icon={MousePointerClick} title="What people do" description="Events the app reports.">
          <BreakdownList
            rows={(report.events || []).map((e) => ({ label: e.event, value: e.eventCount }))}
            unit="times"
            max={12}
          />
        </Panel>

        <Panel icon={Smartphone} title="Which build they are on" description="How far the latest release has spread.">
          <BreakdownList
            rows={(report.appVersions || []).map((v) => ({
              label: v.appVersion || '(unknown)',
              value: v.activeUsers,
            }))}
            unit="users"
          />
        </Panel>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Panel icon={MonitorSmartphone} title="Phones" description="Most common devices.">
          <BreakdownList
            rows={(report.devices || []).map((d) => ({ label: d.device, value: d.activeUsers }))}
            unit="users"
            max={6}
          />
        </Panel>

        <Panel icon={MonitorSmartphone} title="Operating system" description="Versions in use.">
          <BreakdownList
            rows={(report.osVersions || []).map((o) => ({ label: o.osVersion, value: o.activeUsers }))}
            unit="users"
            max={6}
          />
        </Panel>

        <Panel icon={MonitorSmartphone} title="Platform" description="iOS against Android.">
          <BreakdownList
            rows={(report.platforms || []).map((p) => ({ label: p.platform, value: p.activeUsers }))}
            unit="users"
            ofTotal
          />
        </Panel>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Panel icon={Globe} title="Countries" description="Where people are.">
          <BreakdownList
            rows={(report.countries || []).map((c) => ({ label: c.country, value: c.activeUsers }))}
            unit="users"
            max={6}
          />
        </Panel>

        <Panel icon={Globe} title="Cities" description="Down to the city.">
          <BreakdownList
            rows={(report.cities || []).map((c) => ({ label: c.city, value: c.activeUsers }))}
            unit="users"
            max={6}
          />
        </Panel>

        <Panel icon={Users} title="New against returning" description="Whether people come back.">
          <BreakdownList
            rows={(report.newVsReturning || []).map((n) => ({
              label: n.kind || '(unknown)',
              value: n.activeUsers,
            }))}
            unit="users"
            ofTotal
          />
        </Panel>
      </div>

      {/* Crashes */}
      <Card className="p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div
              className={cn(
                'rounded-md p-2',
                crashFreePct != null && crashFreePct < 99 ? 'bg-destructive/10' : 'bg-muted'
              )}
            >
              <ShieldAlert
                className={cn(
                  'h-4 w-4',
                  crashFreePct != null && crashFreePct < 99
                    ? 'text-destructive'
                    : 'text-muted-foreground'
                )}
              />
            </div>
            <div>
              <h3 className="font-semibold">App stability</h3>
              <p className="mt-0.5 max-w-xl text-sm text-muted-foreground">
                {crashFreePct != null ? (
                  <>
                    <span className="font-medium text-foreground">{crashFreePct}%</span> of people
                    used the app without it crashing
                    {st?.affectedUsers ? `, and ${st.affectedUsers} hit a crash` : ''}. The
                    individual crashes and their stack traces live in Crashlytics — Firebase
                    publishes no way to read those from here.
                  </>
                ) : (
                  <>
                    No crash data yet. Server-side faults are a different thing and do appear in this
                    panel, under Errors.
                  </>
                )}
              </p>
            </div>
          </div>
          <Button variant="outline" size="sm" asChild>
            <a href={consoleUrl('crashlytics')} target="_blank" rel="noreferrer">
              <Smartphone className="mr-1.5 h-3.5 w-3.5" />
              Open Crashlytics <ExternalLink className="ml-1.5 h-3.5 w-3.5" />
            </a>
          </Button>
        </div>
      </Card>
    </div>
  );
}
