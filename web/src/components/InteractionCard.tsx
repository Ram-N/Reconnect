import { useState } from 'react';
import { Calendar, ChevronDown, ChevronUp, MessageSquare } from 'lucide-react';

interface InteractionCardProps {
    date: string;
    summary?: string;
    transcript: string;
    topics?: string[];
    expanded?: boolean;
}

export function InteractionCard({
    date,
    summary,
    transcript,
    topics = [],
    expanded = false,
}: InteractionCardProps) {
    const [isExpanded, setIsExpanded] = useState(expanded);

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full p-4 text-left hover:bg-gray-50 transition-colors"
            >
                <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                            <Calendar className="w-4 h-4" />
                            <span>{formatDate(date)}</span>
                        </div>
                        {summary && (
                            <p className="text-gray-900 font-medium mb-2">{summary}</p>
                        )}
                        {topics.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                                {topics.map((topic, idx) => (
                                    <span
                                        key={idx}
                                        className="inline-flex items-center px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-full"
                                    >
                                        {topic}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>
                    <div className="flex-shrink-0">
                        {isExpanded ? (
                            <ChevronUp className="w-5 h-5 text-gray-400" />
                        ) : (
                            <ChevronDown className="w-5 h-5 text-gray-400" />
                        )}
                    </div>
                </div>
            </button>

            {isExpanded && (
                <div className="border-t border-gray-200 p-4 bg-gray-50">
                    <div className="flex items-start gap-2 mb-2">
                        <MessageSquare className="w-4 h-4 text-gray-400 mt-1" />
                        <h4 className="text-sm font-semibold text-gray-700">Transcript</h4>
                    </div>
                    <p className="text-sm text-gray-600 leading-relaxed">{transcript}</p>
                </div>
            )}
        </div>
    );
}
