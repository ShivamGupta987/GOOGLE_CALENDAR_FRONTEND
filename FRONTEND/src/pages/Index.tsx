import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import CalendarGrid from '@/components/Calendar/CalendarGrid';
import Sidebar from '@/components/Sidebar/Sidebar';
import { Event, Task, Goal, TimeSlot, Category } from '@/lib/types';
import EventModal from '@/components/Calendar/EventModal';
import { useToast } from '@/components/ui/use-toast';
import { 
  fetchEvents, 
  fetchGoals, 
  fetchTasks, 
  createEvent, 
  updateEvent, 
  deleteEvent 
} from '@/lib/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const Index = () => {
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<TimeSlot | null>(null);
  const [activeGoal, setActiveGoal] = useState<Goal | null>(null);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch data using React Query
  const { data: events = [], isLoading: isEventsLoading, error: eventsError, refetch: refetchEvents } = useQuery({
    queryKey: ['events'],
    queryFn: fetchEvents,
  });

  const { data: goals = [], isLoading: isGoalsLoading, error: goalsError } = useQuery({
    queryKey: ['goals'],
    queryFn: fetchGoals,
  });

  const { data: tasks = [], isLoading: isTasksLoading, error: tasksError } = useQuery({
    queryKey: ['tasks'],
    queryFn: fetchTasks,
  });

  // Show error toasts if any fetch fails
  useEffect(() => {
    if (eventsError) {
      toast({ title: "Error fetching events", description: "Please check your connection and try again.", variant: "destructive" });
    }
    if (goalsError) {
      toast({ title: "Error fetching goals", description: "Please check your connection and try again.", variant: "destructive" });
    }
    if (tasksError) {
      toast({ title: "Error fetching tasks", description: "Please check your connection and try again.", variant: "destructive" });
    }
    console.log('Events:', events, 'Goals:', goals, 'Tasks:', tasks); // Debug log
  }, [eventsError, goalsError, tasksError, toast, events, goals, tasks]);

  // Event mutations
  const createEventMutation = useMutation({
    mutationFn: (eventData: Omit<Event, 'id'>) => createEvent(eventData),
    onSuccess: (newEvent) => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      refetchEvents(); // Explicitly refetch events
      toast({ title: "Event Created", description: `${newEvent.title} added.` });
    },
    onError: () => toast({ title: "Error Creating Event", description: "Please try again.", variant: "destructive" }),
  });

  const updateEventMutation = useMutation({
    mutationFn: (event: Event) => updateEvent(event.id, event),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      refetchEvents();
      toast({ title: "Event Updated", description: "Event updated." });
    },
    onError: () => toast({ title: "Error Updating Event", description: "Please try again.", variant: "destructive" }),
  });

  const deleteEventMutation = useMutation({
    mutationFn: (eventId: string) => deleteEvent(eventId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      refetchEvents();
      toast({ title: "Event Deleted", description: "Event deleted.", variant: "destructive" });
    },
    onError: () => toast({ title: "Error Deleting Event", description: "Please try again.", variant: "destructive" }),
  });

  // Event handlers
  const handleEventCreate = (eventData: Omit<Event, 'id'>) => {
    createEventMutation.mutate(eventData);
  };

  const handleEventUpdate = (updatedEvent: Event) => {
    updateEventMutation.mutate(updatedEvent);
  };

  const handleEventDelete = (eventId: string) => {
    const eventToDelete = events.find(event => event.id === eventId);
    deleteEventMutation.mutate(eventId);
  };

  const handleTaskDragStart = (task: Task) => {
    setDraggedTask(task);
  };

  const handleGoalSelect = (goal: Goal | null) => {
    setActiveGoal(goal);
  };

  const handleCalendarDrop = (e: React.DragEvent, day: Date, hour: number) => {
    e.preventDefault();
    if (!draggedTask) return;
    const taskId = e.dataTransfer.getData('taskId');
    if (!taskId) return;

    const startTime = new Date(day);
    startTime.setHours(hour, 0, 0, 0);
    const endTime = new Date(startTime);
    endTime.setHours(hour + 1, 0, 0, 0);

    setSelectedTimeSlot({ hour, minute: 0 });
    setIsTaskModalOpen(true);
  };

  const handleCreateEventFromTask = (eventData: Omit<Event, 'id'>) => {
    if (!draggedTask || !selectedTimeSlot) return;
    const day = new Date(); // Use current date or derive from context
    const startTime = new Date(day);
    startTime.setHours(selectedTimeSlot.hour, 0, 0, 0);
    const endTime = new Date(startTime);
    endTime.setHours(selectedTimeSlot.hour + 1, 0, 0, 0);

    const eventWithTask = {
      ...eventData,
      title: eventData.title || draggedTask.title,
      taskId: draggedTask.id,
      color: goals.find(g => g.id === draggedTask.goalId)?.color,
      category: eventData.category || 'work' as Category, // Use category from eventData, fallback to 'work'
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
    };
    console.log('Creating event with category:', eventWithTask.category); // Debug log
    createEventMutation.mutate(eventWithTask);
  };

  if (isEventsLoading || isGoalsLoading || isTasksLoading) {
    return <div className="flex h-screen w-full items-center justify-center text-xl font-semibold">Loading...</div>;
  }

  return (
    <div className="flex h-screen w-full overflow-hidden">
<Sidebar 
  goals={[
    { id: "67fb552d75693dff4db71c9a", title: "Be fit", color: "bg-red-200" },
    { id: "67fb552d75693dff4db71c9b", title: "Academics", color: "bg-blue-200" },
    { id: "67fb552d75693dff4db71c9c", title: "LEARN", color: "bg-purple-200" },
    { id: "67fb552d75693dff4db71c9d", title: "Sports", color: "bg-green-200" },
  ]}
  tasks={[
    { id: "67fb553575693dff4db71ca0", title: "Morning Run", goalId: "67fb552d75693dff4db71c9a", completed: false },
    { id: "67fb553575693dff4db71ca1", title: "AI based agents", goalId: "67fb552d75693dff4db71c9c", completed: false },
    { id: "67fb553575693dff4db71ca2", title: "MLE", goalId: "67fb552d75693dff4db71c9c", completed: false },
    { id: "67fb553575693dff4db71ca3", title: "DE related", goalId: "67fb552d75693dff4db71c9c", completed: false },
    { id: "67fb553575693dff4db71ca4", title: "Basics", goalId: "67fb552d75693dff4db71c9c", completed: false },
  ]}
  onTaskDragStart={handleTaskDragStart}
  selectedGoalId={activeGoal?.id || null}
  onGoalSelect={handleGoalSelect}
/>
      <div className="flex-1 overflow-hidden">
        <CalendarGrid 
          events={events}
          onEventCreate={handleEventCreate}
          onEventUpdate={handleEventUpdate}
          onEventDelete={handleEventDelete}
          onCalendarDrop={handleCalendarDrop}
        />
      </div>
      <EventModal
        isOpen={isTaskModalOpen}
        onClose={() => { setIsTaskModalOpen(false); setDraggedTask(null); }}
        onSave={handleCreateEventFromTask}
        selectedTime={{ startTime: new Date().toISOString(), endTime: new Date().toISOString() }}
        initialTitle={draggedTask?.title}
        initialCategory={activeGoal && goals.find(g => g.id === draggedTask?.goalId)?.title.toLowerCase() as Category | undefined}
      />
    </div>
  );
};

export default Index;