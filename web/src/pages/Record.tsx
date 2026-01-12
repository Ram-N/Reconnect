import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useRecorder } from '../hooks/useRecorder';
import { processAudio, saveInteraction, supabase, getContacts } from '../lib/api';
import { Mic, Square, Upload, Loader2, X, Plus, ArrowLeft } from 'lucide-react';
import { Button, PersonChip, Toast, TopNav } from '../components';

interface Contact {
    id: string;
    display_name: string;
}

interface EditableData {
    transcript: string;
    selectedContactIds: string[];
    people: Array<{ name: string; relation: string }>;
    topics: string[];
    facts: Array<{ category: string; description: string }>;
    followups: Array<{ task: string; due_date: string }>;
}

export function RecordPage() {
    const { contactId } = useParams<{ contactId?: string }>();
    const navigate = useNavigate();
    const { isRecording, duration, startRecording, stopRecording, audioBlob, resetRecording } = useRecorder();
    const [isProcessing, setIsProcessing] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [editableData, setEditableData] = useState<EditableData | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [user, setUser] = useState<any>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [showContactSearch, setShowContactSearch] = useState(false);
    const [contactSearch, setContactSearch] = useState('');
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

    useEffect(() => {
        loadUserAndContacts();
    }, []);

    useEffect(() => {
        if (contactId && contacts.length > 0) {
            // Pre-select contact if contactId is in route params
            setEditableData(prev => prev ? {
                ...prev,
                selectedContactIds: [contactId]
            } : null);
        }
    }, [contactId, contacts]);

    const loadUserAndContacts = async () => {
        const { data } = await supabase.auth.getUser();
        setUser(data.user);

        if (data.user) {
            try {
                const contactsData = await getContacts();
                setContacts(contactsData || []);
            } catch (err) {
                console.error('Failed to load contacts:', err);
            }
        }
    };

    const handleStop = async () => {
        stopRecording();
    };

    const handleProcess = async () => {
        if (!audioBlob) return;

        setIsProcessing(true);
        setError(null);

        try {
            const data = await processAudio(audioBlob);
            setResult(data);

            // Initialize editable data from AI result
            setEditableData({
                transcript: data.transcript || '',
                selectedContactIds: contactId ? [contactId] : [],
                people: data.extracted?.people_mentioned || [],
                topics: data.extracted?.key_topics || [],
                facts: data.extracted?.facts || [],
                followups: data.extracted?.followups || [],
            });
        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Failed to process audio');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleSave = async () => {
        if (!user) {
            setError('You must be logged in to save.');
            return;
        }
        if (!editableData || editableData.selectedContactIds.length === 0) {
            setError('Please select at least one contact.');
            return;
        }

        setIsSaving(true);
        try {
            // Save interaction for each selected contact
            for (const contactId of editableData.selectedContactIds) {
                await saveInteraction({
                    owner_uid: user.id,
                    contact_id: contactId,
                    transcript: editableData.transcript,
                    extracted: {
                        people_mentioned: editableData.people,
                        key_topics: editableData.topics,
                        facts: editableData.facts,
                        followups: editableData.followups,
                    },
                    occurred_at: new Date().toISOString(),
                });
            }

            setToast({ message: 'Note saved successfully!', type: 'success' });

            // Reset and navigate
            setTimeout(() => {
                setResult(null);
                setEditableData(null);
                resetRecording();
                navigate('/');
            }, 1500);
        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Failed to save');
            setToast({ message: 'Failed to save note', type: 'error' });
        } finally {
            setIsSaving(false);
        }
    };

    const addPerson = () => {
        if (!editableData) return;
        setEditableData({
            ...editableData,
            people: [...editableData.people, { name: '', relation: '' }]
        });
    };

    const updatePerson = (index: number, field: 'name' | 'relation', value: string) => {
        if (!editableData) return;
        const updated = [...editableData.people];
        updated[index] = { ...updated[index], [field]: value };
        setEditableData({ ...editableData, people: updated });
    };

    const removePerson = (index: number) => {
        if (!editableData) return;
        setEditableData({
            ...editableData,
            people: editableData.people.filter((_, i) => i !== index)
        });
    };

    const addTopic = () => {
        const topic = prompt('Enter topic:');
        if (topic && editableData) {
            setEditableData({
                ...editableData,
                topics: [...editableData.topics, topic]
            });
        }
    };

    const removeTopic = (index: number) => {
        if (!editableData) return;
        setEditableData({
            ...editableData,
            topics: editableData.topics.filter((_, i) => i !== index)
        });
    };

    const toggleContact = (id: string) => {
        if (!editableData) return;
        const isSelected = editableData.selectedContactIds.includes(id);
        setEditableData({
            ...editableData,
            selectedContactIds: isSelected
                ? editableData.selectedContactIds.filter(cid => cid !== id)
                : [...editableData.selectedContactIds, id]
        });
    };

    const formatDuration = (sec: number) => {
        const m = Math.floor(sec / 60);
        const s = Math.floor(sec % 60);
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    const filteredContacts = contacts.filter(c =>
        c.display_name.toLowerCase().includes(contactSearch.toLowerCase())
    );

    // Review/Edit Screen
    if (editableData) {
        return (
            <div className="min-h-screen bg-gray-50">
                <TopNav user={user} showBack={true} title="Review Note" />
                <div className="max-w-2xl mx-auto p-4 pb-24">

                    {/* Contact Selection */}
                    <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
                        <h3 className="font-semibold mb-3">Select Contact(s) *</h3>
                        <div className="space-y-2">
                            {editableData.selectedContactIds.map(id => {
                                const contact = contacts.find(c => c.id === id);
                                return contact ? (
                                    <div key={id} className="flex items-center justify-between bg-blue-50 p-2 rounded">
                                        <span className="text-sm font-medium">{contact.display_name}</span>
                                        <button
                                            onClick={() => toggleContact(id)}
                                            className="text-blue-600 hover:text-blue-800"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                ) : null;
                            })}
                        </div>
                        <Button
                            variant="secondary"
                            size="sm"
                            className="mt-3 w-full"
                            onClick={() => setShowContactSearch(!showContactSearch)}
                        >
                            {showContactSearch ? 'Hide' : 'Add'} Contact
                        </Button>
                        {showContactSearch && (
                            <div className="mt-3">
                                <input
                                    type="text"
                                    placeholder="Search contacts..."
                                    value={contactSearch}
                                    onChange={(e) => setContactSearch(e.target.value)}
                                    className="w-full px-3 py-2 border rounded-lg mb-2"
                                />
                                <div className="max-h-40 overflow-y-auto space-y-1">
                                    {filteredContacts.map(contact => (
                                        <button
                                            key={contact.id}
                                            onClick={() => {
                                                toggleContact(contact.id);
                                                setShowContactSearch(false);
                                                setContactSearch('');
                                            }}
                                            disabled={editableData.selectedContactIds.includes(contact.id)}
                                            className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded text-sm disabled:opacity-50"
                                        >
                                            {contact.display_name}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Transcript */}
                    <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
                        <h3 className="font-semibold mb-3">Transcript</h3>
                        <textarea
                            value={editableData.transcript}
                            onChange={(e) => setEditableData({ ...editableData, transcript: e.target.value })}
                            className="w-full h-32 px-3 py-2 border rounded-lg resize-none"
                            placeholder="Transcript of the conversation..."
                        />
                    </div>

                    {/* People Mentioned */}
                    <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="font-semibold">People Mentioned</h3>
                            <button onClick={addPerson} className="text-blue-600 hover:text-blue-700">
                                <Plus className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="space-y-2">
                            {editableData.people.map((person, idx) => (
                                <div key={idx} className="flex gap-2">
                                    <input
                                        type="text"
                                        placeholder="Name"
                                        value={person.name}
                                        onChange={(e) => updatePerson(idx, 'name', e.target.value)}
                                        className="flex-1 px-3 py-2 border rounded-lg text-sm"
                                    />
                                    <input
                                        type="text"
                                        placeholder="Relation"
                                        value={person.relation}
                                        onChange={(e) => updatePerson(idx, 'relation', e.target.value)}
                                        className="flex-1 px-3 py-2 border rounded-lg text-sm"
                                    />
                                    <button
                                        onClick={() => removePerson(idx)}
                                        className="p-2 text-red-600 hover:bg-red-50 rounded"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                            {editableData.people.length === 0 && (
                                <p className="text-sm text-gray-500 italic">No people mentioned</p>
                            )}
                        </div>
                    </div>

                    {/* Topics */}
                    <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="font-semibold">Key Topics</h3>
                            <button onClick={addTopic} className="text-blue-600 hover:text-blue-700">
                                <Plus className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {editableData.topics.map((topic, idx) => (
                                <span
                                    key={idx}
                                    className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm"
                                >
                                    {topic}
                                    <button onClick={() => removeTopic(idx)} className="hover:bg-blue-100 rounded-full p-0.5">
                                        <X className="w-3 h-3" />
                                    </button>
                                </span>
                            ))}
                            {editableData.topics.length === 0 && (
                                <p className="text-sm text-gray-500 italic">No topics tagged</p>
                            )}
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3 sticky bottom-20 bg-gray-50 py-4">
                        <Button
                            variant="secondary"
                            onClick={() => { setResult(null); setEditableData(null); resetRecording(); }}
                            className="flex-1"
                        >
                            Discard
                        </Button>
                        <Button
                            onClick={handleSave}
                            isLoading={isSaving}
                            disabled={editableData.selectedContactIds.length === 0}
                            className="flex-1"
                        >
                            Save Note
                        </Button>
                    </div>

                    {error && (
                        <div className="mt-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg">
                            {error}
                        </div>
                    )}
                </div>

                {toast && (
                    <Toast
                        message={toast.message}
                        type={toast.type}
                        onClose={() => setToast(null)}
                    />
                )}
            </div>
        );
    }

    // Recording Screen
    return (
        <div className="min-h-screen bg-gray-50">
            <TopNav user={user} title="Record" />
            <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] p-4 pb-24">
                <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8 text-center">

                <div className="mb-8">
                    <div className="text-6xl font-mono text-gray-700 mb-4">
                        {formatDuration(duration)}
                    </div>
                    {isRecording && (
                        <div className="flex items-center justify-center gap-2 text-red-500 animate-pulse">
                            <div className="w-3 h-3 bg-red-500 rounded-full" />
                            <span className="text-sm font-medium">Recording</span>
                        </div>
                    )}
                </div>

                <div className="flex flex-col gap-4">
                    {!isRecording && !audioBlob && (
                        <button
                            onClick={startRecording}
                            className="w-full py-4 bg-red-500 text-white rounded-full text-lg font-semibold hover:bg-red-600 transition-colors flex items-center justify-center gap-2"
                        >
                            <Mic className="w-6 h-6" />
                            Start Recording
                        </button>
                    )}

                    {isRecording && (
                        <button
                            onClick={handleStop}
                            className="w-full py-4 bg-gray-800 text-white rounded-full text-lg font-semibold hover:bg-gray-900 transition-colors flex items-center justify-center gap-2"
                        >
                            <Square className="w-6 h-6" />
                            Stop Recording
                        </button>
                    )}

                    {audioBlob && !isProcessing && (
                        <div className="space-y-3">
                            <audio src={URL.createObjectURL(audioBlob)} controls className="w-full" />
                            <button
                                onClick={handleProcess}
                                className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                            >
                                <Upload className="w-5 h-5" />
                                Process Recording
                            </button>
                            <button
                                onClick={resetRecording}
                                className="w-full py-3 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                Discard
                            </button>
                        </div>
                    )}

                    {isProcessing && (
                        <div className="w-full py-4 bg-gray-100 text-gray-500 rounded-lg flex items-center justify-center gap-2">
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Processing...
                        </div>
                    )}
                </div>

                {error && (
                    <div className="mt-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg">
                        {error}
                    </div>
                )}
                </div>
            </div>
        </div>
    );
}
