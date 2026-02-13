import { useState, useRef, useCallback } from 'react';

export type RecordingStatus = 'idle' | 'recording' | 'paused' | 'stopped';

export interface RecorderState {
    status: RecordingStatus;
    audioBlob: Blob | null;
    duration: number;
}

export function useRecorder() {
    const [state, setState] = useState<RecorderState>({
        status: 'idle',
        audioBlob: null,
        duration: 0,
    });

    const mediaRecorder = useRef<MediaRecorder | null>(null);
    const chunks = useRef<BlobPart[]>([]);
    const timerRef = useRef<number | null>(null);
    const startTimeRef = useRef<number>(0);
    const pausedDurationRef = useRef<number>(0);
    const pauseTimeRef = useRef<number>(0);

    const startRecording = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorder.current = new MediaRecorder(stream);
            chunks.current = [];
            pausedDurationRef.current = 0;

            mediaRecorder.current.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    chunks.current.push(e.data);
                }
            };

            mediaRecorder.current.onstop = () => {
                const blob = new Blob(chunks.current, { type: 'audio/webm' });
                setState(prev => ({ ...prev, status: 'stopped', audioBlob: blob }));
                if (timerRef.current) {
                    clearInterval(timerRef.current);
                    timerRef.current = null;
                }
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorder.current.start();
            startTimeRef.current = Date.now();

            timerRef.current = window.setInterval(() => {
                const elapsed = (Date.now() - startTimeRef.current - pausedDurationRef.current) / 1000;
                setState(prev => ({ ...prev, duration: elapsed }));
            }, 100);

            setState({ status: 'recording', audioBlob: null, duration: 0 });
        } catch (err) {
            console.error('Failed to start recording:', err);
            throw err;
        }
    }, []);

    const pauseRecording = useCallback(() => {
        if (mediaRecorder.current && mediaRecorder.current.state === 'recording') {
            mediaRecorder.current.pause();
            pauseTimeRef.current = Date.now();
            setState(prev => ({ ...prev, status: 'paused' }));
        }
    }, []);

    const resumeRecording = useCallback(() => {
        if (mediaRecorder.current && mediaRecorder.current.state === 'paused') {
            pausedDurationRef.current += Date.now() - pauseTimeRef.current;
            mediaRecorder.current.resume();
            setState(prev => ({ ...prev, status: 'recording' }));
        }
    }, []);

    const stopRecording = useCallback(() => {
        if (mediaRecorder.current && mediaRecorder.current.state !== 'inactive') {
            mediaRecorder.current.stop();
        }
    }, []);

    const resetRecording = useCallback(() => {
        setState({ status: 'idle', audioBlob: null, duration: 0 });
        chunks.current = [];
        pausedDurationRef.current = 0;
    }, []);

    return {
        ...state,
        isRecording: state.status === 'recording',
        isPaused: state.status === 'paused',
        startRecording,
        pauseRecording,
        resumeRecording,
        stopRecording,
        resetRecording,
    };
}
