
import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Project, Task } from '../types';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import PageHeader from '../components/ui/PageHeader';
import { supabase } from '../core/auth/supabase';

const ProjectDetailPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [project, setProject] = useState<Project | null>(null);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!id) {
            navigate('/projects');
            return;
        }

        const fetchProjectData = async () => {
            setLoading(true);
            const projectPromise = supabase.from('projects').select('*').eq('id', id).single();
            const tasksPromise = supabase.from('tasks').select('*').eq('project_id', id);

            const [projectRes, tasksRes] = await Promise.all([projectPromise, tasksPromise]);

            if (projectRes.data) setProject(projectRes.data as unknown as Project);
            if (tasksRes.data) setTasks(tasksRes.data as unknown as Task[]);

            setLoading(false);
        };

        fetchProjectData();
    }, [id, navigate]);

    if (loading) {
        return (
            <div className="p-4 lg:p-0 animate-pulse">
                <div className="h-8 bg-neutral-200 rounded w-1/3 mb-2 hidden lg:block"></div>
                <div className="h-6 bg-neutral-200 rounded w-1/2 mb-1 lg:hidden"></div>
                <div className="h-4 bg-neutral-200 rounded w-1/3 mb-6 lg:hidden"></div>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <div className="h-24 bg-neutral-200 rounded-xl"></div>
                    <div className="h-24 bg-neutral-200 rounded-xl"></div>
                    <div className="h-24 bg-neutral-200 rounded-xl"></div>
                    <div className="h-24 bg-neutral-200 rounded-xl"></div>
                </div>
                <div className="h-12 bg-neutral-200 rounded-lg w-full"></div>
            </div>
        );
    }

    if (!project) {
        return <div className="p-4 text-center">Project not found.</div>;
    }

    const overdueTasks = tasks.filter(t => t.status === 'Delayed').length;
    const completedTasks = tasks.filter(t => t.status === 'Completed').length;
    const progress = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;

    return (
        <div className="p-4 lg:p-0 space-y-6">
            <PageHeader title={project.name} subtitle={project.location} />
            <section className="lg:hidden">
                <h2 className="text-2xl font-bold text-neutral-800">{project.name}</h2>
                <p className="text-neutral-500">{project.location}</p>
            </section>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-center">
                <Card>
                    <p className="text-sm text-neutral-500">Total Tasks</p>
                    <p className="text-2xl font-bold">{tasks.length}</p>
                </Card>
                <Card>
                    <p className="text-sm text-neutral-500">Progress</p>
                    <p className="text-2xl font-bold">{progress}%</p>
                </Card>
                 <Card>
                    <p className="text-sm text-neutral-500">Overdue Tasks</p>
                    <p className="text-2xl font-bold">{overdueTasks}</p>
                </Card>
                 <Card>
                    <p className="text-sm text-neutral-500">Status</p>
                    <p className="text-xl font-bold">{project.status}</p>
                </Card>
            </div>
            <Link to="/tasks" className="block"><Button variant="primary" fullWidth>View Project Tasks</Button></Link>
        </div>
    );
};

export default ProjectDetailPage;
