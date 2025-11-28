'use client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import React from 'react';


type Props = {
value: string;
onChange: (v: string) => void;
onSearch: () => void;
loading?: boolean;
};


export default function SearchBar({ value, onChange, onSearch, loading }: Props) {
return (
<div className="flex w-full max-w-2xl gap-2">
<Input
placeholder="Nom de la carte ou item"
value={value}
onChange={(e: any) => onChange(e.target.value)}
onKeyDown={(e: React.KeyboardEvent) => e.key === 'Enter' && onSearch()}
/>
<Button onClick={onSearch} disabled={loading} aria-disabled={loading}>
{loading ? 'Chargement...' : 'Rechercher'}
</Button>
</div>
);
}