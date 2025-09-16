
import React, { useState, useEffect } from 'react';
import { Task, TaskStatus, Project } from '../types';
import Card from '../components/ui/Card';
import Modal from '../components/ui/Modal';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import DateInput from '../components/ui/DateInput';
import Select from '../components/ui/Select';
import Textarea from '../components/ui/Textarea';
import { PlusIcon, ClockIcon, FlagIcon, AlertTriangleIcon, ClipboardListIcon } from '../components/icons';
import PageHeader from '../components/ui/PageHeader';
import { supabase } from '../lib/supabase';
import SkeletonCard from '../components/ui/SkeletonCard';
import PageStatus from '../components/ui/PageStatus';

const statusColors: { [key in TaskStatus]: { bg: string, text: string, border: string } } = {
    Planned: { bg: 'bg-blue-50', text: 'text-blue-800', border: 'border-blue-500' },
    'Working on it': { bg: 'bg-yellow-50', text: 'text-yellow-800', border: 'border-yellow-500' },
    Completed: { bg: 'bg-green-50', text: 'text-green-800', border: 'border-green-500' },
    Delayed: { bg: 'bg-red-50', text: 'text-red-800', border: 'border-red-500' },
};

const TaskDetail: React.FC<{ icon: React.FC<{className?: string}>, label: string, value: string | number | undefined }> = ({ icon: Icon, label, value }) => {
    if (!value && value !== 0) return null;
    return (
        <div className="flex items-center space-x-2 text-xs text-neutral-600">
            <Icon className="w-4 h-4" />
            <span>{label}: <span className="font-semibold">{value}</span></span>
        </div>
    )
};

const TaskCard: React.FC<{ task: Task; onClick: () => void; }> = ({ task, onClick }) => (
    <Card 
        onClick={onClick}
        className={`mb-3 border-l-4 ${statusColors[task.status].border} ${statusColors[task.status].bg}`}
    >
        <p className="font-bold text-sm pr-2 text-neutral-800">{task.title}</p>
        {task.quantity && <p className="text-xs text-neutral-500">{task.quantity} {task.uom}</p>}
        
        <div className="mt-3 space-y-2">
            {task.status === 'Planned' && (
                <>
                    <TaskDetail icon={FlagIcon} label="Starts" value={task.plannedStartDate ? new Date(task.plannedStartDate).toLocaleDateString() : ''} />
                    <TaskDetail icon={ClockIcon} label="Duration" value={`${task.durationDays} days`} />
                </>
            )}
            {task.status === 'Working on it' && (
                 <>
                    <TaskDetail icon={FlagIcon} label="Started" value={task.actualStartDate ? new Date(task.actualStartDate).toLocaleDateString() : ''} />
                    <TaskDetail icon={ClockIcon} label="Est. End" value={task.estimatedEndDate ? new Date(task.estimatedEndDate).toLocaleDateString() : ''} />
                </>
            )}
             {task.status === 'Completed' && (
                 <>
                    <TaskDetail icon={FlagIcon} label="Started" value={task.actualStartDate ? new Date(task.actualStartDate).toLocaleDateString() : ''} />
                    <TaskDetail icon={FlagIcon} label="Finished" value={task.actualEndDate ? new Date(task.actualEndDate).toLocaleDateString() : ''} />
                </>
            )}
            {task.status === 'Delayed' && (
                 <>
                    <TaskDetail icon={FlagIcon} label="Started" value={task.actualStartDate ? new Date(task.actualStartDate).toLocaleDateString() : ''} />
                    <div className="flex items-start space-x-2 text-xs text-red-700">
                        <AlertTriangleIcon className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        <p><span className="font-semibold">Reason:</span> {task.delayReason}</p>
                    </div>
                </>
            )}
        </div>
    </Card>
);

