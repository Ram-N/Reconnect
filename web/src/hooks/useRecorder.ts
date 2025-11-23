import { useState, useRef, useCallback } from 'react';

export interface RecorderState {
    isRecording: boolean;
    audioBlob: Blob | null;
    duration: number;
}

export function useRecorder() {
    const [state, setState] = useState<RecorderState>({
        isRecording: false,
        audioBlob: null,
        duration: 0,
    });

    const mediaRecorder = useRef<MediaRecorder | null>(null);
    const chunks = useRef<BlobPart[]>([]);
    const timerRef = useRef<number | null>(null);
    const startTimeRef = useRef<number>(0);

    const startRecording = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorder.current = new MediaRecorder(stream);
            chunks.current = [];

            mediaRecorder.current.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    chunks.current.push(e.data);
                }
            };

            mediaRecorder.current.onstop = () => {
                const blob = new Blob(chunks.current, { type: 'audio/webm' });
                setState(prev => ({ ...prev, isRecording: false, audioBlob: blob }));
                if (timerRef.current) {
                    clearInterval(timerRef.current);
                    timerRef.current = null;
                }
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorder.current.start();
            startTimeRef.current = Date.now();

            timerRef.current = window.setInterval(() => {
                setState(prev => ({ ...prev, duration: (Date.now() - startTimeRef.current) / 1000 }));
            }, 100);

            setState({ isRecording: true, audioBlob: null, duration: 0 });
        } catch (err) {
            console.error('Failed to start recording:', err);
            throw err;
        }
    }, []);

    const stopRecording = useCallback(() => {
        if (mediaRecorder.current && mediaRecorder.current.state !== 'inactive') {
            mediaRecorder.current.stop();
        }
    }, []);

    const resetRecording = useCallback(() => {
        setState({ isRecording: false, audioBlob: null, duration: 0 });
        chunks.current = [];
    }, []);

    return {
        ...state,
        startRecording,
        stopRecording,
        resetRecording,
    };
}
