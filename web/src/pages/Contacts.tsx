import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/api';
import { Plus, SlidersHorizontal, Users } from 'lucide-react';
import { ContactCard, SearchBar, EmptyState, Button, TopNav, AddContactModal } from '../components';

interface Contact {
    id: string;
    display_name: string;
    primary_phone?: string;
    primary_email?: string;
    next_checkin_date?: string;
    last_interaction?: string;
}

type SortOption = 'name' | 'recent' | 'due';
type FilterOption = 'all' | 'due' | 'recent';

export function ContactsPage() {
    const navigate = useNavigate();
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    const [sortBy, setSortBy] = useState<SortOption>('name');
    const [filterBy, setFilterBy] = useState<FilterOption>('all');
    const [showFilters, setShowFilters] = useState(false);
    const [user, setUser] = useState<any>(null);
    const [showAddModal, setShowAddModal] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);

            if (!user) {
                setLoading(false);
                return;
            }

            // Load contacts with last interaction date
            const { data: contactsData, error: contactsError } = await supabase
                .from('contacts')
                .select(`
                    id,
                    display_name,
                    primary_phone,
                    primary_email,
                    next_checkin_date
                `)
                .order('display_name');

            if (contactsError) throw contactsError;

            // Get last interaction date for each contact
            const contactsWithInteractions = await Promise.all(
                (contactsData || []).map(async (contact) => {
                    const { data: interactions } = await supabase
                        .from('interactions')
                        .select('occurred_at')
                        .eq('contact_id', contact.id)
                        .order('occurred_at', { ascending: false })
                        .limit(1);

                    return {
                        ...contact,
                        last_interaction: interactions?.[0]?.occurred_at
                    };
                })
            );

            setContacts(contactsWithInteractions);
        } catch (err: any) {
            console.error(err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveContact = async (contactData: {
        display_name: string;
        primary_phone?: string;
        primary_email?: string;
        cadence_days?: number;
        notes?: string;
    }) => {
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        // Calculate next check-in date based on cadence
        const nextCheckinDate = contactData.cadence_days
            ? new Date(Date.now() + contactData.cadence_days * 24 * 60 * 60 * 1000).toISOString()
            : null;

        const { data, error } = await supabase
            .from('contacts')
            .insert({
                ...contactData,
                owner_uid: user.id,
                next_checkin_date: nextCheckinDate,
            })
            .select()
            .single();

        if (error) throw error;

        // Reload contacts list
        await loadData();
    };

    const getFilteredAndSortedContacts = () => {
        let result = [...contacts];

        // Apply search filter
        if (search) {
            result = result.filter(c =>
                c.display_name.toLowerCase().includes(search.toLowerCase()) ||
                c.primary_phone?.includes(search) ||
                c.primary_email?.toLowerCase().includes(search.toLowerCase())
            );
        }

        // Apply category filter
        const now = new Date();
        if (filterBy === 'due') {
            result = result.filter(c => {
                if (!c.next_checkin_date) return false;
                return new Date(c.next_checkin_date) <= now;
            });
        } else if (filterBy === 'recent') {
            const sevenDaysAgo = new Date(now);
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
            result = result.filter(c => {
                if (!c.last_interaction) return false;
                return new Date(c.last_interaction) >= sevenDaysAgo;
            });
        }

        // Apply sorting
        result.sort((a, b) => {
            switch (sortBy) {
                case 'name':
                    return a.display_name.localeCompare(b.display_name);
                case 'recent':
                    const dateA = a.last_interaction ? new Date(a.last_interaction).getTime() : 0;
                    const dateB = b.last_interaction ? new Date(b.last_interaction).getTime() : 0;
                    return dateB - dateA;
                case 'due':
                    const dueA = a.next_checkin_date ? new Date(a.next_checkin_date).getTime() : Infinity;
                    const dueB = b.next_checkin_date ? new Date(b.next_checkin_date).getTime() : Infinity;
                    return dueA - dueB;
                default:
                    return 0;
            }
        });

        return result;
    };

    const filteredContacts = getFilteredAndSortedContacts();

    if (!user) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <EmptyState
                    icon={<Users className="w-8 h-8" />}
                    title="Please Sign In"
                    description="Sign in to view and manage your contacts"
                    action={
                        <Button onClick={() => navigate('/login')}>
                            Sign In
                        </Button>
                    }
                />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <TopNav user={user} title="Contacts" />
            <div className="max-w-2xl mx-auto p-4 pb-24">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <p className="text-sm text-gray-600 mt-1">
                            {contacts.length} {contacts.length === 1 ? 'contact' : 'contacts'}
                        </p>
                    </div>
                    <Button
                        variant="primary"
                        size="sm"
                        icon={<Plus className="w-4 h-4" />}
                        onClick={() => setShowAddModal(true)}
                    >
                        Add Contact
                    </Button>
                </div>

                {/* Search Bar */}
                <SearchBar
                    placeholder="Search by name, phone, or email..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onClear={() => setSearch('')}
                    showClear={search.length > 0}
                    className="mb-4"
                />

                {/* Filter & Sort Controls */}
                <div className="flex items-center gap-3 mb-6">
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
                            showFilters || filterBy !== 'all' || sortBy !== 'name'
                                ? 'bg-blue-50 border-blue-300 text-blue-700'
                                : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                        }`}
                    >
                        <SlidersHorizontal className="w-4 h-4" />
                        <span className="text-sm font-medium">Filters</span>
                    </button>

                    {(filterBy !== 'all' || sortBy !== 'name') && (
                        <button
                            onClick={() => {
                                setFilterBy('all');
                                setSortBy('name');
                            }}
                            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                        >
                            Clear all
                        </button>
                    )}
                </div>

                {/* Expandable Filters */}
                {showFilters && (
                    <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
                        <div className="mb-4">
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Filter by
                            </label>
                            <div className="flex flex-wrap gap-2">
                                <button
                                    onClick={() => setFilterBy('all')}
                                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                                        filterBy === 'all'
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                                >
                                    All Contacts
                                </button>
                                <button
                                    onClick={() => setFilterBy('due')}
                                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                                        filterBy === 'due'
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                                >
                                    Due for Check-in
                                </button>
                                <button
                                    onClick={() => setFilterBy('recent')}
                                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                                        filterBy === 'recent'
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                                >
                                    Recently Contacted
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Sort by
                            </label>
                            <div className="flex flex-wrap gap-2">
                                <button
                                    onClick={() => setSortBy('name')}
                                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                                        sortBy === 'name'
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                                >
                                    Name (A-Z)
                                </button>
                                <button
                                    onClick={() => setSortBy('recent')}
                                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                                        sortBy === 'recent'
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                                >
                                    Most Recent
                                </button>
                                <button
                                    onClick={() => setSortBy('due')}
                                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                                        sortBy === 'due'
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                                >
                                    Next Check-in
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Error State */}
                {error && (
                    <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-4">
                        {error}
                    </div>
                )}

                {/* Loading State */}
                {loading ? (
                    <div className="text-center py-12 text-gray-500">
                        Loading contacts...
                    </div>
                ) : filteredContacts.length > 0 ? (
                    /* Contact List */
                    <div className="space-y-3">
                        {filteredContacts.map(contact => (
                            <ContactCard
                                key={contact.id}
                                id={contact.id}
                                name={contact.display_name}
                                phone={contact.primary_phone}
                                lastContact={contact.last_interaction}
                                nextCheckin={contact.next_checkin_date}
                            />
                        ))}
                    </div>
                ) : (
                    /* Empty State */
                    <EmptyState
                        icon={<Users className="w-8 h-8" />}
                        title={
                            search || filterBy !== 'all'
                                ? 'No contacts found'
                                : 'No contacts yet'
                        }
                        description={
                            search || filterBy !== 'all'
                                ? 'Try adjusting your search or filters'
                                : 'Add your first contact to start tracking conversations'
                        }
                        action={
                            !search && filterBy === 'all' ? (
                                <Button
                                    icon={<Plus className="w-5 h-5" />}
                                    onClick={() => setShowAddModal(true)}
                                >
                                    Add Your First Contact
                                </Button>
                            ) : undefined
                        }
                    />
                )}

                {/* Add Contact Modal */}
                <AddContactModal
                    isOpen={showAddModal}
                    onClose={() => setShowAddModal(false)}
                    onSave={handleSaveContact}
                />
            </div>
        </div>
    );
}
