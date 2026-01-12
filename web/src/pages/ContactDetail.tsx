import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Phone, Mail, Edit, Mic, Calendar, User as UserIcon } from 'lucide-react';
import { Button, InteractionCard, PersonChip, EmptyState, TopNav } from '../components';
import { supabase } from '../lib/api';

interface Contact {
    id: string;
    display_name: string;
    primary_phone?: string;
    primary_email?: string;
    cadence_days?: number;
    next_checkin_date?: string;
    notes?: string;
}

interface Person {
    id: string;
    name: string;
    relation?: string;
    org_school?: string;
}

interface Interaction {
    id: string;
    occurred_at: string;
    summary?: string;
    transcript: string;
    extracted?: {
        key_topics?: string[];
    };
}

export function ContactDetailPage() {
    const { contactId } = useParams<{ contactId: string }>();
    const navigate = useNavigate();
    const [contact, setContact] = useState<Contact | null>(null);
    const [people, setPeople] = useState<Person[]>([]);
    const [interactions, setInteractions] = useState<Interaction[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        if (contactId) {
            loadContactData();
        }
    }, [contactId]);

    const loadContactData = async () => {
        setIsLoading(true);
        try {
            // Load user
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);

            // Load contact details
            const { data: contactData, error: contactError } = await supabase
                .from('contacts')
                .select('*')
                .eq('id', contactId)
                .single();

            if (contactError) throw contactError;
            setContact(contactData);

            // Load related people
            const { data: peopleData, error: peopleError } = await supabase
                .from('people')
                .select('*')
                .eq('contact_id', contactId);

            if (!peopleError && peopleData) {
                setPeople(peopleData);
            }

            // Load interactions
            const { data: interactionsData, error: intError } = await supabase
                .from('interactions')
                .select('id, occurred_at, summary, transcript, extracted')
                .eq('contact_id', contactId)
                .order('occurred_at', { ascending: false });

            if (!intError && interactionsData) {
                setInteractions(interactionsData);
            }
        } catch (error) {
            console.error('Failed to load contact:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const formatNextCheckin = (dateStr?: string) => {
        if (!dateStr) return 'Not set';
        const date = new Date(dateStr);
        const now = new Date();
        const diffDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

        if (diffDays < 0) return `${Math.abs(diffDays)} days overdue`;
        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return 'Tomorrow';
        if (diffDays < 7) return `In ${diffDays} days`;
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-gray-500">Loading...</div>
            </div>
        );
    }

    if (!contact) {
        return (
            <div className="min-h-screen bg-gray-50 p-4">
                <EmptyState
                    icon={<UserIcon className="w-8 h-8" />}
                    title="Contact Not Found"
                    description="The contact you're looking for doesn't exist or has been deleted."
                    action={
                        <Button onClick={() => navigate('/contacts')}>
                            Back to Contacts
                        </Button>
                    }
                />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-24">
            <TopNav user={user} showBack={true} title={contact.display_name} />

            {/* Contact Details */}
            <div className="max-w-2xl mx-auto px-4 py-6">
                <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                    <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4 flex-1">
                            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                                <UserIcon className="w-6 h-6 text-blue-600" />
                            </div>
                            <div className="flex-1">
                                <div className="space-y-2">
                                    {contact.primary_phone && (
                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                            <Phone className="w-4 h-4" />
                                            <a href={`tel:${contact.primary_phone}`} className="hover:text-blue-600">
                                                {contact.primary_phone}
                                            </a>
                                        </div>
                                    )}
                                    {contact.primary_email && (
                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                            <Mail className="w-4 h-4" />
                                            <a href={`mailto:${contact.primary_email}`} className="hover:text-blue-600">
                                                {contact.primary_email}
                                            </a>
                                        </div>
                                    )}
                                    {contact.next_checkin_date && (
                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                            <Calendar className="w-4 h-4" />
                                            <span>Next check-in: {formatNextCheckin(contact.next_checkin_date)}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                        <Button
                            variant="secondary"
                            size="sm"
                            icon={<Edit className="w-4 h-4" />}
                            onClick={() => {/* TODO: Edit contact */}}
                        >
                            Edit
                        </Button>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3 mt-4">
                        <Button
                            icon={<Mic className="w-5 h-5" />}
                            onClick={() => navigate(`/record/${contactId}`)}
                            className="flex-1"
                        >
                            Add Note
                        </Button>
                        {contact.primary_phone && (
                            <Button
                                variant="secondary"
                                icon={<Phone className="w-5 h-5" />}
                                onClick={() => window.location.href = `tel:${contact.primary_phone}`}
                            >
                                Call
                            </Button>
                        )}
                    </div>
                </div>
            </div>

            <div className="max-w-2xl mx-auto px-4 py-6">
                {/* Related People */}
                {people.length > 0 && (
                    <div className="mb-6">
                        <h2 className="text-sm font-semibold text-gray-700 mb-3">Related People</h2>
                        <div className="flex flex-wrap gap-2">
                            {people.map((person) => (
                                <PersonChip
                                    key={person.id}
                                    name={person.name}
                                    relation={person.relation}
                                />
                            ))}
                        </div>
                    </div>
                )}

                {/* Notes Section */}
                {contact.notes && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                        <h3 className="text-sm font-semibold text-yellow-900 mb-2">Notes</h3>
                        <p className="text-sm text-yellow-800">{contact.notes}</p>
                    </div>
                )}

                {/* Timeline */}
                <div>
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Conversation History</h2>
                    {interactions.length > 0 ? (
                        <div className="space-y-3">
                            {interactions.map((interaction) => (
                                <InteractionCard
                                    key={interaction.id}
                                    date={interaction.occurred_at}
                                    summary={interaction.summary}
                                    transcript={interaction.transcript}
                                    topics={interaction.extracted?.key_topics}
                                />
                            ))}
                        </div>
                    ) : (
                        <EmptyState
                            icon={<Mic className="w-8 h-8" />}
                            title="No notes yet"
                            description="Record your first conversation with this contact to start building history."
                            action={
                                <Button
                                    icon={<Mic className="w-5 h-5" />}
                                    onClick={() => navigate(`/record/${contactId}`)}
                                >
                                    Add First Note
                                </Button>
                            }
                        />
                    )}
                </div>
            </div>
        </div>
    );
}
