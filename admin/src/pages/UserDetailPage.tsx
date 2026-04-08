import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { usersApi } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UserAvatar } from '@/components/UserAvatar';
import { LoadingState } from '@/components/StateDisplay';
import { 
  ArrowLeft, 
  Wallet, 
  Zap, 
  ShieldCheck, 
  Calendar, 
  Mail, 
  Phone, 
  MapPin, 
  Briefcase,
  Plus,
  Minus,
  History
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function UserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [walletAmount, setWalletAmount] = useState('');
  const [walletType, setWalletType] = useState<'credit' | 'debit'>('credit');
  const [walletDesc, setWalletDesc] = useState('');
  const [isUpdatingWallet, setIsUpdatingWallet] = useState(false);

  const fetchUser = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const data = await usersApi.getById(id);
      setUser(data);
    } catch (error) {
      toast.error('Failed to load user details');
      navigate('/users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, [id]);

  const handleWalletAction = async () => {
    if (!id || !walletAmount) return;
    setIsUpdatingWallet(true);
    try {
      await usersApi.updateWallet(id, {
        amount: parseFloat(walletAmount),
        type: walletType,
        description: walletDesc || `Admin ${walletType}`
      });
      toast.success(`Wallet ${walletType}ed successfully`);
      setWalletAmount('');
      setWalletDesc('');
      fetchUser(); // Refresh data
    } catch (error) {
      toast.error('Failed to update wallet');
    } finally {
      setIsUpdatingWallet(false);
    }
  };

  if (loading) return <LoadingState message="Loading user profile..." />;
  if (!user) return null;

  const isBoosted = user.isBoosted && new Date(user.boostedUntil) > new Date();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold">User Profile</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Basic Info */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="overflow-hidden">
            <div className="h-24 bg-gradient-to-r from-primary/20 to-primary/5" />
            <CardContent className="relative pt-0 flex flex-col items-center">
              <div className="absolute -top-12 border-4 border-card rounded-full overflow-hidden shadow-xl">
                <UserAvatar user={user} className="h-24 w-24 text-2xl" />
              </div>
              <div className="mt-14 text-center">
                <h2 className="text-xl font-bold">{user.name}</h2>
                <p className="text-muted-foreground font-mono text-xs">ID: {user._id}</p>
                <div className="flex items-center justify-center gap-2 mt-3">
                  {user.isVerified && (
                    <Badge className="bg-blue-500 hover:bg-blue-600 border-none gap-1">
                      <ShieldCheck className="h-3 w-3" /> Expert
                    </Badge>
                  )}
                  {isBoosted && (
                    <Badge className="bg-yellow-500 hover:bg-yellow-600 text-black border-none gap-1">
                      <Zap className="h-3 w-3" /> Boosted
                    </Badge>
                  )}
                  <Badge variant={user.status === 'active' ? 'default' : 'destructive'} className="capitalize">
                      {user.status}
                  </Badge>
                </div>
              </div>

              <div className="w-full mt-6 space-y-4 pt-6 border-t border-border">
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-foreground">{user.email}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="text-foreground">{user.phone}</span>
                </div>
                {user.location && (
                  <div className="flex items-center gap-3 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="text-foreground">{user.location}</span>
                  </div>
                )}
                {user.roles && user.roles.length > 0 && (
                  <div className="flex items-center gap-3 text-sm">
                    <Briefcase className="h-4 w-4 text-muted-foreground" />
                    <div className="flex flex-wrap gap-1">
                      {user.roles.map((r: string) => (
                        <span key={r} className="capitalize">{r}</span>
                      ))}
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-3 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Joined {format(new Date(user.createdAt), 'MMMM yyyy')}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Wallet Summary */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center justify-between">
                Wallet Balance
                <Wallet className="h-4 w-4 text-primary" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">₹{user.walletBalance?.toLocaleString('en-IN') || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">Available funds in vault</p>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Detailed Management */}
        <div className="lg:col-span-2 space-y-6">
          <Tabs defaultValue="management">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="management">Management Actions</TabsTrigger>
              <TabsTrigger value="details">Full Profile Data</TabsTrigger>
            </TabsList>

            <TabsContent value="management" className="space-y-6 mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Wallet Management */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Wallet Adjustment</CardTitle>
                    <CardDescription>Manually credit or debit user funds</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex gap-2 p-1 bg-muted rounded-lg">
                      <Button 
                        variant={walletType === 'credit' ? 'default' : 'ghost'} 
                        className="flex-1 text-xs h-8"
                        onClick={() => setWalletType('credit')}
                      >
                        <Plus className="mr-1 h-3 w-3" /> Credit
                      </Button>
                      <Button 
                        variant={walletType === 'debit' ? 'destructive' : 'ghost'} 
                        className="flex-1 text-xs h-8"
                        onClick={() => setWalletType('debit')}
                      >
                        <Minus className="mr-1 h-3 w-3" /> Debit
                      </Button>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="amount">Amount (INR)</Label>
                      <Input 
                        id="amount" 
                        type="number" 
                        placeholder="0.00" 
                        value={walletAmount}
                        onChange={(e) => setWalletAmount(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="desc">Description (Internal)</Label>
                      <Input 
                        id="desc" 
                        placeholder="Reason for adjustment" 
                        value={walletDesc}
                        onChange={(e) => setWalletDesc(e.target.value)}
                      />
                    </div>
                    <Button 
                      className="w-full" 
                      onClick={handleWalletAction}
                      disabled={isUpdatingWallet || !walletAmount}
                    >
                      {isUpdatingWallet ? 'Processing...' : `Confirm ${walletType}`}
                    </Button>
                  </CardContent>
                </Card>

                {/* Subscriptions Status */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Special Status</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex items-center justify-between p-3 bg-blue-500/5 rounded-lg border border-blue-500/10">
                      <div className="flex items-center gap-3">
                        <ShieldCheck className="h-5 w-5 text-blue-500" />
                        <div>
                          <p className="text-sm font-semibold">Expert Badge</p>
                          <p className="text-xs text-muted-foreground">{user.isVerified ? 'Currently Active' : 'Not Verified'}</p>
                        </div>
                      </div>
                      <Badge variant={user.isVerified ? 'default' : 'outline'}>{user.isVerified ? 'YES' : 'NO'}</Badge>
                    </div>

                    <div className={cn(
                      "flex items-center justify-between p-3 rounded-lg border",
                      isBoosted ? "bg-yellow-500/5 border-yellow-500/10" : "bg-muted/50 border-border"
                    )}>
                      <div className="flex items-center gap-3">
                        <Zap className={cn("h-5 w-5", isBoosted ? "text-yellow-500" : "text-muted-foreground")} />
                        <div>
                          <p className="text-sm font-semibold">Profile Boost</p>
                          <p className="text-xs text-muted-foreground">
                            {isBoosted 
                              ? `Active for ${formatDistanceToNow(new Date(user.boostedUntil))}` 
                              : user.boostedUntil ? 'Expired' : 'Never boosted'}
                          </p>
                        </div>
                      </div>
                      <Badge variant={isBoosted ? 'default' : 'outline'}>{isBoosted ? 'YES' : 'NO'}</Badge>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="details" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Detailed Raw Data</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 mt-2">
                    {[
                      { label: 'Full Name', value: user.name },
                      { label: 'Username', value: `@${user.username || 'n/a'}` },
                      { label: 'Email', value: user.email },
                      { label: 'Phone', value: user.phone },
                      { label: 'Account Type', value: user.accountType },
                      { label: 'Verification Status', value: user.verificationStatus },
                      { label: 'Industries', value: user.industries?.join(', ') || 'None' },
                      { label: 'Experience', value: `${user.experience || 0} years` },
                      { label: 'Followers', value: user.stats?.followersCount || 0 },
                      { label: 'Following', value: user.stats?.followingCount || 0 },
                      { label: 'Posts', value: user.stats?.postsCount || 0 },
                      { label: 'Total Likes Received', value: user.stats?.likesReceived || 0 },
                    ].map((item, idx) => (
                      <div key={idx} className="flex flex-col space-y-1">
                        <span className="text-xs font-semibold text-muted-foreground uppercase">{item.label}</span>
                        <span className="text-sm font-medium">{item.value}</span>
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-8">
                    <span className="text-xs font-semibold text-muted-foreground uppercase">Biography</span>
                    <p className="text-sm mt-1 bg-muted p-3 rounded-lg border border-border italic">
                      {user.bio || 'No biography provided.'}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
