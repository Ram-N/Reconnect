import { Link } from 'react-router-dom';
import { User, Calendar, Phone } from 'lucide-react';

interface ContactCardProps {
    id: string;
    name: string;
    lastContact?: string;
    nextCheckin?: string;
    phone?: string;
    noteCount?: number;
    variant?: 'list' | 'compact';
    onClick?: () => void;
}

export function ContactCard({
    id,
    name,
    lastContact,
    nextCheckin,
    phone,
    noteCount,
    variant = 'list',
    onClick,
}: ContactCardProps) {
    const formatDate = (dateStr: string | undefined) => {
        if (!dateStr) return 'Never';
        const date = new Date(dateStr);
        const now = new Date();
        const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays} days ago`;
        if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
        return date.toLocaleDateString();
    };

    const content = (
        <div className={`bg-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 cursor-pointer hover:-translate-y-0.5 active:translate-y-0 border border-gray-100 ${variant === 'list' ? 'p-4' : 'p-3'}`}>
            <div className="flex items-start gap-4">
                {/* Note Count - Leftmost */}
                <div className="flex-shrink-0 flex flex-col items-center justify-center min-w-[40px]">
                    <div className="text-2xl font-bold text-blue-600">
                        {noteCount ?? 0}
                    </div>
                    <div className="text-xs text-gray-500">
                        {noteCount === 1 ? 'note' : 'notes'}
                    </div>
                </div>

                {/* Avatar */}
                <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <User className="w-6 h-6 text-blue-600" />
                </div>

                {/* Contact Info */}
                <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">{name}</h3>
                    {phone && variant === 'list' && (
                        <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
                            <Phone className="w-3 h-3" />
                            <span>{phone}</span>
                        </div>
                    )}
                    {lastContact && (
                        <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
                            <Calendar className="w-3 h-3" />
                            <span>Last: {formatDate(lastContact)}</span>
                        </div>
                    )}
                    {nextCheckin && (
                        <div className="flex items-center gap-1 text-xs text-orange-600 mt-1">
                            <Calendar className="w-3 h-3" />
                            <span>Due: {formatDate(nextCheckin)}</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );

    if (onClick) {
        return (
            <button onClick={onClick} className="w-full text-left">
                {content}
            </button>
        );
    }

    return (
        <Link to={`/contacts/${id}`}>
            {content}
        </Link>
    );
}
