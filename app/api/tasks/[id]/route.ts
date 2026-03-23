import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type Params = {
  params: Promise<{
    id: string;
  }>;
};

export async function PATCH(request: Request, { params }: Params) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const { completed, title, course, dueDate } = body;

  const task = await prisma.task.findFirst({
    where: {
      id: Number(id),
      userId: user.id,
    },
  });

  if (!task) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  const updatedTask = await prisma.task.update({
    where: {
      id: Number(id),
    },
    data: {
      ...(completed !== undefined && { completed }),
      ...(title !== undefined && { title }),
      ...(course !== undefined && { course }),
      ...(dueDate !== undefined && { dueDate: new Date(dueDate) }),
    },
  });

  return NextResponse.json(updatedTask);
}

export async function DELETE(_request: Request, { params }: Params) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const task = await prisma.task.findFirst({
    where: {
      id: Number(id),
      userId: user.id,
    },
  });

  if (!task) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  await prisma.task.delete({
    where: {
      id: Number(id),
    },
  });

  return NextResponse.json({ message: "Task deleted" });
}
