import React, { useEffect, useState } from 'react';
import { getContacts, supabase } from '../lib/api';
import { Loader2, Search, User } from 'lucide-react';

export function ContactsPage() {
    const [contacts, setContacts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState('');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                setError('Please log in to see your contacts.');
                setLoading(false);
                return;
            }
            const data = await getContacts();
            setContacts(data || []);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const filteredContacts = contacts.filter(c =>
        c.display_name.toLowerCase().includes(search.toLowerCase())
    );

    if (loading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>;

    return (
        <div className="max-w-md mx-auto p-4 pb-20">
            <h1 className="text-2xl font-bold mb-6">Contacts</h1>

            <div className="relative mb-6">
                <Search className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
                <input
                    type="text"
                    placeholder="Search contacts..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
            </div>

            {error && <div className="bg-red-50 text-red-600 p-3 rounded mb-4">{error}</div>}

            <div className="space-y-2">
                {filteredContacts.map(contact => (
                    <div key={contact.id} className="bg-white p-4 rounded-lg shadow flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-gray-600">
                            <User className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="font-semibold">{contact.display_name}</h3>
                            <p className="text-xs text-gray-500">Last check-in: {contact.last_interaction ? new Date(contact.last_interaction).toLocaleDateString() : 'Never'}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
