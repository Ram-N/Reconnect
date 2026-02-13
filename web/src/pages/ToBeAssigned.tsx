import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, getContacts } from '../lib/api';
import { getUnassignedContactId, SPECIAL_CONTACTS } from '../lib/specialContacts';
import { TopNav, Button, EmptyState } from '../components';
import { FileQuestion, UserPlus, Calendar, Tag } from 'lucide-react';

interface UnassignedNote {
    id: string;
    transcript: string;
    occurred_at: string;
    extracted: {
        people_mentioned?: Array<{ name: string; relation?: string }>;
        key_topics?: string[];
        hashtags?: string[];
    };
}

interface Contact {
    id: string;
    display_name: string;
}

export function ToBeAssignedPage() {
    const navigate = useNavigate();
    const [notes, setNotes] = useState<UnassignedNote[]>([]);
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [user, setUser] = useState<any>(null);
    const [assigningNoteId, setAssigningNoteId] = useState<string | null>(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);

            if (!user) return;

            // Get unassigned contact ID
            const unassignedId = await getUnassignedContactId();
            if (!unassignedId) {
                console.error('No unassigned contact found');
                return;
            }

            // Load all notes assigned to __Unassigned
            const { data: interactions, error } = await supabase
                .from('interactions')
                .select('id, transcript, occurred_at, extracted')
                .eq('contact_id', unassignedId)
                .order('occurred_at', { ascending: false });

            if (error) throw error;
            setNotes(interactions || []);

            // Load contacts for assignment dropdown
            const contactsData = await getContacts();
            // Filter out special contacts
            const regularContacts = contactsData?.filter(
                c => c.display_name !== SPECIAL_CONTACTS.SELF && c.display_name !== SPECIAL_CONTACTS.UNASSIGNED
            ) || [];
            setContacts(regularContacts);
        } catch (error) {
            console.error('Failed to load unassigned notes:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const assignToContact = async (noteId: string, contactId: string) => {
        setAssigningNoteId(noteId);
        try {
            const { error } = await supabase
                .from('interactions')
                .update({ contact_id: contactId })
                .eq('id', noteId);

            if (error) throw error;

            // Remove from list
            setNotes(notes.filter(n => n.id !== noteId));
        } catch (error) {
            console.error('Failed to assign note:', error);
            alert('Failed to assign note');
        } finally {
            setAssigningNoteId(null);
        }
    };

    const createContactFromPerson = async (noteId: string, personName: string) => {
        setAssigningNoteId(noteId);
        try {
            if (!user) return;

            // Create new contact
            const { data: newContact, error: createError } = await supabase
                .from('contacts')
                .insert({
                    owner_uid: user.id,
                    display_name: personName,
                    notes: 'Created from unassigned note',
                })
                .select()
                .single();

            if (createError) throw createError;

            // Assign note to new contact
            await assignToContact(noteId, newContact.id);

            // Refresh contacts list
            const contactsData = await getContacts();
            const regularContacts = contactsData?.filter(
                c => c.display_name !== SPECIAL_CONTACTS.SELF && c.display_name !== SPECIAL_CONTACTS.UNASSIGNED
            ) || [];
            setContacts(regularContacts);
        } catch (error) {
            console.error('Failed to create contact:', error);
            alert('Failed to create contact');
        } finally {
            setAssigningNoteId(null);
        }
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <TopNav user={user} showBack={true} title="To Be Assigned" />
            <div className="max-w-2xl mx-auto p-4 pb-24">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Notes To Be Assigned</h1>
                    <p className="text-gray-600 text-sm">
                        These notes haven't been assigned to a contact yet. Assign them now or create new contacts from mentioned people.
                    </p>
                </div>

                {notes.length === 0 ? (
                    <EmptyState
                        icon={<FileQuestion className="w-8 h-8" />}
                        title="No Unassigned Notes"
                        description="All your notes have been assigned to contacts. Great job staying organized!"
                        action={
                            <Button onClick={() => navigate('/record')}>
                                Record New Note
                            </Button>
                        }
                    />
                ) : (
                    <div className="space-y-4">
                        {notes.map((note) => (
                            <div key={note.id} className="bg-white rounded-lg shadow-sm p-4">
                                {/* Date and Hashtags */}
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2 text-sm text-gray-500">
                                        <Calendar className="w-4 h-4" />
                                        {formatDate(note.occurred_at)}
                                    </div>
                                    {note.extracted?.hashtags && note.extracted.hashtags.length > 0 && (
                                        <div className="flex gap-1">
                                            {note.extracted.hashtags.map((tag, idx) => (
                                                <span key={idx} className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-50 text-green-700 rounded text-xs">
                                                    <Tag className="w-3 h-3" />
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Transcript Preview */}
                                <p className="text-gray-700 text-sm mb-3 line-clamp-3">
                                    {note.transcript}
                                </p>

                                {/* Topics */}
                                {note.extracted?.key_topics && note.extracted.key_topics.length > 0 && (
                                    <div className="mb-3">
                                        <p className="text-xs text-gray-500 mb-1">Topics:</p>
                                        <div className="flex flex-wrap gap-1">
                                            {note.extracted.key_topics.map((topic, idx) => (
                                                <span key={idx} className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full text-xs">
                                                    {topic}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* People Mentioned - Quick Create */}
                                {note.extracted?.people_mentioned && note.extracted.people_mentioned.length > 0 && (
                                    <div className="mb-3">
                                        <p className="text-xs text-gray-500 mb-2">Create contact from:</p>
                                        <div className="flex flex-wrap gap-2">
                                            {note.extracted.people_mentioned.map((person, idx) => (
                                                <button
                                                    key={idx}
                                                    onClick={() => createContactFromPerson(note.id, person.name)}
                                                    disabled={assigningNoteId === note.id}
                                                    className="flex items-center gap-1 px-3 py-1.5 bg-purple-50 text-purple-700 hover:bg-purple-100 rounded-lg text-sm transition-colors disabled:opacity-50"
                                                >
                                                    <UserPlus className="w-3.5 h-3.5" />
                                                    {person.name} {person.relation && `(${person.relation})`}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Assign to Existing Contact */}
                                <div>
                                    <label className="text-xs text-gray-500 mb-1 block">Or assign to existing contact:</label>
                                    <select
                                        onChange={(e) => {
                                            if (e.target.value) {
                                                assignToContact(note.id, e.target.value);
                                            }
                                        }}
                                        disabled={assigningNoteId === note.id}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm disabled:opacity-50"
                                        defaultValue=""
                                    >
                                        <option value="">Select a contact...</option>
                                        {contacts.map((contact) => (
                                            <option key={contact.id} value={contact.id}>
                                                {contact.display_name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {assigningNoteId === note.id && (
                                    <div className="mt-3 text-sm text-gray-500 flex items-center gap-2">
                                        <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                                        Assigning...
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
