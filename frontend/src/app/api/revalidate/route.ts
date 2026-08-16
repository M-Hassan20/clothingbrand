import { revalidateTag } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { secret, tags } = await req.json();

    if (secret !== process.env.REVALIDATE_SECRET) {
      return NextResponse.json({ error: 'Invalid secret' }, { status: 401 });
    }

    if (!Array.isArray(tags) || tags.length === 0) {
      return NextResponse.json({ error: 'tags array is required' }, { status: 400 });
    }

    tags.forEach((tag: string) => {
      revalidateTag(tag);
      console.log(`[Revalidation] Tag cleared: ${tag}`);
    });

    return NextResponse.json({ revalidated: true, tags });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
