
import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../core/auth/supabase';
import Card from '../components/ui/Card';
import PageHeader from '../components/ui/PageHeader';
import { WorkReport, LabourTeam, LabourType, Material, Project } from '../types';
import { ChevronRightIcon } from '../components/icons';
import ViewReportModal from '../components/modals/ViewReportModal';
import SkeletonCard from '../components/ui/SkeletonCard';

const WorkHistoryPage: React.FC = () => {
    const [reports, setReports] = useState<any[]>([]);
    const [teams, setTeams] = useState<LabourTeam[]>([]);
    const [types, setTypes] = useState<LabourType[]>([]);
    const [materials, setMaterials] = useState<Material[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedReport, setSelectedReport] = useState<any | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            const reportsPromise = supabase.from('work_reports').select('*, work_items(*, labour_allocations(*), material_consumptions(*))').order('date', { ascending: false });
            const teamsPromise = supabase.from('labour_teams').select('*');
            const typesPromise = supabase.from('labour_types').select('*');
            const materialsPromise = supabase.from('materials').select('*');
            const projectsPromise = supabase.from('projects').select('*');
            
            const [reportsRes, teamsRes, typesRes, materialsRes, projectsRes] = await Promise.all([reportsPromise, teamsPromise, typesPromise, materialsPromise, projectsPromise]);

            if (reportsRes.data) setReports(reportsRes.data);
            if (teamsRes.data) setTeams(teamsRes.data as LabourTeam[]);
            if (typesRes.data) setTypes(typesRes.data as LabourType[]);
            if (materialsRes.data) setMaterials(materialsRes.data as Material[]);
            if (projectsRes.data) setProjects(projectsRes.data as Project[]);

            setLoading(false);
        };
        fetchData();
    }, []);

    const selectedProjectName = useMemo(() => {
        if (!selectedReport) return 'N/A';
        return projects.find(p => p.id === selectedReport.project_id)?.name || 'Unknown Project';
    }, [selectedReport, projects]);


    if (loading) {
        return (
            <div className="p-4 lg:p-0 space-y-4">
                <PageHeader title="Work Report History" subtitle="Review past work reports." />
                <SkeletonCard />
                <SkeletonCard />
                <SkeletonCard />
                <SkeletonCard />
            </div>
        );
    }

    return (
        <div className="p-4 lg:p-0 space-y-4">
            <PageHeader title="Work Report History" subtitle="Review past work reports." />

            {reports.length === 0 ? (
                <Card><p className="text-center py-8 text-neutral-500">No work report history found.</p></Card>
            ) : (
                reports.map(report => (
                    <Card key={report.id} onClick={() => setSelectedReport(report)}>
                        <div className="flex justify-between items-center">
                            <div>
                                <p className="font-bold text-lg text-neutral-800">{new Date(report.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                                <p className="text-sm text-neutral-500">{report.work_items.length} work item(s) recorded</p>
                            </div>
                            <ChevronRightIcon className="w-5 h-5 text-neutral-400" />
                        </div>
                    </Card>
                ))
            )}

            <ViewReportModal 
                isOpen={!!selectedReport} 
                onClose={() => setSelectedReport(null)} 
                report={selectedReport}
                teams={teams}
                types={types}
                materials={materials}
                projectName={selectedProjectName}
            />
        </div>
    );
};

export default WorkHistoryPage;
