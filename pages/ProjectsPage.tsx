
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Project, UserRole } from '../types';
import { useAuth } from '../core/auth/useAuth';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import { ChevronRightIcon, BriefcaseIcon } from '../components/icons';
import PageHeader from '../components/ui/PageHeader';
import { supabase } from '../core/auth/supabase';
import SkeletonCard from '../components/ui/SkeletonCard';
import PageStatus from '../components/ui/PageStatus';

const statusColors = {
    Ongoing: 'bg-blue-100 text-blue-800',
    Completed: 'bg-green-100 text-green-800',
    'On Hold': 'bg-yellow-100 text-yellow-800',
};

const ProjectsPage: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchProjects = async () => {
            setLoading(true);
            const { data, error } = await supabase.from('projects').select('*').order('created_at', { ascending: false });
            if (data) {
                setProjects(data as unknown as Project[]);
            }
            setLoading(false);
        };
        fetchProjects();
    }, []);

    const handleCardClick = (project: Project) => {
        if (user?.role === UserRole.Board) {
            navigate(`/board/projects/${project.id}`);
        } else {
            navigate(`/projects/${project.id}`);
        }
    };

    const filteredProjects = projects.filter(p => 
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.location.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    const renderContent = () => {
        if (loading) {
            return (
                <div className="space-y-4">
                    <SkeletonCard />
                    <SkeletonCard />
                    <SkeletonCard />
                </div>
            );
        }
        
        if (filteredProjects.length === 0) {
            return (
                <Card>
                    <PageStatus
                        icon={BriefcaseIcon}
                        title="No Projects Found"
                        message={searchTerm ? `No projects match "${searchTerm}".` : "No projects have been created yet."}
                    />
                </Card>
            );
        }
        
        return filteredProjects.map(project => (
            <Card key={project.id} onClick={() => handleCardClick(project)}>
                 <div className="flex justify-between items-start">
                    <div>
                        <p className="font-bold text-lg text-neutral-800">{project.name}</p>
                        <p className="text-sm text-neutral-500">{project.location}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                         <span className={`text-xs font-bold px-2 py-1 rounded-full ${statusColors[project.status]}`}>
                            {project.status}
                        </span>
                        <ChevronRightIcon className="w-5 h-5 text-neutral-500"/>
                    </div>
                </div>
            </Card>
        ));
    }

    return (
        <div className="p-4 lg:p-0 space-y-4">
            <PageHeader title="Projects" subtitle="Browse and manage all company projects."/>
            <Input 
                id="search-projects" 
                label="" 
                type="search" 
                placeholder="Search projects..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
            />
            {renderContent()}
        </div>
    );
};

export default ProjectsPage;
