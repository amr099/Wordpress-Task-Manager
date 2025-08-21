import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { doc, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import TaskModal from "./TaskModal";
import type { Task } from "@shared/schema";
import { FaExternalLinkAlt, FaClock, FaCalendar, FaEdit, FaTrash, FaExclamationTriangle } from "react-icons/fa";

interface TaskListProps {
  tasks: Task[];
  onTaskUpdate: () => void;
}

const formatTimeRange = (fromTime: any, toTime: any) => {
  if (!fromTime || !toTime) return "No time set";
  
  try {
    // Handle Firebase Timestamp objects properly
    const from = fromTime instanceof Date ? fromTime : 
                 (fromTime?.seconds ? new Date(fromTime.seconds * 1000) : new Date(fromTime));
    const to = toTime instanceof Date ? toTime : 
               (toTime?.seconds ? new Date(toTime.seconds * 1000) : new Date(toTime));
    
    // Check if dates are valid
    if (isNaN(from.getTime()) || isNaN(to.getTime())) {
      return "Invalid Date";
    }
    
    const formatTime = (date: Date) => new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
    
    return `${formatTime(from)} → ${formatTime(to)}`;
  } catch (error) {
    return "Invalid Date";
  }
};

export default function TaskList({ tasks, onTaskUpdate }: TaskListProps) {
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [deletingTask, setDeletingTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleDelete = async () => {
    if (!deletingTask) return;

    setLoading(true);
    try {
      await deleteDoc(doc(db, "tasks", deletingTask.id));
      toast({
        title: "Success",
        description: "Task deleted successfully!",
      });
      onTaskUpdate();
      setDeletingTask(null);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete task. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  if (tasks.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <div className="text-gray-400 mb-4">
            <FaClock className="mx-auto text-4xl" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No tasks yet</h3>
          <p className="text-gray-600">Create your first task to get started</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Recent Tasks</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-gray-200">
            {tasks.map((task) => (
              <div key={task.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-semibold text-gray-900" data-testid={`text-task-title-${task.id}`}>
                        {task.trelloTask}
                      </h4>
                    </div>
                    
                    <div className="flex items-center gap-6 text-sm text-gray-600 mb-3">
                      <div className="flex items-center gap-2">
                        <FaExternalLinkAlt />
                        <a 
                          href={task.taskLink} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                          data-testid={`link-task-${task.id}`}
                        >
                          View Task
                        </a>
                      </div>
                      <div className="flex items-center gap-2">
                        <FaClock />
                        <span data-testid={`text-task-time-${task.id}`}>{formatTimeRange(task.fromTime, task.toTime)}</span>
                      </div>
                    </div>


                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    {/* <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setEditingTask(task)}
                      data-testid={`button-edit-task-${task.id}`}
                    >
                      <FaEdit className="text-gray-400 hover:text-primary" />
                    </Button> */}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeletingTask(task)}
                      data-testid={`button-delete-task-${task.id}`}
                    >
                      <FaTrash className="text-gray-400 hover:text-red-500" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <TaskModal
        open={!!editingTask}
        onOpenChange={(open) => !open && setEditingTask(null)}
        task={editingTask || undefined}
        onTaskUpdate={onTaskUpdate}
      />

      <AlertDialog open={!!deletingTask} onOpenChange={(open) => !open && setDeletingTask(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <FaExclamationTriangle className="text-red-500 text-xl" />
              </div>
              <div>
                <AlertDialogTitle>Delete Task</AlertDialogTitle>
                <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
              </div>
            </div>
          </AlertDialogHeader>
          <AlertDialogDescription>
            Are you sure you want to delete this task? All task data will be permanently removed.
          </AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              disabled={loading}
              className="bg-red-600 hover:bg-red-700"
              data-testid="button-confirm-delete"
            >
              {loading ? "Deleting..." : (
                <>
                  <FaTrash className="mr-2" />
                  Delete Task
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