const TaskFormModal: React.FC<{ 
    isOpen: boolean, 
    onClose: () => void, 
    onSave: (task: Task) => void,
    taskToEdit: Task | null,
    projects: Project[]
}> = ({ isOpen, onClose, onSave, taskToEdit, projects }) => {
    const [taskData, setTaskData] = useState<Partial<Task>>({});

    useEffect(() => {
        if (isOpen) {
            const defaultProjectId = projects.length > 0 ? projects[0].id : '';
            setTaskData(taskToEdit ? { ...taskToEdit } : { status: 'Planned', title: '', projectId: defaultProjectId });
        }
    }, [isOpen, taskToEdit, projects]);

    const handleChange = (field: keyof Task, value: any) => {
        setTaskData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(taskData as Task);
    };

    const isEditing = !!taskToEdit;

    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <h3 className="text-xl font-bold">{isEditing ? 'Edit Task' : 'Add New Task'}</h3>
                
                <Select id="project" label="Project" value={taskData.projectId || ''} onChange={e => handleChange('projectId', e.target.value)} required disabled={projects.length === 0}>
                    <option value="" disabled>Select a project</option>
                    {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </Select>

                <Input id="title" label="Task Title" value={taskData.title || ''} onChange={e => handleChange('title', e.target.value)} required />
                <div className="flex space-x-2">
                    <Input id="quantity" label="Quantity" type="number" value={taskData.quantity || ''} onChange={e => handleChange('quantity', parseFloat(e.target.value))} />
                    <Input id="uom" label="UOM" value={taskData.uom || ''} onChange={e => handleChange('uom', e.target.value)} />
                </div>
                <Select id="status" label="Status" value={taskData.status} onChange={e => handleChange('status', e.target.value as TaskStatus)}>
                    <option value="Planned">Planned</option>
                    <option value="Working on it">Working on it</option>
                    <option value="Completed">Completed</option>
                    <option value="Delayed">Delayed</option>
                </Select>
                
                {taskData.status === 'Planned' && (
                    <div className="p-3 bg-neutral-50 rounded-lg space-y-3">
                        <DateInput id="plannedStartDate" label="Planned Start Date" value={taskData.plannedStartDate || ''} onChange={e => handleChange('plannedStartDate', e.target.value)} />
                        <Input id="durationDays" label="Duration (in days)" type="number" value={taskData.durationDays || ''} onChange={e => handleChange('durationDays', parseInt(e.target.value))} />
                    </div>
                )}
                {(taskData.status === 'Working on it' || taskData.status === 'Completed' || taskData.status === 'Delayed') && (
                    <div className="p-3 bg-neutral-50 rounded-lg space-y-3">
                        <DateInput id="actualStartDate" label="Actual Start Date" value={taskData.actualStartDate || ''} onChange={e => handleChange('actualStartDate', e.target.value)} />
                    </div>
                )}
                {taskData.status === 'Working on it' && (
                    <div className="p-3 bg-neutral-50 rounded-lg space-y-3">
                        <DateInput id="estimatedEndDate" label="Estimated End Date" value={taskData.estimatedEndDate || ''} onChange={e => handleChange('estimatedEndDate', e.target.value)} />
                    </div>
                )}
                {taskData.status === 'Completed' && (
                    <div className="p-3 bg-neutral-50 rounded-lg space-y-3">
                        <DateInput id="actualEndDate" label="Actual End Date" value={taskData.actualEndDate || ''} onChange={e => handleChange('actualEndDate', e.target.value)} />
                    </div>
                )}
                {taskData.status === 'Delayed' && (
                     <div className="p-3 bg-neutral-50 rounded-lg space-y-3">
                        <Textarea id="delayReason" label="Reason for Delay" value={taskData.delayReason || ''} onChange={e => handleChange('delayReason', e.target.value)} required/>
                    </div>
                )}

                <Button type="submit" fullWidth disabled={!taskData.projectId}>{isEditing ? 'Save Changes' : 'Add Task'}</Button>
            </form>
        </Modal>
    );
};


