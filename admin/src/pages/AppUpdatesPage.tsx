import { useState, useEffect } from 'react';
import { versionApi } from '@/services/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { LoadingState } from '@/components/StateDisplay';
import { Smartphone, RefreshCw, Save, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

export default function AppUpdatesPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  const [iosLatest, setIosLatest] = useState('1.0.0');
  const [iosMin, setIosMin] = useState('1.0.0');
  const [iosStore, setIosStore] = useState('https://apps.apple.com');
  
  const [androidLatest, setAndroidLatest] = useState('1.0.0');
  const [androidMin, setAndroidMin] = useState('1.0.0');
  const [androidStore, setAndroidStore] = useState('https://play.google.com');
  
  const [title, setTitle] = useState('New Version Available');
  const [message, setMessage] = useState('Please update your application to the latest version to access new features.');
  
  const [isShutdown, setIsShutdown] = useState(false);
  const [shutdownTitle, setShutdownTitle] = useState('Currently App is Shut Down');
  const [shutdownMessage, setShutdownMessage] = useState('We are fixing a big bug, so we want to suddenly shut down the application.');

  const fetchConfig = async () => {
    try {
      setIsLoading(true);
      const data = await versionApi.getVersion();
      if (data) {
        if (data.ios) {
          setIosLatest(data.ios.latestVersion || '1.0.0');
          setIosMin(data.ios.minimumVersion || '1.0.0');
          setIosStore(data.ios.storeUrl || 'https://apps.apple.com');
        }
        if (data.android) {
          setAndroidLatest(data.android.latestVersion || '1.0.0');
          setAndroidMin(data.android.minimumVersion || '1.0.0');
          setAndroidStore(data.android.storeUrl || 'https://play.google.com');
        }
        setTitle(data.title || 'New Version Available');
        setMessage(data.message || 'Please update your application to the latest version to access new features.');
        setIsShutdown(data.isShutdown || false);
        setShutdownTitle(data.shutdownTitle || 'Currently App is Shut Down');
        setShutdownMessage(data.shutdownMessage || 'We are fixing a big bug, so we want to suddenly shut down the application.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load version configurations.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      await versionApi.updateVersion({
        ios: {
          latestVersion: iosLatest,
          minimumVersion: iosMin,
          storeUrl: iosStore,
        },
        android: {
          latestVersion: androidLatest,
          minimumVersion: androidMin,
          storeUrl: androidStore,
        },
        title,
        message,
        isShutdown,
        shutdownTitle,
        shutdownMessage,
      });
      toast.success('App update configurations saved successfully!');
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to save configurations.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <LoadingState message="Loading version configurations..." />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Smartphone className="h-8 w-8 text-primary" />
            App Updates Manager
          </h1>
          <p className="text-muted-foreground">
            Configure latest builds, enforce minimum version locks, and customize update prompts.
          </p>
        </div>
        <Button onClick={fetchConfig} variant="outline" size="sm" className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
          {/* iOS Config */}
          <Card className="bg-card/50 border-border/80 backdrop-blur-sm">
            <CardHeader className="border-b border-border/40 pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400 text-sm font-semibold">i</span>
                iOS (App Store) Configuration
              </CardTitle>
              <CardDescription>Setup Apple device build standards</CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="iosLatest">Latest Version</Label>
                  <Input 
                    id="iosLatest" 
                    value={iosLatest} 
                    onChange={(e) => setIosLatest(e.target.value)} 
                    placeholder="e.g. 1.2.0" 
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="iosMin">Minimum Version Required</Label>
                  <Input 
                    id="iosMin" 
                    value={iosMin} 
                    onChange={(e) => setIosMin(e.target.value)} 
                    placeholder="e.g. 1.0.5" 
                    required 
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="iosStore">App Store Redirect Link</Label>
                <Input 
                  id="iosStore" 
                  value={iosStore} 
                  onChange={(e) => setIosStore(e.target.value)} 
                  placeholder="https://apps.apple.com/app/your-app-id" 
                  type="url"
                  required 
                />
              </div>
            </CardContent>
          </Card>

          {/* Android Config */}
          <Card className="bg-card/50 border-border/80 backdrop-blur-sm">
            <CardHeader className="border-b border-border/40 pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-green-500/10 text-green-400 text-sm font-semibold">a</span>
                Android (Play Store) Configuration
              </CardTitle>
              <CardDescription>Setup Android device build standards</CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="androidLatest">Latest Version</Label>
                  <Input 
                    id="androidLatest" 
                    value={androidLatest} 
                    onChange={(e) => setAndroidLatest(e.target.value)} 
                    placeholder="e.g. 1.2.0" 
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="androidMin">Minimum Version Required</Label>
                  <Input 
                    id="androidMin" 
                    value={androidMin} 
                    onChange={(e) => setAndroidMin(e.target.value)} 
                    placeholder="e.g. 1.0.5" 
                    required 
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="androidStore">Play Store Redirect Link</Label>
                <Input 
                  id="androidStore" 
                  value={androidStore} 
                  onChange={(e) => setAndroidStore(e.target.value)} 
                  placeholder="https://play.google.com/store/apps/details?id=package" 
                  type="url"
                  required 
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Banner Details */}
        <Card className="bg-card/50 border-border/80 backdrop-blur-sm">
          <CardHeader className="border-b border-border/40 pb-4">
            <CardTitle className="text-lg">Update Prompt Text Display</CardTitle>
            <CardDescription>Customize the alert title and details users see on their devices</CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Notification Title</Label>
              <Input 
                id="title" 
                value={title} 
                onChange={(e) => setTitle(e.target.value)} 
                placeholder="e.g. Update Required" 
                required 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="message">Detailed Message Description</Label>
              <Textarea 
                id="message" 
                value={message} 
                onChange={(e) => setMessage(e.target.value)} 
                placeholder="Describe why they need to update (new features, optimizations, etc.)." 
                rows={4}
                required 
              />
            </div>
          </CardContent>
        </Card>

        {/* Emergency Shutdown Controls */}
        <Card className="bg-card/50 border-red-500/30 backdrop-blur-sm shadow-lg shadow-red-950/10">
          <CardHeader className="border-b border-red-500/20 pb-4">
            <CardTitle className="text-lg flex items-center gap-2 text-red-500">
              <AlertTriangle className="h-5 w-5 animate-pulse text-red-500" />
              Emergency App Shutdown Control
            </CardTitle>
            <CardDescription className="text-red-400/80">
              Instantly lock and disable the application globally. Active users will be forced to the shutdown screen in real-time.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="flex items-center justify-between p-4 rounded-lg bg-red-950/20 border border-red-500/20">
              <div className="space-y-0.5">
                <Label htmlFor="isShutdown" className="text-base font-semibold text-red-400">Shutdown Mode</Label>
                <p className="text-sm text-muted-foreground">
                  Toggle this to lock/unlock all client applications immediately.
                </p>
              </div>
              <Switch 
                id="isShutdown"
                checked={isShutdown}
                onCheckedChange={setIsShutdown}
                className="data-[state=checked]:bg-red-500"
              />
            </div>
            
            {isShutdown && (
              <div className="space-y-4 pt-2 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="space-y-2">
                  <Label htmlFor="shutdownTitle">Shutdown Alert Title</Label>
                  <Input 
                    id="shutdownTitle" 
                    value={shutdownTitle} 
                    onChange={(e) => setShutdownTitle(e.target.value)} 
                    placeholder="e.g. Under Maintenance" 
                    required={isShutdown}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="shutdownMessage">Detailed Message Description</Label>
                  <Textarea 
                    id="shutdownMessage" 
                    value={shutdownMessage} 
                    onChange={(e) => setShutdownMessage(e.target.value)} 
                    placeholder="Provide details on why the app is shut down and when it might return." 
                    rows={4}
                    required={isShutdown} 
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex justify-end">
          <Button type="submit" disabled={isSaving} className="gap-2 px-6">
            {isSaving ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Save Configuration
          </Button>
        </div>
      </form>
    </div>
  );
}
