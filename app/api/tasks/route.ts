import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tasks = await prisma.task.findMany({
    where: {
      userId: user.id,
    },
    orderBy: {
      dueDate: "asc",
    },
  });

  return NextResponse.json(tasks);
}

export async function POST(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { title, course, dueDate } = body;

  if (!title || !course || !dueDate) {
    return NextResponse.json(
      { error: "All fields are required" },
      { status: 400 }
    );
  }

  const newTask = await prisma.task.create({
    data: {
      title,
      course,
      dueDate: new Date(dueDate),
      userId: user.id,
    },
  });

  return NextResponse.json(newTask, { status: 201 });
}
