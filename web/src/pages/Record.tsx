import React, { useState, useEffect } from 'react';
import { useRecorder } from '../hooks/useRecorder';
import { processAudio, saveInteraction, supabase } from '../lib/api';
import { Mic, Square, Upload, Loader2, Save, Edit2, Check, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function RecordPage() {
    const { isRecording, duration, startRecording, stopRecording, audioBlob, resetRecording } = useRecorder();
    const [isProcessing, setIsProcessing] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);
    const [user, setUser] = useState<any>(null);
    const [isSaving, setIsSaving] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        supabase.auth.getUser().then(({ data }) => {
            setUser(data.user);
        });
    }, []);

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
        if (!result) return;

        setIsSaving(true);
        try {
            await saveInteraction({
                owner_uid: user.id,
                contact_id: null, // Will link to contact later
                transcript: result.transcript,
                extracted: result.extracted,
                occurred_at: new Date().toISOString(),
                // In a real app, we'd upload the audio to storage first and get the path
                // audio_path: '...',
            });
            setResult(null);
            resetRecording();
            alert('Saved successfully!'); // Replace with better UI
        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Failed to save');
        } finally {
            setIsSaving(false);
        }
    };

    const formatDuration = (sec: number) => {
        const m = Math.floor(sec / 60);
        const s = Math.floor(sec % 60);
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    if (result) {
        return (
            <div className="p-4 max-w-md mx-auto">
                <h2 className="text-xl font-bold mb-4">Review</h2>
                <div className="bg-white p-4 rounded shadow mb-4">
                    <h3 className="font-semibold mb-2">Transcript</h3>
                    <p className="text-gray-700 text-sm">{result.transcript}</p>
                </div>
                <div className="bg-white p-4 rounded shadow mb-4">
                    <h3 className="font-semibold mb-2">Extracted Data</h3>
                    <pre className="text-xs overflow-auto bg-gray-50 p-2 rounded">
                        {JSON.stringify(result.extracted, null, 2)}
                    </pre>
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={() => { setResult(null); resetRecording(); }}
                        className="flex-1 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50"
                    >
                        Discard
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="flex-1 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center justify-center gap-2"
                    >
                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        Save
                    </button>
                </div>
                {!user && (
                    <p className="text-red-500 text-sm mt-2 text-center">Please log in to save.</p>
                )}
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
            <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8 text-center">
                <h1 className="text-2xl font-bold mb-8 text-gray-800">Reconnect</h1>

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
    );
}
