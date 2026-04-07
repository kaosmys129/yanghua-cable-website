import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json(
    {
      message: 'Preview mode is disabled in the Tina file-based content workflow.',
    },
    { status: 410 }
  );
}

export async function DELETE() {
  return NextResponse.json({
    message: 'Preview mode is not enabled for the file-based content workflow.',
  });
}
