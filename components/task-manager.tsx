"use client";

import type { Dispatch, SetStateAction } from "react";
import { useEffect, useState } from "react";
import { SignOutButton } from "@/components/sign-out-button";

type Task = {
  id: number;
  title: string;
  course: string;
  dueDate: string;
  completed: boolean;
  createdAt?: string;
};

type TaskManagerProps = {
  user: {
    id: string;
    email?: string | null;
    name?: string | null;
  };
};

type ApiError = {
  error?: string;
};

export function TaskManager({ user }: TaskManagerProps) {
  const [filter, setFilter] = useState<"all" | "pending" | "completed">("all");
  const [title, setTitle] = useState("");
  const [course, setCourse] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingTasks, setIsLoadingTasks] = useState(true);
  const [busyTaskId, setBusyTaskId] = useState<number | null>(null);
  const isEditing = editingTaskId !== null;
  const isFormValid =
    title.trim() !== "" && course.trim() !== "" && dueDate !== "";

  useEffect(() => {
    async function init() {
      setMounted(true);

      try {
        const data = await requestJson<Task[]>("/api/tasks");
        setTasks(data);
      } catch (requestError) {
        handleClientError(requestError, setError);
      } finally {
        setIsLoaded(true);
        setIsLoadingTasks(false);
      }
    }

    init();
  }, []);

  function isOverdue(date: string) {
    if (!isLoaded) return false;

    const today = new Date().toISOString().split("T")[0];
    const taskDate = date.split("T")[0];
    return taskDate < today;
  }

  const filteredTasks = tasks.filter((task) => {
    if (filter === "pending") return !task.completed;
    if (filter === "completed") return task.completed;
    return true;
  });

  const sortedTasks = [...filteredTasks].sort((a, b) => {
    if (a.completed !== b.completed) {
      return a.completed ? 1 : -1;
    }

    return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
  });

  function startEditing(task: Task) {
    setEditingTaskId(task.id);
    setTitle(task.title);
    setCourse(task.course);
    setDueDate(task.dueDate.split("T")[0]);
    setError("");
    setSuccessMessage("");
  }

  function cancelEditing(clearFeedback = true) {
    setEditingTaskId(null);
    setTitle("");
    setCourse("");
    setDueDate("");

    if (clearFeedback) {
      setError("");
      setSuccessMessage("");
    }
  }

  async function saveTask() {
    const trimmedTitle = title.trim();
    const trimmedCourse = course.trim();
    let previousTask: Task | undefined;
    let temporaryTaskId: number | null = null;

    if (title.trim() === "" || course.trim() === "" || dueDate === "") {
      setError("Please fill in the task title, course, and due date.");
      return;
    }

    setIsSaving(true);
    setError("");
    setSuccessMessage("");

    try {
      if (isEditing) {
        previousTask = tasks.find((task) => task.id === editingTaskId);

        if (!previousTask) {
          setError("Task not found.");
          return;
        }

        const optimisticTask: Task = {
          ...previousTask,
          title: trimmedTitle,
          course: trimmedCourse,
          dueDate: new Date(dueDate).toISOString(),
        };

        setTasks((prevTasks) =>
          prevTasks.map((task) => (task.id === editingTaskId ? optimisticTask : task))
        );

        const updatedTask = await requestJson<Task>(`/api/tasks/${editingTaskId}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title: trimmedTitle,
            course: trimmedCourse,
            dueDate,
          }),
        });

        setTasks((prevTasks) =>
          prevTasks.map((task) => (task.id === editingTaskId ? updatedTask : task))
        );

        cancelEditing(false);
        setSuccessMessage("Task updated successfully.");
        return;
      }

      temporaryTaskId = -Date.now();
      const optimisticTask: Task = {
        id: temporaryTaskId,
        title: trimmedTitle,
        course: trimmedCourse,
        dueDate: new Date(dueDate).toISOString(),
        completed: false,
        createdAt: new Date().toISOString(),
      };

      setTasks((prevTasks) => [...prevTasks, optimisticTask]);
      setTitle("");
      setCourse("");
      setDueDate("");

      const newTask = await requestJson<Task>("/api/tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: trimmedTitle,
          course: trimmedCourse,
          dueDate,
        }),
      });

      setTasks((prevTasks) =>
        prevTasks.map((task) => (task.id === temporaryTaskId ? newTask : task))
      );
      setSuccessMessage("Task added successfully.");
    } catch (requestError) {
      if (isEditing) {
        if (previousTask) {
          const rollbackTask = previousTask;

          setTasks((prevTasks) =>
            prevTasks.map((task) => (task.id === editingTaskId ? rollbackTask : task))
          );
        }
      } else {
        setTasks((prevTasks) =>
          prevTasks.filter((task) => task.id !== temporaryTaskId)
        );
        setTitle(trimmedTitle);
        setCourse(trimmedCourse);
        setDueDate(dueDate);
      }

      handleClientError(requestError, setError);
    } finally {
      setIsSaving(false);
    }
  }

  async function deleteTask(id: number) {
    const taskToDelete = tasks.find((task) => task.id === id);

    if (!taskToDelete) return;

    const shouldDelete = window.confirm(
      `Delete "${taskToDelete.title}"? This action cannot be undone.`
    );

    if (!shouldDelete) {
      return;
    }

    setError("");
    setSuccessMessage("");
    setBusyTaskId(id);

    const previousTasks = tasks;
    const wasEditingDeletedTask = editingTaskId === id;

    setTasks((prevTasks) => prevTasks.filter((task) => task.id !== id));

    if (wasEditingDeletedTask) {
      cancelEditing();
    }

    try {
      await requestJson<{ message: string }>(`/api/tasks/${id}`, {
        method: "DELETE",
      });

      setSuccessMessage("Task deleted.");
    } catch (requestError) {
      setTasks(previousTasks);

      if (wasEditingDeletedTask) {
        setEditingTaskId(taskToDelete.id);
        setTitle(taskToDelete.title);
        setCourse(taskToDelete.course);
        setDueDate(taskToDelete.dueDate.split("T")[0]);
      }

      handleClientError(requestError, setError);
    } finally {
      setBusyTaskId(null);
    }
  }

  async function toggleTask(id: number) {
    const taskToUpdate = tasks.find((task) => task.id === id);
    if (!taskToUpdate) return;

    setError("");
    setSuccessMessage("");
    setBusyTaskId(id);

    const optimisticTask: Task = {
      ...taskToUpdate,
      completed: !taskToUpdate.completed,
    };

    setTasks((prevTasks) =>
      prevTasks.map((task) => (task.id === id ? optimisticTask : task))
    );

    try {
      const updatedTask = await requestJson<Task>(`/api/tasks/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          completed: !taskToUpdate.completed,
        }),
      });

      setTasks((prevTasks) =>
        prevTasks.map((task) => (task.id === id ? updatedTask : task))
      );
      setSuccessMessage(
        updatedTask.completed ? "Task marked as completed." : "Task moved back to pending."
      );
    } catch (requestError) {
      setTasks((prevTasks) =>
        prevTasks.map((task) => (task.id === id ? taskToUpdate : task))
      );
      handleClientError(requestError, setError);
    } finally {
      setBusyTaskId(null);
    }
  }

  if (!mounted) {
    return (
      <main className="min-h-screen bg-gray-100 p-6">
        <div className="mx-auto max-w-3xl space-y-6">
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">Loading your workspace...</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-100 p-6">
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="flex flex-col gap-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold text-gray-900">Student Task Manager</h1>
            <p className="text-sm text-gray-500">
              Keep up with tasks, due dates, and what still needs attention.
            </p>
          </div>

          <div className="flex flex-col items-start gap-3 sm:items-end">
            <div className="rounded-lg bg-gray-50 px-3 py-2 text-sm text-gray-600">
              <span className="font-medium text-gray-800">Signed in</span>
              <span className="mx-2 text-gray-300" aria-hidden="true">
                •
              </span>
              <span>{getDisplayName(user)}</span>
            </div>
            <SignOutButton />
          </div>
        </div>

        <div className="space-y-5 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold text-gray-900">
              {isEditing ? "Edit task" : "Add a new task"}
            </h2>
            <p className="text-sm text-gray-500">
              {isEditing
                ? "Update the details below and save your changes."
                : "Add the next assignment, project, or study reminder to your list."}
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <label htmlFor="task-title" className="block text-sm font-medium text-gray-700">
                Task title
              </label>
              <input
                id="task-title"
                type="text"
                placeholder="Example: Finish database assignment"
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-gray-900 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="task-course" className="block text-sm font-medium text-gray-700">
                Course
              </label>
              <input
                id="task-course"
                type="text"
                placeholder="Example: DBMS"
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-gray-900 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                value={course}
                onChange={(event) => setCourse(event.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="task-due-date" className="block text-sm font-medium text-gray-700">
                Due date
              </label>
              <input
                id="task-due-date"
                type="date"
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-gray-900 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                value={dueDate}
                onChange={(event) => setDueDate(event.target.value)}
              />
            </div>
          </div>

          {error ? (
            <p
              role="alert"
              aria-live="polite"
              className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700"
            >
              {error}
            </p>
          ) : null}

          {!error && successMessage ? (
            <p
              aria-live="polite"
              className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-sm text-emerald-700"
            >
              {successMessage}
            </p>
          ) : null}

          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              onClick={saveTask}
              disabled={isSaving || !isFormValid}
              className="rounded-lg bg-blue-500 px-4 py-2.5 font-medium text-white shadow-sm transition hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-blue-300"
            >
              {isSaving
                ? isEditing
                  ? "Updating..."
                  : "Adding..."
                : isEditing
                  ? "Update task"
                  : "Add task"}
            </button>

            <button
              onClick={() => cancelEditing()}
              disabled={!isEditing}
              className={`rounded-lg px-4 py-2.5 font-medium text-white shadow-sm transition focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 ${
                isEditing
                  ? "bg-gray-500 hover:bg-gray-600"
                  : "cursor-not-allowed bg-gray-300"
              }`}
            >
              Cancel edit
            </button>
          </div>

          <div className="flex flex-wrap gap-2 border-t border-gray-100 pt-2">
            <button
              onClick={() => setFilter("all")}
              className={`rounded-full px-3 py-1.5 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                filter === "all" ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-700"
              }`}
            >
              All
            </button>

            <button
              onClick={() => setFilter("pending")}
              className={`rounded-full px-3 py-1.5 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                filter === "pending"
                  ? "bg-blue-500 text-white"
                  : "bg-gray-200 text-gray-700"
              }`}
            >
              Pending
            </button>

            <button
              onClick={() => setFilter("completed")}
              className={`rounded-full px-3 py-1.5 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                filter === "completed"
                  ? "bg-blue-500 text-white"
                  : "bg-gray-200 text-gray-700"
              }`}
            >
              Completed
            </button>
          </div>

          <div className="flex flex-col gap-1 text-sm text-gray-500 sm:flex-row sm:items-center sm:justify-between">
            <p>
              {sortedTasks.length} task{sortedTasks.length === 1 ? "" : "s"}
            </p>
            {isLoadingTasks ? <p>Loading tasks...</p> : null}
          </div>

          <ul className="space-y-2">
            {!isLoadingTasks && sortedTasks.length === 0 ? (
              <li className="rounded-xl border border-dashed border-gray-200 bg-gray-50 p-5 text-center">
                <p className="font-medium text-gray-700">
                  {filter === "all" ? "No tasks yet" : `No ${filter} tasks`}
                </p>
                <p className="mt-1 text-sm text-gray-500">
                  {filter === "all"
                    ? "Add your first task above to start organizing your work."
                    : "Try another filter or add a new task above."}
                </p>
              </li>
            ) : null}

            {sortedTasks.map((task) => (
              <li
                key={task.id}
                className={`rounded-xl border p-4 shadow-sm transition ${
                  isOverdue(task.dueDate) && !task.completed
                    ? "border-red-200 bg-red-50"
                    : "border-gray-200 bg-gray-50"
                }`}
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={task.completed}
                      onChange={() => toggleTask(task.id)}
                      disabled={busyTaskId === task.id}
                      aria-label={`Mark ${task.title} as ${
                        task.completed ? "pending" : "completed"
                      }`}
                      className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed"
                    />

                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                            task.completed
                              ? "bg-emerald-100 text-emerald-700"
                              : isOverdue(task.dueDate)
                                ? "bg-red-100 text-red-700"
                                : "bg-amber-100 text-amber-700"
                          }`}
                        >
                          {task.completed
                            ? "Completed"
                            : isOverdue(task.dueDate)
                              ? "Overdue"
                              : "Pending"}
                        </span>
                        <span className="text-xs font-medium tracking-wide text-gray-400">
                          {task.course}
                        </span>
                      </div>

                    <p
                      className={
                        task.completed
                          ? "text-gray-400 line-through"
                          : "font-medium text-gray-900"
                      }
                    >
                      {task.title}
                    </p>

                      <p className="text-sm text-gray-600">
                        Due {formatDate(task.dueDate)}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2 self-start sm:self-center">
                    <button
                      onClick={() => startEditing(task)}
                      disabled={busyTaskId === task.id}
                      className="rounded-lg bg-amber-500 px-3 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-amber-300"
                    >
                      {busyTaskId === task.id ? "Working..." : "Edit"}
                    </button>

                    <button
                      onClick={() => deleteTask(task.id)}
                      disabled={busyTaskId === task.id}
                      className="rounded-lg bg-red-500 px-3 py-2 text-sm font-medium text-white transition hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-red-300"
                    >
                      {busyTaskId === task.id ? "Working..." : "Delete"}
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </main>
  );
}

async function requestJson<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const response = await fetch(input, init);
  const data = (await response.json().catch(() => null)) as T | ApiError | null;

  if (response.status === 401) {
    window.location.href = "/login";
    throw new Error("Your session has expired. Please sign in again.");
  }

  if (!response.ok) {
    const message =
      data && typeof data === "object" && "error" in data && typeof data.error === "string"
        ? data.error
        : "Something went wrong. Please try again.";

    throw new Error(message);
  }

  return data as T;
}

function handleClientError(
  error: unknown,
  setError: Dispatch<SetStateAction<string>>
) {
  if (error instanceof Error) {
    setError(error.message);
    return;
  }

  setError("Something went wrong. Please try again.");
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getDisplayName(user: TaskManagerProps["user"]) {
  return user.name?.trim() || user.email || "Student";
}
