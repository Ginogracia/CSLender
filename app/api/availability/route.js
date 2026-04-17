import clientPromise from '@/lib/mongodb';
import { NextResponse } from 'next/server';

async function cleanOldEntriesIfNeeded(db) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().split('T')[0];

  const meta = await db.collection('meta').findOne({ _id: 'lastCleanup' });
  if (meta?.date === todayStr) return; // already ran today, skip

  await db.collection('availability').deleteMany({ date: { $lt: todayStr } });
  await db.collection('meta').updateOne(
    { _id: 'lastCleanup' },
    { $set: { date: todayStr } },
    { upsert: true }
  );
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const user = searchParams.get('user');
  const client = await clientPromise;
  const db = client.db('calendar');
  await cleanOldEntriesIfNeeded(db);
  const data = await db.collection('availability').find({ user }).toArray();
  return NextResponse.json(data);
}

export async function POST(request) {
  const body = await request.json();
  const { user, date, status } = body;
  const client = await clientPromise;
  const db = client.db('calendar');
  await cleanOldEntriesIfNeeded(db);
  if (!status) {
    await db.collection('availability').deleteOne({ user, date });
  } else {
    await db.collection('availability').updateOne(
      { user, date },
      { $set: { status } },
      { upsert: true }
    );
  }
  return NextResponse.json({ success: true });
}