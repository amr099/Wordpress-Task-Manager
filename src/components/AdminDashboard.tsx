import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { collection, query, orderBy, onSnapshot, where, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import type { Task, User } from "@shared/schema";
import { FaUsers, FaTasks, FaCheckCircle, FaClock, FaHourglassHalf, FaDownload, FaRedo, FaExternalLinkAlt, FaCalendar, FaCopy } from "react-icons/fa";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

interface TaskWithUser extends Task {
  user?: User;
}

interface TeamMember {
  user: User;
  tasks: Task[];
  taskCount: number;
  totalHours: number;
}

export default function AdminDashboard() {
  const [tasks, setTasks] = useState<TaskWithUser[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date()); // Default to today
  const [filterMode, setFilterMode] = useState<"day" | "month">("day"); // Default to filtering by day
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Get today's start and end
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  useEffect(() => {
    const usersQuery = query(collection(db, "users"));
  
    const unsubscribeUsers = onSnapshot(usersQuery, (querySnapshot) => {
      const usersList: User[] = [];
      querySnapshot.forEach((doc) => {
        usersList.push({ id: doc.id, ...doc.data() } as User);
      });
      setUsers(usersList);
    });
  
    return () => unsubscribeUsers();
  }, []);

  useEffect(() => {
    const startOfDay = selectedDate
      ? new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate())
      : new Date();
    const endOfDay = new Date(startOfDay);
    endOfDay.setDate(startOfDay.getDate() + 1);
  
    const startOfMonth = selectedDate
      ? new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1)
      : new Date();
    const endOfMonth = new Date(startOfMonth);
    endOfMonth.setMonth(startOfMonth.getMonth() + 1);
  
    const tasksQuery = query(collection(db, "tasks"));
  
    const unsubscribeTasks = onSnapshot(tasksQuery, (querySnapshot) => {
      const tasksList: Task[] = [];
      querySnapshot.forEach((doc) => {
        const taskData = { id: doc.id, ...doc.data() } as Task;
        if (taskData.createdAt) {
          const taskDate = taskData.createdAt instanceof Date
            ? taskData.createdAt
            : new Date((taskData.createdAt as any).seconds * 1000);
  
          if (filterMode === "day" && taskDate >= startOfDay && taskDate < endOfDay) {
            tasksList.push(taskData);
          } else if (filterMode === "month" && taskDate >= startOfMonth && taskDate < endOfMonth) {
            tasksList.push(taskData);
          }
        }
      });
  
      // Sort by creation date descending
      tasksList.sort((a, b) => {
        if (!a.createdAt || !b.createdAt) return 0;
        const aDate = a.createdAt instanceof Date ? a.createdAt : new Date((a.createdAt as any).seconds * 1000);
        const bDate = b.createdAt instanceof Date ? b.createdAt : new Date((b.createdAt as any).seconds * 1000);
        return bDate.getTime() - aDate.getTime();
      });
  
      setTasks(tasksList);
      setLoading(false);
    });
  
    return () => unsubscribeTasks();
  }, [selectedDate, filterMode]);
  // Combine tasks with user data
  const tasksWithUsers: TaskWithUser[] = tasks.map(task => ({
    ...task,
    user: users.find(user => user.id === task.userId)
  }));

  // Group tasks by user
  const teamMembers: TeamMember[] = users
    .map(user => {
      const userTasks = tasksWithUsers.filter(task => task.userId === user.id);
      return {
        user,
        tasks: userTasks,
        taskCount: userTasks.length,
        totalHours: userTasks.reduce((sum, task) => {
          if (task.fromTime && task.toTime) {
            try {
              const from = task.fromTime instanceof Date ? task.fromTime : 
                          ((task.fromTime as any)?.seconds ? new Date((task.fromTime as any).seconds * 1000) : new Date(task.fromTime));
              const to = task.toTime instanceof Date ? task.toTime : 
                        ((task.toTime as any)?.seconds ? new Date((task.toTime as any).seconds * 1000) : new Date(task.toTime));
              
              if (isNaN(from.getTime()) || isNaN(to.getTime())) {
                return sum;
              }
              
              return sum + Math.round(Math.abs(to.getTime() - from.getTime()) / (1000 * 60 * 60));
            } catch (error) {
              return sum;
            }
          }
          return sum;
        }, 0)
      };
    })
    .filter(member => member.taskCount > 0);

  const stats = {
    activeUsers: teamMembers.length,
    todayTasks: tasks.length,
    totalHours: tasks.reduce((sum, task) => {
      if (task.fromTime && task.toTime) {
        try {
          const from = task.fromTime instanceof Date ? task.fromTime : 
                      ((task.fromTime as any)?.seconds ? new Date((task.fromTime as any).seconds * 1000) : new Date(task.fromTime));
          const to = task.toTime instanceof Date ? task.toTime : 
                    ((task.toTime as any)?.seconds ? new Date((task.toTime as any).seconds * 1000) : new Date(task.toTime));
          
          if (isNaN(from.getTime()) || isNaN(to.getTime())) {
            return sum;
          }
          
          return sum + Math.round(Math.abs(to.getTime() - from.getTime()) / (1000 * 60 * 60));
        } catch (error) {
          return sum;
        }
      }
      return sum;
    }, 0),
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "in-progress":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-blue-100 text-blue-800";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "in-progress":
        return "In Progress";
      case "completed":
        return "Completed";
      default:
        return "Pending";
    }
  };

  const generateExportText = () => {
    let exportText = "";
    
    teamMembers.forEach(member => {
      exportText += `Member Name: ${member.user.displayName}\n`;
      member.tasks.forEach((task, index) => {
        const formatTime = (date: Date) => {
          return date.toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true
          });
        };

        try {
          const fromTime = task.fromTime instanceof Date ? task.fromTime : 
                           ((task.fromTime as any)?.seconds ? new Date((task.fromTime as any).seconds * 1000) : new Date(task.fromTime));
          const toTime = task.toTime instanceof Date ? task.toTime : 
                        ((task.toTime as any)?.seconds ? new Date((task.toTime as any).seconds * 1000) : new Date(task.toTime));

          if (isNaN(fromTime.getTime()) || isNaN(toTime.getTime())) {
            exportText += `${index + 1}- ${task.trelloTask} [Invalid Date] ${task.taskLink}\n`;
          } else {
            exportText += `${index + 1}- ${task.trelloTask} [${formatTime(fromTime)} => ${formatTime(toTime)}] ${task.taskLink}\n`;
          }
        } catch (error) {
          exportText += `${index + 1}- ${task.trelloTask} [Invalid Date] ${task.taskLink}\n`;
        }
      });
      exportText += "\n";
    });

    return exportText;
  };

  const handleExport = () => {
    const exportText = generateExportText();
    const blob = new Blob([exportText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `tasks-export-${today.toISOString().split("T")[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Success",
      description: "Tasks exported successfully!",
    });
  };

  const handleCopyToClipboard = async () => {
    const exportText = generateExportText();
    try {
      await navigator.clipboard.writeText(exportText);
      toast({
        title: "Success",
        description: "Tasks copied to clipboard!",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy to clipboard.",
        variant: "destructive",
      });
    }
  };

  const handleRefresh = () => {
    toast({
      title: "Refreshed",
      description: "Data refreshed successfully!",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Admin Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h2 className="text-3xl font-bold text-gray-900">Admin Dashboard</h2>
            <Badge className="bg-purple-100 text-purple-800">Admin</Badge>
          </div>
          <p className="text-gray-600">Overview of all team tasks for today</p>
        </div>
        
        <div className="flex items-center gap-3">
        <div className="flex items-center gap-4">
  {/* Date Picker */}
  <DatePicker
    selected={selectedDate}
    onChange={(date) => setSelectedDate(date)}
    className="border rounded px-4 py-2"
    dateFormat="yyyy-MM-dd"
  />

  {/* Filter Mode Selector */}
  <select
    value={filterMode}
    onChange={(e) => setFilterMode(e.target.value as "day" | "month")}
    className="border rounded px-4 py-2"
  >
    <option value="day">Filter by Day</option>
    <option value="month">Filter by Month</option>
  </select>
</div>
          <Button 
            onClick={handleExport}
            className="bg-green-600 hover:bg-green-700 flex items-center gap-2"
            data-testid="button-export-tasks"
          >
            <FaDownload />
            <span>Export Tasks</span>
          </Button>
          <Button 
            onClick={handleRefresh}
            variant="secondary"
            className="flex items-center gap-2"
            data-testid="button-refresh"
          >
            <FaRedo />
            <span>Refresh</span>
          </Button>
        </div>
      </div>

      {/* Today's Overview */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <FaUsers className="text-primary text-xl" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900" data-testid="text-active-users">
                  {stats.activeUsers}
                </h3>
                <p className="text-gray-600 text-sm">Active Users</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                <FaTasks className="text-indigo-600 text-xl" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900" data-testid="text-today-tasks">
                  {stats.todayTasks}
                </h3>
                <p className="text-gray-600 text-sm">Today's Tasks</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <FaCheckCircle className="text-green-600 text-xl" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900" data-testid="text-admin-completed">
                  0
                </h3>
                <p className="text-gray-600 text-sm">Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <FaClock className="text-yellow-600 text-xl" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900" data-testid="text-admin-pending">
                  {stats.todayTasks}
                </h3>
                <p className="text-gray-600 text-sm">In Progress</p>
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
                <h3 className="text-2xl font-bold text-gray-900" data-testid="text-admin-total-hours">
                  {stats.totalHours}
                </h3>
                <p className="text-gray-600 text-sm">Total Hours</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

     {/* Team Tasks Overview */}
<Card>
  <CardHeader className="flex flex-row items-center justify-between">
    <CardTitle>Team Tasks</CardTitle>
    <div className="flex items-center gap-2 text-sm text-gray-500">
      <FaCalendar />
      <span data-testid="text-current-date">
        {selectedDate
          ? selectedDate.toLocaleDateString("en-US", { 
              weekday: "long",
              year: "numeric", 
              month: "long", 
              day: "numeric" 
            })
          : "Today"}
      </span>
    </div>
  </CardHeader>
  <CardContent className="p-0">
    {teamMembers.length === 0 ? (
      <div className="p-12 text-center">
        <div className="text-gray-400 mb-4">
          <FaTasks className="mx-auto text-4xl" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No tasks found</h3>
        <p className="text-gray-600">No tasks available for the selected time range</p>
      </div>
    ) : (
      <div className="divide-y divide-gray-200">
        {teamMembers.map((member) => (
          <div key={member.user.id} className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                  <FaUsers className="text-gray-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900" data-testid={`text-member-name-${member.user.id}`}>
                    {member.user.displayName}
                  </h4>
                  <p className="text-sm text-gray-500" data-testid={`text-member-email-${member.user.id}`}>
                    {member.user.email}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <span className="text-gray-600">
                  <span data-testid={`text-member-task-count-${member.user.id}`}>{member.taskCount}</span> tasks
                </span>
                <span className="text-gray-600">
                  <span data-testid={`text-member-total-hours-${member.user.id}`}>{member.totalHours}</span> hours
                </span>
              </div>
            </div>

            <div className="space-y-3 ml-13">
              {member.tasks.map((task) => (
                <div key={task.id} className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h5 className="font-medium text-gray-900" data-testid={`text-admin-task-title-${task.id}`}>
                          {task.trelloTask}
                        </h5>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                        <a 
                          href={task.taskLink} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-primary hover:underline flex items-center gap-1"
                          data-testid={`link-admin-task-${task.id}`}
                        >
                          <FaExternalLinkAlt className="text-xs" />
                          <span>Task Link</span>
                        </a>
                        <span className="flex items-center gap-1">
                          <FaClock className="text-xs" />
                          <span data-testid={`text-admin-task-hours-${task.id}`}>
                            {(() => {
                              if (task.fromTime && task.toTime) {
                                try {
                                  const from = task.fromTime instanceof Date ? task.fromTime : 
                                              ((task.fromTime as any)?.seconds ? new Date((task.fromTime as any).seconds * 1000) : new Date(task.fromTime));
                                  const to = task.toTime instanceof Date ? task.toTime : 
                                            ((task.toTime as any)?.seconds ? new Date((task.toTime as any).seconds * 1000) : new Date(task.toTime));
                                  
                                  if (isNaN(from.getTime()) || isNaN(to.getTime())) {
                                    return "Invalid Date";
                                  }
                                  
                                  const formatTime = (date: Date) => date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
                                  return `${formatTime(from)} → ${formatTime(to)}`;
                                } catch (error) {
                                  return "Invalid Date";
                                }
                              }
                              return "No time set";
                            })()}
                          </span>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    )}
  </CardContent>
</Card>
      {/* Export Preview */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Export Preview</CardTitle>
          <Button
            onClick={handleCopyToClipboard}
            variant="secondary"
            className="flex items-center gap-2"
            data-testid="button-copy-clipboard"
          >
            <FaCopy />
            <span>Copy to Clipboard</span>
          </Button>
        </CardHeader>
        <CardContent>
          <div className="bg-gray-50 rounded-lg p-4 font-mono text-sm overflow-x-auto">
            <pre className="whitespace-pre-wrap text-gray-800" data-testid="text-export-preview">
              {generateExportText() || "No tasks to export for today."}
            </pre>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
