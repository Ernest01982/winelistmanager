import { get, set, del, keys } from 'idb-keyval';
import { ProductPrice } from '../types/pricing';

interface QueuedImport {
  id: string;
  rows: ProductPrice[];
  filename: string;
  timestamp: number;
}

const QUEUE_PREFIX = 'pricing_import_';

export const queueImport = async (rows: ProductPrice[], filename: string): Promise<string> => {
  const id = `${QUEUE_PREFIX}${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const queuedImport: QueuedImport = {
    id,
    rows,
    filename,
    timestamp: Date.now()
  };
  
  await set(id, queuedImport);
  return id;
};

export const getQueuedImports = async (): Promise<QueuedImport[]> => {
  const allKeys = await keys();
  const queueKeys = allKeys.filter(key => 
    typeof key === 'string' && key.startsWith(QUEUE_PREFIX)
  );
  
  const imports = await Promise.all(
    queueKeys.map(async (key) => {
      const item = await get(key);
      return item as QueuedImport;
    })
  );
  
  return imports.filter(Boolean).sort((a, b) => a.timestamp - b.timestamp);
};

export const removeQueuedImport = async (id: string): Promise<void> => {
  await del(id);
};

export const clearQueue = async (): Promise<void> => {
  const allKeys = await keys();
  const queueKeys = allKeys.filter(key => 
    typeof key === 'string' && key.startsWith(QUEUE_PREFIX)
  );
  
  await Promise.all(queueKeys.map(key => del(key)));
};