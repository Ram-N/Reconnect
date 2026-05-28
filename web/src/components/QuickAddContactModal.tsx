import { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from './Button';
import { createContact } from '../lib/api';

interface QuickAddContactModalProps {
    isOpen: boolean;
    initialName?: string;
    onClose: () => void;
    onSave: (contact: { id: string; display_name: string }) => void;
}

export function QuickAddContactModal({ isOpen, initialName = '', onClose, onSave }: QuickAddContactModalProps) {
    const [displayName, setDisplayName] = useState(initialName);
    const [primaryPhone, setPrimaryPhone] = useState('');
    const [primaryEmail, setPrimaryEmail] = useState('');
    const [cadenceDays, setCadenceDays] = useState('30');
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!displayName.trim()) {
            setError('Name is required');
            return;
        }

        setIsSaving(true);
        try {
            const newContact = await createContact({
                display_name: displayName.trim(),
                primary_phone: primaryPhone.trim() || undefined,
                primary_email: primaryEmail.trim() || undefined,
                cadence_days: cadenceDays ? parseInt(cadenceDays) : 30,
            });
            onSave({ id: newContact.id, display_name: newContact.display_name });
        } catch (err: any) {
            setError(err.message || 'Failed to create contact');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-sm w-full">
                <div className="flex items-center justify-between p-4 border-b">
                    <h2 className="text-lg font-bold text-gray-900">New Contact</h2>
                    <button
                        onClick={onClose}
                        disabled={isSaving}
                        className="p-1 text-gray-400 hover:text-gray-600 rounded"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-4 space-y-3">
                    {error && (
                        <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg">{error}</div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Name <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                            placeholder="Jane Smith"
                            autoFocus
                            disabled={isSaving}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Check-in every (days)
                        </label>
                        <input
                            type="number"
                            value={cadenceDays}
                            onChange={(e) => setCadenceDays(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                            min="1"
                            disabled={isSaving}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                        <input
                            type="tel"
                            value={primaryPhone}
                            onChange={(e) => setPrimaryPhone(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                            placeholder="+1 (555) 123-4567"
                            disabled={isSaving}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <input
                            type="email"
                            value={primaryEmail}
                            onChange={(e) => setPrimaryEmail(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                            placeholder="jane@example.com"
                            disabled={isSaving}
                        />
                    </div>

                    <div className="flex gap-3 pt-1">
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={onClose}
                            disabled={isSaving}
                            className="flex-1"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            variant="primary"
                            disabled={isSaving}
                            className="flex-1"
                        >
                            {isSaving ? 'Creating...' : 'Create & Select'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
