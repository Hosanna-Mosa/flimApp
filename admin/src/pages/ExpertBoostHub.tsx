import { useState, useEffect } from 'react';
import { verificationApi, statsApi } from '@/services/api';
import { Subscription } from '@/types';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserAvatar } from '@/components/UserAvatar';
import { StatusBadge } from '@/components/StatusBadge';
import { LoadingState, EmptyState } from '@/components/StateDisplay';
import { CreditCard, Zap, RefreshCw, Clock, ShieldCheck, Mail, Phone, ExternalLink } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

export default function ExpertBoostHub() {
  const navigate = useNavigate();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [boostedUsers, setBoostedUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchData = async () => {
    setIsRefreshing(true);
    try {
      const [subRes, boostRes] = await Promise.all([
        verificationApi.getSubscriptions(1, 100, { status: 'ACTIVE' }),
        statsApi.getBoostStats()
      ]);
      setSubscriptions(subRes.data);
      setBoostedUsers(boostRes.users);
    } catch (error) {
      toast.error('Failed to load management data');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (isLoading) return <LoadingState message="Initializing Management Hub..." />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">Management Hub</h1>
          <p className="text-muted-foreground mt-1">
            Toggle between Expert Subscriptions and Profile Boosts
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchData} disabled={isRefreshing} className="gap-2">
          <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
          Refresh Registry
        </Button>
      </div>

      <Tabs defaultValue="expert" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2 h-12">
          <TabsTrigger value="expert" className="gap-2 h-10">
            <ShieldCheck className="h-4 w-4" />
            Expert Registry
            <Badge variant="secondary" className="ml-1 px-1.5 py-0 min-w-[20px]">{subscriptions.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="boost" className="gap-2 h-10">
            <Zap className="h-4 w-4" />
            Add-to (Boost)
            <Badge variant="secondary" className="ml-1 px-1.5 py-0 min-w-[20px]">{boostedUsers.length}</Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="expert" className="mt-6">
          <Card className="border-blue-500/20 shadow-lg overflow-hidden">
            <CardContent className="p-0">
              {subscriptions.length === 0 ? (
                <div className="py-20 text-center">
                  <EmptyState title="No Expert Subscriptions" description="No active verified experts found." icon={ShieldCheck} />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-blue-500/5 hover:bg-blue-500/5 border-b-blue-500/20">
                        <TableHead className="w-[300px]">User</TableHead>
                        <TableHead>Contact Information</TableHead>
                        <TableHead>Plan Type</TableHead>
                        <TableHead>Subscription Validity</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {subscriptions.map((sub) => (
                        <TableRow key={sub.id} className="group">
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <UserAvatar user={sub.user} size="md" />
                              <div className="flex flex-col">
                                <p className="font-bold text-foreground">{sub.user.name}</p>
                                <p className="text-xs text-muted-foreground font-mono">{sub.user.id.slice(-8)}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-1 text-sm">
                              <span className="flex items-center gap-2"><Mail className="h-3.5 w-3.5 text-muted-foreground" /> {sub.user.email}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <StatusBadge status={sub.planType} />
                          </TableCell>
                          <TableCell>
                             <div className="flex flex-col">
                               <span className="text-sm font-semibold">Expires: {sub.endDate ? format(new Date(sub.endDate), 'MMM d, yyyy') : 'N/A'}</span>
                               <span className="text-xs text-blue-600 font-medium">
                                 {sub.endDate ? `${formatDistanceToNow(new Date(sub.endDate))} remaining` : '-'}
                               </span>
                             </div>
                          </TableCell>
                          <TableCell className="text-right">
                             <Button variant="ghost" size="sm" onClick={() => navigate(`/users/${sub.user.id}`)} className="gap-2">
                               <ExternalLink className="h-4 w-4" />
                               View Profile
                             </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="boost" className="mt-6">
          <Card className="border-yellow-500/20 shadow-lg overflow-hidden">
            <CardContent className="p-0">
              {boostedUsers.length === 0 ? (
                <div className="py-20 text-center">
                  <EmptyState title="No Boosted Accounts" description="Currently no accounts are using the add-to boost." icon={Zap} />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-yellow-500/5 hover:bg-yellow-500/5 border-b-yellow-500/20">
                        <TableHead className="w-[300px]">User</TableHead>
                        <TableHead>Contact Detail</TableHead>
                        <TableHead>Boost Status</TableHead>
                        <TableHead>Discovery Validity</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {boostedUsers.map((user) => (
                        <TableRow key={user._id} className="group">
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <UserAvatar user={user} size="md" />
                              <div className="flex flex-col">
                                <p className="font-bold text-foreground">{user.name}</p>
                                <p className="text-xs text-muted-foreground font-mono">{user._id.slice(-8)}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-1 text-sm">
                              <span className="flex items-center gap-2"><Mail className="h-3.5 w-3.5 text-muted-foreground" /> {user.email}</span>
                              <span className="flex items-center gap-2"><Phone className="h-3.5 w-3.5 text-muted-foreground" /> {user.phone}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                             <div className="flex items-center gap-2 text-yellow-600 font-bold bg-yellow-500/10 w-fit px-3 py-1 rounded-full text-xs">
                               <Zap className="h-3 w-3 fill-yellow-500" />
                               BOOST ACTIVE
                             </div>
                          </TableCell>
                          <TableCell>
                             <div className="flex flex-col">
                               <span className="text-sm font-semibold">Ends: {format(new Date(user.boostedUntil), 'MMM d, yyyy')}</span>
                               <span className="text-xs text-yellow-600 font-bold flex items-center gap-1">
                                 <Clock className="h-3 w-3" />
                                 {formatDistanceToNow(new Date(user.boostedUntil))} left
                               </span>
                             </div>
                          </TableCell>
                          <TableCell className="text-right">
                             <Button variant="ghost" size="sm" onClick={() => navigate(`/users/${user._id}`)} className="gap-2">
                               <ExternalLink className="h-4 w-4" />
                               View Profile
                             </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Badge({ children, variant = 'default', className }: { children: React.ReactNode, variant?: 'default' | 'outline' | 'secondary' | 'destructive', className?: string }) {
  const variants = {
    default: 'bg-primary text-primary-foreground',
    outline: 'border border-border text-foreground',
    secondary: 'bg-secondary text-secondary-foreground',
    destructive: 'bg-destructive text-destructive-foreground',
  };
  return (
    <span className={cn("inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-medium", variants[variant], className)}>
      {children}
    </span>
  );
}
