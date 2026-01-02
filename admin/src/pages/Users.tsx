import { useState, useEffect } from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SuspendModal } from '@/components/SuspendModal';
import { toast } from 'sonner';

interface User {
    _id: string;
    name: string;
    email: string;
    phone: string;
    roles: string[];
    status: 'active' | 'suspended' | 'banned';
    createdAt: string;
}

export default function Users() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    // Filters
    const [search, setSearch] = useState('');
    const [role, setRole] = useState('all');
    const [status, setStatus] = useState('all');

    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [isSuspendModalOpen, setIsSuspendModalOpen] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: page.toString(),
                limit: '10',
            });
            if (search) params.append('search', search);
            if (role && role !== 'all') params.append('role', role);
            if (status && status !== 'all') params.append('status', status);

            // Assuming API base URL is set in environment or proxy
            const res = await fetch(`http://localhost:8000/admin/users?${params}`); // Adjust URL as needed
            const data = await res.json();

            if (data.success) {
                setUsers(data.data.users);
                setTotalPages(data.data.pagination.pages);
            } else {
                toast.error('Failed to fetch users');
            }
        } catch (error) {
            toast.error('Error fetching users');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, [page, role, status]);

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setPage(1);
        fetchUsers();
    };

    const openSuspendModal = (user: User) => {
        setSelectedUser(user);
        setIsSuspendModalOpen(true);
    };

    const handleSuspend = async (data: { status: string, reason: string, duration?: string }) => {
        if (!selectedUser) return;
        setActionLoading(true);
        try {
            const res = await fetch(`http://localhost:8000/admin/users/${selectedUser._id}/suspend`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            const result = await res.json();

            if (result.success) {
                toast.success(`User ${data.status} successfully`);
                setIsSuspendModalOpen(false);
                fetchUsers(); // Refresh list
            } else {
                toast.error(result.message || 'Action failed');
            }
        } catch (error) {
            toast.error('Error performing action');
        } finally {
            setActionLoading(false);
        }
    };

    const handleUnsuspend = async (userId: string) => {
        if (!confirm('Are you sure you want to reactivate this user?')) return;

        try {
            const res = await fetch(`http://localhost:8000/admin/users/${userId}/unsuspend`, {
                method: 'PUT',
            });
            const result = await res.json();

            if (result.success) {
                toast.success('User reactivated successfully');
                fetchUsers();
            } else {
                toast.error(result.message);
            }
        } catch (error) {
            toast.error('Error reactivating user');
        }
    };

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold">Users</h1>
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4">
                <form onSubmit={handleSearchSubmit} className="flex gap-2 w-full md:w-auto">
                    <Input
                        placeholder="Search by name, email, phone"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full md:w-64"
                    />
                    <Button type="submit">Search</Button>
                </form>

                <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="suspended">Suspended</SelectItem>
                        <SelectItem value="banned">Banned</SelectItem>
                    </SelectContent>
                </Select>

                <Select value={role} onValueChange={setRole}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Role" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Roles</SelectItem>
                        <SelectItem value="user">User</SelectItem>
                        <SelectItem value="seller">Seller</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Table */}
            <div className="border rounded-md">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Phone</TableHead>
                            <TableHead>Roles</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-10">Loading...</TableCell>
                            </TableRow>
                        ) : users.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-10">No users found</TableCell>
                            </TableRow>
                        ) : (
                            users.map((user) => (
                                <TableRow key={user._id}>
                                    <TableCell className="font-medium">{user.name}</TableCell>
                                    <TableCell>{user.email}</TableCell>
                                    <TableCell>{user.phone}</TableCell>
                                    <TableCell>
                                        {user.roles.map(r => (
                                            <Badge key={r} variant="outline" className="mr-1 capitalize">
                                                {r}
                                            </Badge>
                                        ))}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={user.status === 'active' ? 'default' : 'destructive'} className="capitalize">
                                            {user.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {user.status === 'active' ? (
                                            <Button
                                                variant="destructive"
                                                size="sm"
                                                onClick={() => openSuspendModal(user)}
                                            >
                                                Suspend
                                            </Button>
                                        ) : (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="text-green-600 border-green-600 hover:text-green-700 hover:bg-green-50"
                                                onClick={() => handleUnsuspend(user._id)}
                                            >
                                                Reactivate
                                            </Button>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination (Simple) */}
            <div className="flex justify-end gap-2">
                <Button
                    variant="outline"
                    disabled={page <= 1}
                    onClick={() => setPage(p => p - 1)}
                >
                    Previous
                </Button>
                <span className="flex items-center px-4">Page {page} of {totalPages}</span>
                <Button
                    variant="outline"
                    disabled={page >= totalPages}
                    onClick={() => setPage(p => p + 1)}
                >
                    Next
                </Button>
            </div>

            <SuspendModal
                isOpen={isSuspendModalOpen}
                onClose={() => setIsSuspendModalOpen(false)}
                onConfirm={handleSuspend}
                isLoading={actionLoading}
                title={selectedUser ? `Suspend ${selectedUser.name}` : 'Suspend User'}
            />
        </div>
    );
}
