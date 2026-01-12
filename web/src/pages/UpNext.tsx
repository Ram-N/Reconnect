import { useEffect, useState } from 'react';
import { getUpNext, supabase } from '../lib/api';
import { Loader2, Calendar, Phone, Mic } from 'lucide-react';
import { Link } from 'react-router-dom';

export function UpNextPage() {
    const [contacts, setContacts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                setError('Please log in to see your tasks.');
                setLoading(false);
                return;
            }
            const data = await getUpNext();
            setContacts(data || []);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>;

    return (
        <div className="max-w-md mx-auto p-4 pb-20">
            <h1 className="text-2xl font-bold mb-6">Up Next</h1>

            {error && <div className="bg-red-50 text-red-600 p-3 rounded mb-4">{error}</div>}

            <div className="space-y-4">
                {contacts.length === 0 && !error && (
                    <p className="text-gray-500 text-center py-8">No pending check-ins! Great job.</p>
                )}

                {contacts.map(contact => (
                    <div key={contact.id} className="bg-white p-4 rounded-lg shadow flex items-center justify-between">
                        <div>
                            <h3 className="font-semibold text-lg">{contact.display_name}</h3>
                            <div className="flex items-center text-sm text-orange-600 gap-1">
                                <Calendar className="w-3 h-3" />
                                <span>Due: {new Date(contact.next_checkin_date).toLocaleDateString()}</span>
                            </div>
                        </div>
                        <Link
                            to={`/?contactId=${contact.id}`}
                            className="p-2 bg-blue-100 text-blue-600 rounded-full hover:bg-blue-200"
                        >
                            <Phone className="w-5 h-5" />
                        </Link>
                    </div>
                ))}
            </div>

            <nav className="fixed bottom-0 left-0 right-0 bg-white border-t flex justify-around p-4">
                <Link to="/up-next" className="text-blue-600 flex flex-col items-center text-xs">
                    <Calendar className="w-6 h-6" />
                    Up Next
                </Link>
                <Link to="/" className="text-gray-400 flex flex-col items-center text-xs">
                    <Mic className="w-6 h-6" />
                    Record
                </Link>
                <Link to="/contacts" className="text-gray-400 flex flex-col items-center text-xs">
                    <Phone className="w-6 h-6" />
                    Contacts
                </Link>
            </nav>
        </div>
    );
}