const TasksPage: React.FC = () => {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeStatus, setActiveStatus] = useState<TaskStatus>('Planned');
    const [isModalOpen, setModalOpen] = useState(false);
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);
    
    const columns: TaskStatus[] = ['Planned', 'Working on it', 'Delayed', 'Completed'];

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        const tasksPromise = supabase.from('tasks').select('*').order('created_at', { ascending: false });
        const projectsPromise = supabase.from('projects').select('*');
        
        const [tasksRes, projectsRes] = await Promise.all([tasksPromise, projectsPromise]);

        if(tasksRes.data) {
            const mappedTasks: Task[] = tasksRes.data.map((t: any) => ({
                id: t.id, projectId: t.project_id, title: t.title, status: t.status, quantity: t.quantity, uom: t.uom,
                plannedStartDate: t.planned_start_date, durationDays: t.duration_days, actualStartDate: t.actual_start_date,
                estimatedEndDate: t.estimated_end_date, actualEndDate: t.actual_end_date, delayReason: t.delay_reason,
            }));
            setTasks(mappedTasks);
        }
        if(projectsRes.data) {
             const mappedProjects: Project[] = projectsRes.data.map((p: any) => ({
                id: p.id, name: p.name, location: p.location, status: p.status, startDate: p.start_date, engineerIds: [],
            }));
            setProjects(mappedProjects);
        }
        setLoading(false);
    };

    const handleAddTaskClick = () => {
        setSelectedTask(null);
        setModalOpen(true);
    };

    const handleTaskClick = (task: Task) => {
        setSelectedTask(task);
        setModalOpen(true);
    };

    const handleSaveTask = async (taskToSave: Task) => {
        setModalOpen(false);
        const isEditing = !!selectedTask;
        const originalTasks = tasks; 

        const optimisticTask: Task = isEditing
            ? { ...selectedTask!, ...taskToSave }
            : { ...taskToSave, id: `temp-${Date.now()}` };

        if (isEditing) {
            setTasks(currentTasks => currentTasks.map(t => t.id === selectedTask!.id ? optimisticTask : t));
        } else {
            setTasks(currentTasks => [optimisticTask, ...currentTasks]);
        }

        const taskDataForDb = {
            project_id: optimisticTask.projectId, title: optimisticTask.title, status: optimisticTask.status, quantity: optimisticTask.quantity, uom: optimisticTask.uom,
            planned_start_date: optimisticTask.plannedStartDate, duration_days: optimisticTask.durationDays, actual_start_date: optimisticTask.actualStartDate,
            estimated_end_date: optimisticTask.estimatedEndDate, actual_end_date: optimisticTask.actualEndDate, delay_reason: optimisticTask.delayReason
        };

        try {
            if (isEditing) {
                const { error } = await supabase.from('tasks').update(taskDataForDb).eq('id', optimisticTask.id);
                if (error) throw error;
            } else {
                const { data, error } = await supabase.from('tasks').insert(taskDataForDb).select().single();
                if (error) throw error;
                
                const newDbTask: Task = {
                    id: data.id, projectId: data.project_id, title: data.title, status: data.status, quantity: data.quantity, uom: data.uom,
                    plannedStartDate: data.planned_start_date, durationDays: data.duration_days, actualStartDate: data.actual_start_date,
                    estimatedEndDate: data.estimated_end_date, actualEndDate: data.actual_end_date, delayReason: data.delay_reason,
                };
                setTasks(currentTasks => currentTasks.map(t => t.id === optimisticTask.id ? newDbTask : t));
            }
        } catch (error: any) {
            console.error("Optimistic update failed:", error);
            alert(`Error: ${error.message}. Reverting changes.`);
            setTasks(originalTasks);
        }
    };

    const filteredTasks = tasks.filter(t => t.status === activeStatus);

    return (
        <div className="p-4 lg:p-0">
             <PageHeader title="Tasks" subtitle="Track and manage all project tasks.">
                <Button onClick={handleAddTaskClick}><PlusIcon className="w-5 h-5 mr-2" /> Add New Task</Button>
             </PageHeader>
            <TaskFormModal 
                isOpen={isModalOpen} 
                onClose={() => setModalOpen(false)} 
                onSave={handleSaveTask} 
                taskToEdit={selectedTask} 
                projects={projects}
            />
            <div className="p-4 lg:hidden">
                 <Button fullWidth onClick={handleAddTaskClick}><PlusIcon className="w-5 h-5 mr-2" /> Add New Task</Button>
            </div>
            
            <div className="lg:bg-white lg:rounded-xl lg:shadow-sm">
                {/* Tab Navigation */}
                <div className="flex border-b border-neutral-200 sticky top-[73px] lg:top-0 bg-white z-[5] lg:rounded-t-xl">
                    {columns.map(status => (
                        <button 
                            key={status}
                            onClick={() => setActiveStatus(status)}
                            className={`flex-1 py-3 text-xs sm:text-sm font-bold text-center transition-colors duration-200 ${
                                activeStatus === status 
                                ? 'text-primary-600 border-b-2 border-primary-600' 
                                : 'text-neutral-500 hover:text-primary-500'
                            }`}
                        >
                            {status} ({tasks.filter(t => t.status === status).length})
                        </button>
                    ))}
                </div>

                {/* Task List */}
                <div className="p-4 bg-neutral-100 lg:bg-white lg:p-6 lg:rounded-b-xl min-h-[50vh]">
                    {loading ? (
                         <div className="space-y-3">
                            <SkeletonCard />
                            <SkeletonCard />
                            <SkeletonCard />
                        </div>
                    ) : 
                    filteredTasks.length > 0 ? (
                        filteredTasks.map(task => (
                            <TaskCard key={task.id} task={task} onClick={() => handleTaskClick(task)} />
                        ))
                    ) : (
                        <PageStatus
                            icon={ClipboardListIcon}
                            title="No Tasks Here"
                            message={`There are no tasks with the status "${activeStatus}".`}
                        />
                    )}
                </div>
            </div>
        </div>
    );
};

export default TasksPage;
