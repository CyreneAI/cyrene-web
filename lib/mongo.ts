import { MongoClient, Db, Collection } from 'mongodb';

// Prefer server-side MONGO_URI (do NOT expose Atlas URI publicly). Fallback to NEXT_PUBLIC_MONGO_URI only if needed.
const uri = process.env.MONGO_URI || process.env.NEXT_PUBLIC_MONGO_URI || 'mongodb://localhost:27017/';
const client = new MongoClient(uri);

let clientPromise: Promise<MongoClient> | null = null;
let latestCollectionCache: { name: string; timestamp: number } | null = null;

export function invalidateTrendsCollectionCache() {
  latestCollectionCache = null;
}

export async function getMongoClient(): Promise<MongoClient> {
  if (!clientPromise) {
    clientPromise = client.connect();
  }
  return clientPromise;
}

/**
 * Gets all trends collection names that match the pattern
 */
export async function getTrendsCollectionNames(): Promise<string[]> {
  const c = await getMongoClient();
  const db: Db = c.db('trends');
  
  const collections = await db.listCollections().toArray();
  
  return collections
    .map(col => col.name)
    .filter(name => name.startsWith('daily_trends_') && /^daily_trends_\d{4}_\d{2}_\d{2}_\d{6}$/.test(name))
    .sort((a, b) => {
      // Sort by timestamp in collection name (newest first)
      const timestampA = a.replace('daily_trends_', '');
      const timestampB = b.replace('daily_trends_', '');
      return timestampB.localeCompare(timestampA);
    });
}

/**
 * Gets the latest trends collection based on timestamp in collection name
 * Collection names follow pattern: daily_trends_YYYY_MM_DD_HHMMSS
 * Caches the result for 5 minutes to avoid frequent DB calls
 */
export async function getTrendsCollection(forceRefresh = false): Promise<Collection> {
  const c = await getMongoClient();
  const db: Db = c.db('trends');
  
  // Check cache first (valid for 5 minutes)
  const now = Date.now();
  const cacheTimeout = 5 * 60 * 1000; // 5 minutes
  
  if (!forceRefresh && latestCollectionCache && (now - latestCollectionCache.timestamp) < cacheTimeout) {
    return db.collection(latestCollectionCache.name);
  }
  
  // Get all trends collection names
  const trendsCollections = await getTrendsCollectionNames();
  
  // Use the latest collection, or fallback to 'daily_trends' if none found
  const latestCollection = trendsCollections[0] || 'daily_trends';
  
  // Update cache
  latestCollectionCache = {
    name: latestCollection,
    timestamp: now
  };
  
  console.log(`[mongo] Using trends collection: ${latestCollection} (uri host: ${tryGetHost(uri)})`);
  return db.collection(latestCollection);
}

function tryGetHost(u: string) {
  try { return new URL(u).host; } catch { return 'unknown'; }
}
