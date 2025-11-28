import { useRef, useState, useCallback } from 'react';


export function useProgress() {
const [progress, setProgress] = useState(0);
const ref = useRef<number | null>(null);


const start = useCallback(() => {
setProgress(2);
if (ref.current !== null) return;
ref.current = window.setInterval(() => {
setProgress((p) => (p < 95 ? +(p + 0.4).toFixed(2) : p));
}, 200);
}, []);


const set = useCallback((v: number) => setProgress(v), []);


const stop = useCallback(() => {
if (ref.current !== null) {
clearInterval(ref.current);
ref.current = null;
}
setProgress(100);
setTimeout(() => setProgress(0), 500);
}, []);


return { progress, start, stop, set } as const;
}