import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mic, Search, Calendar, MessageSquare, Users, TrendingUp } from 'lucide-react';
import { Button, ContactCard, EmptyState, TopNav } from '../components';
import { supabase, getUpNext } from '../lib/api';

interface RecentInteraction {
    id: string;
    contact_id: string;
    occurred_at: string;
    summary?: string;
    transcript: string;
    contact?: {
        display_name: string;
    };
}

interface UpcomingContact {
    id: string;
    display_name: string;
    next_checkin_date: string;
}

interface Stats {
    totalContacts: number;
    notesThisMonth: number;
}

export function HomePage() {
    const navigate = useNavigate();
    const [upcomingContacts, setUpcomingContacts] = useState<UpcomingContact[]>([]);
    const [recentInteractions, setRecentInteractions] = useState<RecentInteraction[]>([]);
    const [stats, setStats] = useState<Stats>({ totalContacts: 0, notesThisMonth: 0 });
    const [isLoading, setIsLoading] = useState(true);
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        // Initial load
        loadDashboardData();

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user || null);
            if (session?.user) {
                loadDashboardData();
            }
        });

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    const loadDashboardData = async () => {
        setIsLoading(true);
        try {
            // Check auth
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);

            if (!user) {
                setIsLoading(false);
                return;
            }

            // Load upcoming check-ins (next 3)
            const upcoming = await getUpNext();
            setUpcomingContacts(upcoming.slice(0, 3));

            // Load recent interactions (last 3)
            const { data: interactions, error: intError } = await supabase
                .from('interactions')
                .select(`
                    id,
                    contact_id,
                    occurred_at,
                    summary,
                    transcript,
                    contacts (display_name)
                `)
                .order('occurred_at', { ascending: false })
                .limit(3);

            if (!intError && interactions) {
                setRecentInteractions(interactions.map(i => ({
                    ...i,
                    contact: i.contacts ? { display_name: i.contacts.display_name } : undefined
                })));
            }

            // Load stats
            const { data: contacts } = await supabase
                .from('contacts')
                .select('id');

            const startOfMonth = new Date();
            startOfMonth.setDate(1);
            startOfMonth.setHours(0, 0, 0, 0);

            const { data: monthInteractions } = await supabase
                .from('interactions')
                .select('id')
                .gte('occurred_at', startOfMonth.toISOString());

            setStats({
                totalContacts: contacts?.length || 0,
                notesThisMonth: monthInteractions?.length || 0,
            });
        } catch (error) {
            console.error('Failed to load dashboard:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays} days ago`;
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    if (isLoading && !user) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading...</p>
                </div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="min-h-screen bg-gray-50 p-4 pb-24">
                <div className="max-w-2xl mx-auto pt-8">
                    <div className="text-center mb-8">
                        <h1 className="text-4xl font-bold text-gray-900 mb-2">Reconnect</h1>
                        <p className="text-gray-600">Stay in touch with the people who matter</p>
                    </div>
                    <EmptyState
                        icon={<Users className="w-8 h-8" />}
                        title="Welcome to Reconnect"
                        description="Sign in to start capturing notes and managing your relationships"
                        action={
                            <Button onClick={() => navigate('/login')}>
                                Sign In
                            </Button>
                        }
                    />
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <TopNav user={user} />
            <div className="max-w-2xl mx-auto p-4 pb-24">
                {/* Header */}
                <div className="mb-8 pt-4">
                    <p className="text-gray-600">Stay in touch with the people who matter</p>
                </div>

                {/* Main Action Buttons */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                    <button
                        onClick={() => navigate('/record')}
                        className="group relative bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all active:scale-95"
                    >
                        <div className="flex flex-col items-center text-center">
                            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mb-4 group-hover:bg-white/30 transition-colors">
                                <Mic className="w-8 h-8" />
                            </div>
                            <h2 className="text-2xl font-bold mb-2">Add a Note</h2>
                            <p className="text-blue-100 text-sm">Record a voice note about a conversation</p>
                        </div>
                    </button>

                    <button
                        onClick={() => navigate('/contacts')}
                        className="group relative bg-gradient-to-br from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all active:scale-95"
                    >
                        <div className="flex flex-col items-center text-center">
                            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mb-4 group-hover:bg-white/30 transition-colors">
                                <Search className="w-8 h-8" />
                            </div>
                            <h2 className="text-2xl font-bold mb-2">Look Up Notes</h2>
                            <p className="text-purple-100 text-sm">Browse contacts and view conversation history</p>
                        </div>
                    </button>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-2 gap-4 mb-8">
                    <div className="bg-white rounded-lg shadow-sm p-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                <Users className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-gray-900">{stats.totalContacts}</p>
                                <p className="text-xs text-gray-500">Contacts</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-lg shadow-sm p-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                                <TrendingUp className="w-5 h-5 text-green-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-gray-900">{stats.notesThisMonth}</p>
                                <p className="text-xs text-gray-500">Notes this month</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Upcoming Check-ins */}
                {upcomingContacts.length > 0 && (
                    <div className="mb-8">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                                <Calendar className="w-5 h-5 text-orange-500" />
                                Upcoming Check-ins
                            </h3>
                            <button
                                onClick={() => navigate('/follow-ups')}
                                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                            >
                                View all
                            </button>
                        </div>
                        <div className="space-y-3">
                            {upcomingContacts.map((contact) => (
                                <ContactCard
                                    key={contact.id}
                                    id={contact.id}
                                    name={contact.display_name}
                                    nextCheckin={contact.next_checkin_date}
                                    variant="compact"
                                />
                            ))}
                        </div>
                    </div>
                )}

                {/* Recent Notes */}
                {recentInteractions.length > 0 && (
                    <div className="mb-8">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                                <MessageSquare className="w-5 h-5 text-blue-500" />
                                Recent Notes
                            </h3>
                        </div>
                        <div className="space-y-3">
                            {recentInteractions.map((interaction) => (
                                <div
                                    key={interaction.id}
                                    className="bg-white rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow"
                                >
                                    <div className="flex items-start justify-between mb-2">
                                        <p className="font-medium text-gray-900">
                                            {interaction.contact?.display_name || 'Unknown Contact'}
                                        </p>
                                        <span className="text-xs text-gray-500">
                                            {formatDate(interaction.occurred_at)}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-600 line-clamp-2">
                                        {interaction.summary || interaction.transcript}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Empty state for no data */}
                {!isLoading && upcomingContacts.length === 0 && recentInteractions.length === 0 && stats.totalContacts === 0 && (
                    <EmptyState
                        icon={<Mic className="w-8 h-8" />}
                        title="Get Started"
                        description="Record your first voice note to start tracking your conversations and relationships"
                        action={
                            <Button
                                icon={<Mic className="w-5 h-5" />}
                                onClick={() => navigate('/record')}
                                size="lg"
                            >
                                Add Your First Note
                            </Button>
                        }
                    />
                )}
            </div>
        </div>
    );
}
