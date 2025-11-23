import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, Circle, Calendar, User, AlertCircle } from 'lucide-react';
import { EmptyState, Button } from '../components';
import { supabase } from '../lib/api';

interface FollowUp {
    id: string;
    contact_id: string;
    interaction_id: string;
    task: string;
    due_date: string;
    completed: boolean;
    contact?: {
        display_name: string;
    };
}

export function FollowUpsPage() {
    const navigate = useNavigate();
    const [followups, setFollowups] = useState<FollowUp[]>([]);
    const [filter, setFilter] = useState<'all' | 'overdue' | 'today' | 'week'>('all');
    const [isLoading, setIsLoading] = useState(true);
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        loadFollowUps();
    }, []);

    const loadFollowUps = async () => {
        setIsLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);

            if (!user) {
                setIsLoading(false);
                return;
            }

            // Load follow-ups from database
            const { data, error } = await supabase
                .from('followups')
                .select(`
                    id,
                    contact_id,
                    interaction_id,
                    task,
                    due_date,
                    completed,
                    contacts (display_name)
                `)
                .order('due_date', { ascending: true });

            if (error) throw error;

            const formattedData = data?.map(f => ({
                ...f,
                contact: f.contacts ? { display_name: f.contacts.display_name } : undefined
            })) || [];

            setFollowups(formattedData);
        } catch (error) {
            console.error('Failed to load follow-ups:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const toggleComplete = async (id: string, currentStatus: boolean) => {
        try {
            const { error } = await supabase
                .from('followups')
                .update({ completed: !currentStatus })
                .eq('id', id);

            if (error) throw error;

            // Update local state
            setFollowups(followups.map(f =>
                f.id === id ? { ...f, completed: !currentStatus } : f
            ));
        } catch (error) {
            console.error('Failed to toggle follow-up:', error);
        }
    };

    const getFilteredFollowUps = () => {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const weekFromNow = new Date(today);
        weekFromNow.setDate(weekFromNow.getDate() + 7);

        return followups.filter(f => {
            if (f.completed && filter !== 'all') return false;

            const dueDate = new Date(f.due_date);

            switch (filter) {
                case 'overdue':
                    return dueDate < today && !f.completed;
                case 'today':
                    return dueDate.getTime() === today.getTime() && !f.completed;
                case 'week':
                    return dueDate >= today && dueDate <= weekFromNow && !f.completed;
                case 'all':
                default:
                    return true;
            }
        });
    };

    const formatDueDate = (dateStr: string) => {
        const date = new Date(dateStr);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const dueDate = new Date(date);
        dueDate.setHours(0, 0, 0, 0);

        const diffTime = dueDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays < 0) return `${Math.abs(diffDays)} days overdue`;
        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return 'Tomorrow';
        if (diffDays < 7) return `In ${diffDays} days`;

        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    const isOverdue = (dateStr: string) => {
        const date = new Date(dateStr);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return date < today;
    };

    const filteredFollowUps = getFilteredFollowUps();
    const overdueCount = followups.filter(f => !f.completed && isOverdue(f.due_date)).length;

    if (!user) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <EmptyState
                    icon={<AlertCircle className="w-8 h-8" />}
                    title="Please Sign In"
                    description="Sign in to view your follow-up tasks and reminders"
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
        <div className="min-h-screen bg-gray-50 p-4 pb-24">
            <div className="max-w-2xl mx-auto">
                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Follow-ups</h1>
                    <p className="text-gray-600">Track action items from your conversations</p>
                </div>

                {/* Filter Tabs */}
                <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                    <button
                        onClick={() => setFilter('all')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${filter === 'all'
                                ? 'bg-blue-600 text-white'
                                : 'bg-white text-gray-700 hover:bg-gray-100'
                            }`}
                    >
                        All ({followups.length})
                    </button>
                    <button
                        onClick={() => setFilter('overdue')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${filter === 'overdue'
                                ? 'bg-red-600 text-white'
                                : 'bg-white text-gray-700 hover:bg-gray-100'
                            } ${overdueCount > 0 ? 'relative' : ''}`}
                    >
                        Overdue
                        {overdueCount > 0 && (
                            <span className="ml-2 px-2 py-0.5 bg-red-100 text-red-800 rounded-full text-xs font-bold">
                                {overdueCount}
                            </span>
                        )}
                    </button>
                    <button
                        onClick={() => setFilter('today')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${filter === 'today'
                                ? 'bg-blue-600 text-white'
                                : 'bg-white text-gray-700 hover:bg-gray-100'
                            }`}
                    >
                        Today
                    </button>
                    <button
                        onClick={() => setFilter('week')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${filter === 'week'
                                ? 'bg-blue-600 text-white'
                                : 'bg-white text-gray-700 hover:bg-gray-100'
                            }`}
                    >
                        This Week
                    </button>
                </div>

                {/* Follow-up List */}
                {isLoading ? (
                    <div className="text-center py-12 text-gray-500">Loading...</div>
                ) : filteredFollowUps.length > 0 ? (
                    <div className="space-y-3">
                        {filteredFollowUps.map((followup) => (
                            <div
                                key={followup.id}
                                className={`bg-white rounded-lg shadow-sm p-4 transition-all ${followup.completed ? 'opacity-60' : ''
                                    }`}
                            >
                                <div className="flex items-start gap-3">
                                    <button
                                        onClick={() => toggleComplete(followup.id, followup.completed)}
                                        className="flex-shrink-0 mt-1"
                                    >
                                        {followup.completed ? (
                                            <CheckCircle className="w-6 h-6 text-green-600" />
                                        ) : (
                                            <Circle className="w-6 h-6 text-gray-400 hover:text-blue-600" />
                                        )}
                                    </button>

                                    <div className="flex-1 min-w-0">
                                        <p
                                            className={`text-gray-900 mb-2 ${followup.completed ? 'line-through' : ''
                                                }`}
                                        >
                                            {followup.task}
                                        </p>

                                        <div className="flex flex-wrap items-center gap-3 text-sm">
                                            {followup.contact && (
                                                <button
                                                    onClick={() => navigate(`/contacts/${followup.contact_id}`)}
                                                    className="flex items-center gap-1 text-blue-600 hover:text-blue-700"
                                                >
                                                    <User className="w-4 h-4" />
                                                    <span>{followup.contact.display_name}</span>
                                                </button>
                                            )}

                                            <div
                                                className={`flex items-center gap-1 ${isOverdue(followup.due_date) && !followup.completed
                                                        ? 'text-red-600 font-semibold'
                                                        : 'text-gray-500'
                                                    }`}
                                            >
                                                <Calendar className="w-4 h-4" />
                                                <span>{formatDueDate(followup.due_date)}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <EmptyState
                        icon={<CheckCircle className="w-8 h-8" />}
                        title={
                            filter === 'all'
                                ? 'No follow-ups yet'
                                : filter === 'overdue'
                                    ? 'No overdue tasks'
                                    : filter === 'today'
                                        ? 'Nothing due today'
                                        : 'Nothing due this week'
                        }
                        description={
                            filter === 'all'
                                ? 'Follow-up tasks from your notes will appear here'
                                : 'Great job staying on top of things!'
                        }
                        action={
                            filter === 'all' ? (
                                <Button
                                    icon={<User className="w-5 h-5" />}
                                    onClick={() => navigate('/record')}
                                >
                                    Add a Note
                                </Button>
                            ) : undefined
                        }
                    />
                )}
            </div>
        </div>
    );
}
