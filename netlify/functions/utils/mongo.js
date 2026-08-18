import { MongoClient } from 'mongodb';

const DEFAULT_URI = 'mongodb+srv://phucle03:A01112003a*@cluster0.nrw7til.mongodb.net/storage_image_db?retryWrites=true&w=majority&appName=Cluster0';
const uri = process.env.MONGODB_URI || DEFAULT_URI;

let cachedClient = null;
let cachedDb = null;

export async function connectToDatabase() {
  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb };
  }

  const client = new MongoClient(uri, {
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 8000,
  });

  await client.connect();
  const db = client.db('storage_image_db');

  cachedClient = client;
  cachedDb = db;

  return { client, db };
}

export const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Content-Type': 'application/json',
};
