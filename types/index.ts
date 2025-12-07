// file: types/index.ts
export type CleanSoldItem = {
    uuid?: string;
    title: string;
    price: string | number;
    thumbnail?: string;
    url?: string;
    soldDate?: string;
    condition?: string;
    seller?: string;
    };
    
    
export type FilterResult<T = any> = {
    valid: T[];
    rejected: { title: string; reason?: string }[];
    minPrice?: number | null;
  };
  