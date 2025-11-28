// file: components/ProgressBar.tsx
'use client';
import { Progress } from '@/components/ui/progress';


export default function ProgressBar({ value }: { value: number }) {
return <Progress value={value} className="w-full max-w-2xl h-3 rounded-lg mt-4" />;
}