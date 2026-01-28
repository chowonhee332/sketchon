import React, { useState, useContext } from 'react';
import { Search, Filter, MoreVertical, Edit2, Trash2, Mail, Calendar, ShieldCheck } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { UserContext } from '../../App';

const UserManagement = ({ showHeader = true, limit = null }) => {
    const { users } = useContext(UserContext);
    const [searchTerm, setSearchTerm] = useState('');

    let filteredUsers = users.filter(user =>
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (limit) {
        filteredUsers = filteredUsers.slice(0, limit);
    }

    const getStatusStyle = (status) => {
        switch (status) {
            case 'Active': return 'bg-green-100 text-green-700';
            case 'Inactive': return 'bg-slate-100 text-slate-700';
            case 'Pending': return 'bg-amber-100 text-amber-700';
            default: return 'bg-slate-100 text-slate-700';
        }
    };

    return (
        <div className="space-y-6">
            {showHeader && (
                <div className="flex justify-between items-end">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">User Management</h1>
                        <p className="text-slate-500 text-sm mt-1">Manage your platform members and their permissions.</p>
                    </div>
                    <Button className="bg-slate-900 text-white hover:bg-slate-800 rounded-lg">
                        Add New User
                    </Button>
                </div>
            )}

            {/* Filters & Search */}
            <div className="bg-white p-4 rounded-xl border shadow-sm flex items-center gap-4">
                <div className="relative flex-1">
                    <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search by name or email..."
                        className="w-full bg-slate-50 border-none rounded-lg pl-10 pr-4 h-10 text-sm focus:ring-2 focus:ring-slate-200 transition-all"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <Button variant="outline" className="flex items-center gap-2 h-10 px-4 rounded-lg border-slate-200">
                    <Filter size={16} />
                    <span className="text-sm font-medium">Filters</span>
                </Button>
            </div>

            {/* User Table */}
            <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50 border-b">
                            <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">User</th>
                            <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Role</th>
                            <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Joined</th>
                            <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {filteredUsers.map((user) => (
                            <tr key={user.id} className="hover:bg-slate-50/50 transition-colors group">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold border">
                                            {user.name[0]}
                                        </div>
                                        <div>
                                            <div className="text-sm font-bold text-slate-900">{user.name}</div>
                                            <div className="text-xs text-slate-500">{user.email}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="text-xs font-medium text-slate-600 px-2 py-1 bg-slate-100 rounded-md border">
                                        {user.role}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide ${getStatusStyle(user.status)}`}>
                                        {user.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="text-sm text-slate-500">{user.joined}</div>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-900"><Edit2 size={14} /></Button>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-red-600"><Trash2 size={14} /></Button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {filteredUsers.length === 0 && (
                    <div className="py-20 text-center text-slate-400 italic">
                        No users found matching your search.
                    </div>
                )}
            </div>
        </div>
    );
};

export default UserManagement;
