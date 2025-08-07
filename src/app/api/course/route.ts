import { NextRequest, NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { type Course } from '@/lib/data-provider';

export async function POST(request: NextRequest) {
  const course: Course = await request.json();

  if (!course || !course.id) {
    return NextResponse.json({ success: false, error: 'Invalid course data.' }, { status: 400 });
  }

  const filename = `${course.id}.json`;
  const path = join(process.cwd(), 'src/data/courses', filename);
  
  try {
    const jsonString = JSON.stringify(course, null, 2);
    await writeFile(path, jsonString);
    console.log(`Course saved to ${path}`);
    return NextResponse.json({ success: true, message: `Course '${course.title}' saved successfully.` });
  } catch (error) {
    console.error('Error saving course:', error);
    return NextResponse.json({ success: false, error: 'Failed to save course.' }, { status: 500 });
  }
}

