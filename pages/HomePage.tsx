
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { useAuth } from '../core/auth/useAuth';
import { ChevronRightIcon, AttendanceIcon, AlertTriangleIcon, BoxIcon, ClipboardListIcon, FlagIcon, ClockIcon } from '../components/icons';
import { Task, Material } from '../types';
import WeeklyProgressChart from '../components/charts/WeeklyProgressChart';
import PageHeader from '../components/ui/PageHeader';
import { supabase } from '../core/auth/supabase';
import PageStatus from '../components/ui/PageStatus';
import SkeletonCard from '../components/ui/SkeletonCard';

const MetricCard: React.FC<{ icon: React.FC<{className?: string}>, label: string, value: string, color: string, onClick?: () => void }> = ({ icon: Icon, label, value, color, onClick }) => (
    <Card className={`flex flex-col items-center justify-center text-center p-3 sm:p-4`} onClick={onClick}>
        <Icon className={`w-8 h-8 mb-2 ${color}`} />
        <p className="font-bold text-2xl text-neutral-800">{value}</p>
        <p className="text-xs text-neutral-500">{label}</p>
    </Card>
);

const statusColors: { [key in Task['status']]: { text: string, bg: string, icon: React.FC<{className?: string}> } } = {
    Planned: { text: 'text-blue-600', bg: 'bg-blue-100', icon: ClockIcon },
    'Working on it': { text: 'text-yellow-600', bg: 'bg-yellow-100', icon: FlagIcon },
    Completed: { text: 'text-green-600', bg: 'bg-green-100', icon: FlagIcon },
    Delayed: { text: 'text-red-600', bg: 'bg-red-100', icon: AlertTriangleIcon },
};


const TaskItem: React.FC<{task: Task}> = ({ task }) => {
    const navigate = useNavigate();
    const { text, bg, icon: Icon } = statusColors[task.status];
    return (
        <button onClick={() => navigate('/tasks')} className="w-full text-left p-3 flex items-center bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
            <div className={`p-2 rounded-full mr-3 ${bg}`}>
                <Icon className={`w-5 h-5 ${text}`} />
            </div>
            <div className="flex-grow">
                <p className="font-semibold text-sm text-neutral-800">{task.title}</p>
                <p className="text-xs text-neutral-500">{task.status}</p>
            </div>
             <ChevronRightIcon className="w-5 h-5 text-neutral-400" />
        </button>
    );
};


const HomePage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const tasksPromise = supabase.from('tasks').select('*');
      const materialsPromise = supabase.from('materials').select('*');
      
      const [tasksRes, materialsRes] = await Promise.all([tasksPromise, materialsPromise]);

      if(tasksRes.data) setTasks(tasksRes.data as unknown as Task[]);
      if(materialsRes.data) setMaterials(materialsRes.data);

      setLoading(false);
    };
    fetchData();
  }, []);
  
  const overdueTasksCount = tasks.filter(t => t.status === 'Delayed').length;
  const lowStockItemsCount = materials.filter(m => m.currentStock < m.minStock).length;
  const todaysTasks = tasks.filter(t => t.status === 'Working on it' || t.status === 'Delayed').slice(0, 3);
  const activeTasksCount = tasks.filter(t => t.status === 'Working on it').length;

  const weeklyTasksData = Array(7).fill(0).map((_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    const day = date.toLocaleDateString('en-US', { weekday: 'short' });
    const count = tasks.filter(t => t.status === 'Completed' && t.actualEndDate && new Date(t.actualEndDate).toDateString() === date.toDateString()).length;
    return { label: day.slice(0,3), value: count };
  });

  if (loading) {
    return (
        <div className="p-4 lg:p-0">
             <div className="animate-pulse">
                <div className="h-8 bg-neutral-200 rounded w-1/2 lg:w-1/3 mb-2"></div>
                <div className="h-4 bg-neutral-200 rounded w-2/3 lg:w-1/4 mb-6"></div>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
                    <div className="h-24 bg-neutral-200 rounded-xl"></div>
                    <div className="h-24 bg-neutral-200 rounded-xl"></div>
                    <div className="h-24 bg-neutral-200 rounded-xl"></div>
                    <div className="h-24 bg-neutral-200 rounded-xl"></div>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 h-64 bg-neutral-200 rounded-xl"></div>
                    <div className="lg:col-span-1 space-y-3">
                         <div className="h-6 bg-neutral-200 rounded w-1/2 mb-2"></div>
                         <SkeletonCard className="h-20" />
                         <SkeletonCard className="h-20" />
                         <SkeletonCard className="h-20" />
                    </div>
                </div>
            </div>
        </div>
    );
  }

  return (
    <div className="p-4 lg:p-0">
      <PageHeader title="Dashboard" subtitle={`Welcome, ${user?.name.split(' ')[0]}!`} />

      <section className="lg:hidden mb-6">
        <h2 className="text-2xl font-bold text-neutral-800">Welcome, {user?.name.split(' ')[0]}!</h2>
        <p className="text-neutral-500">Here's your project summary for today.</p>
      </section>

      {/* Project Vitals */}
      <section>
          <h3 className="font-bold text-lg mb-2 text-neutral-700">Project Vitals</h3>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <MetricCard icon={AttendanceIcon} label="Attendance" value="-" color="text-blue-600" onClick={() => navigate('/attendance')} />
              <MetricCard icon={ClipboardListIcon} label="Active Tasks" value={activeTasksCount.toString()} color="text-yellow-600" onClick={() => navigate('/tasks')} />
              <MetricCard icon={AlertTriangleIcon} label="Overdue Tasks" value={overdueTasksCount.toString()} color="text-red-600" onClick={() => navigate('/tasks')} />
              <MetricCard icon={BoxIcon} label="Low Stock Items" value={lowStockItemsCount.toString()} color="text-orange-600" onClick={() => navigate('/materials')} />
          </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        <div className="lg:col-span-2">
            <WeeklyProgressChart data={weeklyTasksData} title="Tasks Completed This Week" />
        </div>
        <div className="lg:col-span-1">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-bold text-lg text-neutral-700">My Tasks for Today</h3>
            <button onClick={() => navigate('/tasks')} className="text-sm font-semibold text-primary-600">View All</button>
          </div>
          <div className="space-y-2">
              {todaysTasks.length > 0 ? (
                todaysTasks.map(task => <TaskItem key={task.id} task={task} />)
              ) : (
                <Card>
                    <PageStatus
                        icon={ClipboardListIcon}
                        title="All Clear!"
                        message="No pressing tasks for today. Great job!"
                    />
                </Card>
              )}
          </div>
        </div>
      </div>

      <section className="space-y-4 mt-6">
        <h3 className="font-bold text-lg text-neutral-700">Quick Actions</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Button variant="secondary" onClick={() => navigate('/attendance')}>Mark Attendance</Button>
            <Button variant="secondary" onClick={() => navigate('/work')}>New Work Report</Button>
            <Button variant="secondary" onClick={() => navigate('/materials')}>Record Material</Button>
            <Button variant="secondary" onClick={() => navigate('/projects')}>View Projects</Button>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
