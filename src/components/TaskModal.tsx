import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { collection, addDoc, updateDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuthContext } from "@/components/AuthProvider";
import { useToast } from "@/hooks/use-toast";
import type { Task } from "@shared/schema";
import { FaPlus, FaSave } from "react-icons/fa";

interface TaskModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task?: Task;
  onTaskUpdate?: () => void;
}

export default function TaskModal({ open, onOpenChange, task, onTaskUpdate }: TaskModalProps) {
  const [formData, setFormData] = useState({
    trelloTask: task?.trelloTask || "",
    taskLink: task?.taskLink || "",
    fromTime: task?.fromTime ? (() => {
      try {
        const date = task.fromTime instanceof Date ? task.fromTime : 
                    ((task.fromTime as any)?.seconds ? new Date((task.fromTime as any).seconds * 1000) : new Date(task.fromTime));
        return isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 16);
      } catch (error) {
        return "";
      }
    })() : "",
    toTime: task?.toTime ? (() => {
      try {
        const date = task.toTime instanceof Date ? task.toTime : 
                    ((task.toTime as any)?.seconds ? new Date((task.toTime as any).seconds * 1000) : new Date(task.toTime));
        return isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 16);
      } catch (error) {
        return "";
      }
    })() : "",
  });
  const [loading, setLoading] = useState(false);
  const { user } = useAuthContext();
  const { toast } = useToast();

  const isEditing = !!task;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    // Validate date inputs
    if (!formData.fromTime || !formData.toTime) {
      toast({
        title: "Error",
        description: "Please select both start and end times.",
        variant: "destructive",
      });
      return;
    }

    const fromDate = new Date(formData.fromTime);
    const toDate = new Date(formData.toTime);

    if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
      toast({
        title: "Error",
        description: "Please enter valid dates and times.",
        variant: "destructive",
      });
      return;
    }

    if (fromDate >= toDate) {
      toast({
        title: "Error",
        description: "Start time must be before end time.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const taskData = {
        trelloTask: formData.trelloTask,
        taskLink: formData.taskLink,
        fromTime: fromDate,
        toTime: toDate,
        userId: user.id,
      };

      if (isEditing) {
        await updateDoc(doc(db, "tasks", task.id), {
          ...taskData,
          updatedAt: new Date(),
        });
        toast({
          title: "Success",
          description: "Task updated successfully!",
        });
      } else {
        await addDoc(collection(db, "tasks"), {
          ...taskData,
          createdAt: new Date(),
        });
        toast({
          title: "Success",
          description: "Task created successfully!",
        });
      }

      onOpenChange(false);
      if (onTaskUpdate) onTaskUpdate();
      
      // Reset form if creating new task
      if (!isEditing) {
        setFormData({
          trelloTask: "",
          taskLink: "",
          fromTime: "",
          toTime: "",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to ${isEditing ? "update" : "create"} task. Please try again.`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Task" : "Add New Task"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">


          <div>
            <Label htmlFor="trelloTask" className="text-sm font-medium text-gray-700 mb-2">
              Trello <span className="text-red-500">*</span>
            </Label>
            <Input
              id="trelloTask"
              placeholder="Enter Trello Link"
              value={formData.trelloTask}
              onChange={(e) => handleInputChange("trelloTask", e.target.value)}
              required
              data-testid="input-trello-task"
            />
          </div>

          <div>
            <Label htmlFor="taskLink" className="text-sm font-medium text-gray-700 mb-2">
              Task Link <span className="text-red-500">*</span>
            </Label>
            <Input
              id="taskLink"
              type="url"
              placeholder="https://trello.com/..."
              value={formData.taskLink}
              onChange={(e) => handleInputChange("taskLink", e.target.value)}
              required
              data-testid="input-task-link"
            />
          </div>



          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="fromTime" className="text-sm font-medium text-gray-700 mb-2">
                From  <span className="text-red-500">*</span>
              </Label>
              <Input
                id="fromTime"
                type="datetime-local"
                value={formData.fromTime}
                onChange={(e) => handleInputChange("fromTime", e.target.value)}
                required
                data-testid="input-from-time"
              />
            </div>
            
            <div>
              <Label htmlFor="toTime" className="text-sm font-medium text-gray-700 mb-2">
                To  <span className="text-red-500">*</span>
              </Label>
              <Input
                id="toTime"
                type="datetime-local"
                value={formData.toTime}
                onChange={(e) => handleInputChange("toTime", e.target.value)}
                required
                data-testid="input-to-time"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              data-testid="button-cancel"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={loading}
              data-testid="button-submit-task"
            >
              {loading ? (
                isEditing ? "Updating..." : "Creating..."
              ) : (
                <>
                  {isEditing ? <FaSave className="mr-2" /> : <FaPlus className="mr-2" />}
                  {isEditing ? "Update Task" : "Create Task"}
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
