import { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from './Button';

interface AddContactModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (contact: {
        display_name: string;
        primary_phone?: string;
        primary_email?: string;
        cadence_days?: number;
        notes?: string;
    }) => Promise<void>;
}

export function AddContactModal({ isOpen, onClose, onSave }: AddContactModalProps) {
    const [displayName, setDisplayName] = useState('');
    const [primaryPhone, setPrimaryPhone] = useState('');
    const [primaryEmail, setPrimaryEmail] = useState('');
    const [cadenceDays, setCadenceDays] = useState('30');
    const [notes, setNotes] = useState('');
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
            await onSave({
                display_name: displayName.trim(),
                primary_phone: primaryPhone.trim() || undefined,
                primary_email: primaryEmail.trim() || undefined,
                cadence_days: cadenceDays ? parseInt(cadenceDays) : undefined,
                notes: notes.trim() || undefined,
            });

            // Reset form
            setDisplayName('');
            setPrimaryPhone('');
            setPrimaryEmail('');
            setCadenceDays('30');
            setNotes('');
            onClose();
        } catch (err: any) {
            setError(err.message || 'Failed to save contact');
        } finally {
            setIsSaving(false);
        }
    };

    const handleClose = () => {
        if (!isSaving) {
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white">
                    <h2 className="text-xl font-bold text-gray-900">Add New Contact</h2>
                    <button
                        onClick={handleClose}
                        disabled={isSaving}
                        className="p-1 text-gray-400 hover:text-gray-600 rounded transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-4 space-y-4">
                    {error && (
                        <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg">
                            {error}
                        </div>
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
                            placeholder="John Doe"
                            required
                            disabled={isSaving}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Phone
                        </label>
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
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Email
                        </label>
                        <input
                            type="email"
                            value={primaryEmail}
                            onChange={(e) => setPrimaryEmail(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                            placeholder="john@example.com"
                            disabled={isSaving}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Check-in Cadence (days)
                        </label>
                        <input
                            type="number"
                            value={cadenceDays}
                            onChange={(e) => setCadenceDays(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                            placeholder="30"
                            min="1"
                            disabled={isSaving}
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            How often do you want to reconnect? (e.g., 30 days)
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Notes
                        </label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
                            placeholder="Any additional notes about this contact..."
                            rows={3}
                            disabled={isSaving}
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-2">
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={handleClose}
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
                            {isSaving ? 'Saving...' : 'Add Contact'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
