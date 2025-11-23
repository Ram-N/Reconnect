import { User, X } from 'lucide-react';

interface PersonChipProps {
    name: string;
    relation?: string;
    onRemove?: () => void;
    size?: 'sm' | 'md';
}

export function PersonChip({ name, relation, onRemove, size = 'md' }: PersonChipProps) {
    const sizeClasses = {
        sm: 'px-2 py-1 text-xs',
        md: 'px-3 py-1.5 text-sm',
    };

    return (
        <span className={`inline-flex items-center gap-1.5 bg-purple-50 text-purple-700 rounded-full ${sizeClasses[size]}`}>
            <User className={`${size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'}`} />
            <span className="font-medium">{name}</span>
            {relation && <span className="text-purple-500">({relation})</span>}
            {onRemove && (
                <button
                    onClick={onRemove}
                    className="ml-1 hover:bg-purple-100 rounded-full p-0.5 transition-colors"
                >
                    <X className={`${size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'}`} />
                </button>
            )}
        </span>
    );
}
