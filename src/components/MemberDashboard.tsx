import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { collection, query, where, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuthContext } from "@/components/AuthProvider";
import TaskModal from "./TaskModal";
import TaskList from "./TaskList";
import type { Task } from "@shared/schema";
import { FaPlus, FaTasks, FaCheckCircle, FaClock, FaHourglassHalf, FaSearch } from "react-icons/fa";

export default function MemberDashboard() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all"); // Keep for UI compatibility
  const [sortBy, setSortBy] = useState("date");
  const { user } = useAuthContext();

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, "tasks"),
      where("userId", "==", user.id)
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const tasksList: Task[] = [];
      querySnapshot.forEach((doc) => {
        tasksList.push({
          id: doc.id,
          ...doc.data()
        } as Task);
      });
      setTasks(tasksList);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    let filtered = tasks;
  
    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(task =>
        task.trelloTask.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.taskLink.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
  
    // Filter tasks for today only
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);
  
    filtered = filtered.filter(task => {
      const taskDate = task.createdAt instanceof Date
        ? task.createdAt
        : new Date((task.createdAt as any)?.seconds * 1000);
  
      return taskDate >= startOfDay && taskDate <= endOfDay;
    });
  
    // Sort tasks
    filtered = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case "title":
          return a.trelloTask.localeCompare(b.trelloTask);
        case "date":
        default:
          const dateA = a.createdAt ? (a.createdAt instanceof Date ? a.createdAt : new Date((a.createdAt as any).seconds * 1000)) : new Date();
          const dateB = b.createdAt ? (b.createdAt instanceof Date ? b.createdAt : new Date((b.createdAt as any).seconds * 1000)) : new Date();
          return dateB.getTime() - dateA.getTime();
      }
    });
  
    setFilteredTasks(filtered);
  }, [tasks, searchQuery, filterStatus, sortBy]);

  const stats = {
  totalTasks: filteredTasks.length,
  totalHours: filteredTasks.reduce((sum, task) => {
    if (task.fromTime && task.toTime) {
      try {
        const from = task.fromTime instanceof Date ? task.fromTime : 
                    ((task.fromTime as any)?.seconds ? new Date((task.fromTime as any).seconds * 1000) : new Date(task.fromTime));
        const to = task.toTime instanceof Date ? task.toTime : 
                  ((task.toTime as any)?.seconds ? new Date((task.toTime as any).seconds * 1000) : new Date(task.toTime));
        
        if (isNaN(from.getTime()) || isNaN(to.getTime())) {
          return sum;
        }
        
        return sum + Math.round(Math.abs(to.getTime() - from.getTime()) / (1000 * 60 * 60)); // Convert to hours
      } catch (error) {
        return sum;
      }
    }
    return sum;
  }, 0),
};
  const handleTaskUpdate = () => {
    // Tasks will be updated via real-time listener
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading tasks...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">My Tasks</h2>
          <p className="text-gray-600 mt-1">Manage your daily tasks and track progress</p>
        </div>
        
        <Button 
          onClick={() => setCreateModalOpen(true)}
          className="flex items-center gap-2"
          data-testid="button-add-task"
        >
          <FaPlus />
          <span>Add New Task</span>
        </Button>
      </div>

      {/* Task Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <FaTasks className="text-primary text-xl" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900" data-testid="text-total-tasks">
                  {stats.totalTasks}
                </h3>
                <p className="text-gray-600 text-sm">Total Tasks</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <FaHourglassHalf className="text-purple-600 text-xl" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900" data-testid="text-total-hours">
                  {Math.round(stats.totalHours * 10) / 10}
                </h3>
                <p className="text-gray-600 text-sm">Total Hours</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Task Filters and Search */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Search tasks..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                  data-testid="input-search-tasks"
                />
              </div>
            </div>
            
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full sm:w-[180px]" data-testid="select-sort-by">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date">Sort by Date</SelectItem>
                <SelectItem value="title">Sort by Title</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tasks List */}
      <TaskList tasks={filteredTasks} onTaskUpdate={handleTaskUpdate} />

      <TaskModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        onTaskUpdate={handleTaskUpdate}
      />
    </div>
  );
}
