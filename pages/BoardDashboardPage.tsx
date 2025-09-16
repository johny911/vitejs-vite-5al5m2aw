
import React, { useState, useMemo, useEffect } from 'react';
import Card from '../components/ui/Card';
import { Project, AttendanceRecord, WorkReport, LabourTeam, LabourType, Task } from '../types';
import { UsersIcon, ChevronDownIcon, ChevronRightIcon, RupeeIcon, AlertTriangleIcon, BriefcaseIcon } from '../components/icons';
import DateInput from '../components/ui/DateInput';
import DistributionBar from '../components/charts/DistributionBar';
import PageHeader from '../components/ui/PageHeader';
import { supabase } from '../core/auth/supabase';
import SkeletonCard from '../components/ui/SkeletonCard';

type FilterType = 'today' | 'yesterday' | 'range';

const getDateString = (offset: number = 0): string => {
    const date = new Date();
    date.setDate(date.getDate() + offset);
    return date.toISOString().substring(0, 10);
};

const MetricCard: React.FC<{ icon: React.FC<{className?: string}>, label: string, value: string, color: string }> = ({ icon: Icon, label, value, color }) => (
    <Card className={`flex items-center p-3 sm:p-4`}>
        <div className={`p-3 rounded-lg mr-4 ${color}`}>
            <Icon className="w-6 h-6 text-white" />
        </div>
        <div>
            <p className="font-bold text-2xl text-neutral-800">{value}</p>
            <p className="text-sm text-neutral-500">{label}</p>
        </div>
    </Card>
);

const BoardDashboardPage: React.FC = () => {
    const [filterType, setFilterType] = useState<FilterType>('today');
    const [startDate, setStartDate] = useState(getDateString());
    const [endDate, setEndDate] = useState(getDateString());
    const [expandedProjectId, setExpandedProjectId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    const [projects, setProjects] = useState<Project[]>([]);
    const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
    const [workReports, setWorkReports] = useState<any[]>([]);
    const [labourTeams, setLabourTeams] = useState<LabourTeam[]>([]);
    const [labourTypes, setLabourTypes] = useState<LabourType[]>([]);
    const [tasks, setTasks] = useState<Task[]>([]);

    useEffect(() => {
        const fetchAllData = async () => {
            setLoading(true);
            const projectsPromise = supabase.from('projects').select('*');
            const attendancePromise = supabase.from('attendance_records').select('*');
            const reportsPromise = supabase.from('work_reports').select('*, work_items(*)');
            const teamsPromise = supabase.from('labour_teams').select(`*, team_labour_costs(*, labour_types(*))`);
            const typesPromise = supabase.from('labour_types').select('*');
            const tasksPromise = supabase.from('tasks').select('*');

            const [ projRes, attRes, repRes, teamRes, typeRes, taskRes ] = await Promise.all([
                projectsPromise, attendancePromise, reportsPromise, teamsPromise, typesPromise, tasksPromise
            ]);
            
            if(projRes.data) setProjects(projRes.data as unknown as Project[]);
            if(attRes.data) setAttendance(attRes.data as unknown as AttendanceRecord[]);
            if(repRes.data) setWorkReports(repRes.data);
            if(teamRes.data) {
                const formattedTeams = teamRes.data.map(team => ({
                    id: team.id, name: team.name, workType: team.work_type,
                    types: team.team_labour_costs.map((tlc: any) => ({ typeId: tlc.labour_types.id, cost: tlc.cost }))
                }));
                setLabourTeams(formattedTeams as any);
            }
            if(typeRes.data) setLabourTypes(typeRes.data);
            if(taskRes.data) setTasks(taskRes.data as unknown as Task[]);

            setLoading(false);
        };
        fetchAllData();
    }, []);


    const handleFilterChange = (type: FilterType) => {
        setFilterType(type);
        if (type === 'today') {
            setStartDate(getDateString());
            setEndDate(getDateString());
        } else if (type === 'yesterday') {
            setStartDate(getDateString(-1));
            setEndDate(getDateString(-1));
        }
    };

    const ongoingProjectIds = useMemo(() => projects.filter(p => p.status === 'Ongoing').map(p => p.id), [projects]);
    const overdueTasksCount = useMemo(() => tasks.filter(t => t.status === 'Delayed' && ongoingProjectIds.includes(t.projectId)).length, [tasks, ongoingProjectIds]);

    const projectData = useMemo(() => {
        const start = new Date(startDate);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999); // Include the whole end day

        const filteredAttendance = attendance.filter(rec => {
            const recDate = new Date(rec.date);
            return recDate >= start && recDate <= end;
        });

        const filteredWorkReports = workReports.filter(rep => {
            const repDate = new Date(rep.date);
            return repDate >= start && repDate <= end;
        });

        return projects
            .filter(p => p.status === 'Ongoing')
            .map(project => {
                const projectAttendance = filteredAttendance.filter(rec => rec.projectId === project.id);
                const reports = filteredWorkReports.filter(rep => rep.project_id === project.id);
                const totalLabour = projectAttendance.reduce((sum, rec) => sum + rec.count, 0);
                const nmrCost = projectAttendance.reduce((sum, rec) => {
                    const team = labourTeams.find(t => t.id === rec.teamId);
                    if (team && team.workType === 'NMR') {
                        const typeCost = team.types.find(t => t.typeId === rec.typeId)?.cost || 0;
                        return sum + (rec.count * typeCost);
                    }
                    return sum;
                }, 0);
                const rateWorkCost = reports.flatMap(r => r.work_items).reduce((sum, item) => {
                    if (item.rate && item.quantity) {
                        return sum + (item.rate * item.quantity);
                    }
                    return sum;
                }, 0);
                const totalCost = nmrCost + rateWorkCost;
                return { ...project, totalLabour, totalCost, attendance: projectAttendance, reports };
            });
    }, [startDate, endDate, projects, attendance, workReports, labourTeams]);

    const totalActiveLabour = projectData.reduce((sum, p) => sum + p.totalLabour, 0);
    const totalCostIncurred = projectData.reduce((sum, p) => sum + p.totalCost, 0);
    const ongoingProjectsCount = projectData.length;
    
    const chartColors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#14b8a6'];
    const costDistributionData = projectData.map((p, index) => ({
        label: p.name,
        value: p.totalCost,
        color: chartColors[index % chartColors.length]
    }));

    if (loading) {
        return (
            <div className="p-4 lg:p-0 animate-pulse">
                <div className="h-8 bg-neutral-200 rounded w-1/3 mb-6 hidden lg:block"></div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <div className="h-24 bg-neutral-200 rounded-xl"></div>
                    <div className="h-24 bg-neutral-200 rounded-xl"></div>
                    <div className="h-24 bg-neutral-200 rounded-xl"></div>
                    <div className="h-24 bg-neutral-200 rounded-xl"></div>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-1 space-y-6">
                        <SkeletonCard className="h-40" />
                        <SkeletonCard className="h-48" />
                    </div>
                    <div className="lg:col-span-2 space-y-3">
                        <SkeletonCard className="h-24" />
                        <SkeletonCard className="h-24" />
                        <SkeletonCard className="h-24" />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 lg:p-0 space-y-6">
            <PageHeader title="Company Overview" subtitle="High-level metrics across all sites." />
            
            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard icon={UsersIcon} label="Total Active Labour" value={totalActiveLabour.toString()} color="bg-blue-500" />
                <MetricCard icon={RupeeIcon} label="Total Cost Incurred" value={`₹${totalCostIncurred.toLocaleString()}`} color="bg-green-500" />
                <MetricCard icon={AlertTriangleIcon} label="Overdue Tasks" value={overdueTasksCount.toString()} color="bg-red-500" />
                <MetricCard icon={BriefcaseIcon} label="Ongoing Projects" value={ongoingProjectsCount.toString()} color="bg-purple-500" />
            </section>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 space-y-6">
                     <Card>
                        <h3 className="font-bold text-lg mb-4 text-neutral-700">Select Date Range</h3>
                        <div className="flex space-x-2 mb-3">
                            {([['today', 'Today'], ['yesterday', 'Yesterday'], ['range', 'Range']] as [FilterType, string][]).map(([type, label]) => (
                                <button key={type} onClick={() => handleFilterChange(type)} className={`flex-1 py-2 text-sm font-semibold rounded-md transition-colors ${filterType === type ? 'bg-primary-600 text-white' : 'bg-neutral-200 text-neutral-700'}`}>
                                    {label}
                                </button>
                            ))}
                        </div>
                        {filterType === 'range' && (
                             <div className="grid grid-cols-2 gap-3 animate-fade-in">
                                <DateInput id="start-date" value={startDate} onChange={e => setStartDate(e.target.value)} />
                                <DateInput id="end-date" value={endDate} onChange={e => setEndDate(e.target.value)} />
                            </div>
                        )}
                    </Card>
                     <DistributionBar title="Cost Distribution by Project" data={costDistributionData} totalValue={totalCostIncurred} />
                </div>
                <section className="lg:col-span-2 space-y-3">
                     <h3 className="font-bold text-lg text-neutral-700">Project Details</h3>
                    {projectData.map(project => (
                        <Card key={project.id} className="p-0 overflow-hidden">
                            <button onClick={() => setExpandedProjectId(p => p === project.id ? null : project.id)} className="w-full text-left p-4 flex justify-between items-center">
                                <div>
                                    <h4 className="font-bold">{project.name}</h4>
                                    <p className="text-xs text-neutral-500">{project.location}</p>
                                </div>
                                <div className="flex items-center space-x-4">
                                   <div className="text-right">
                                        <p className="font-bold text-lg">{project.totalLabour}</p>
                                        <p className="text-xs text-neutral-500">Labour</p>
                                   </div>
                                   <div className="text-right">
                                        <p className="font-bold text-lg">₹{project.totalCost.toLocaleString()}</p>
                                        <p className="text-xs text-neutral-500">Cost</p>
                                   </div>
                                   {expandedProjectId === project.id ? <ChevronDownIcon className="w-5 h-5 text-neutral-400" /> : <ChevronRightIcon className="w-5 h-5 text-neutral-400" />}
                                </div>
                            </button>
                            
                            {expandedProjectId === project.id && (
                                <div className="bg-neutral-50 p-4 border-t text-sm space-y-4 animate-fade-in">
                                    <div>
                                        <h5 className="font-semibold mb-2 text-neutral-600">Labour Present</h5>
                                        {project.attendance.length > 0 ? (
                                            <ul className="space-y-1 text-neutral-700">
                                                {project.attendance.map(rec => (
                                                     <li key={rec.id} className="flex justify-between">
                                                        <span>{labourTeams.find(t=>t.id===rec.teamId)?.name} - {labourTypes.find(l=>l.id===rec.typeId)?.name}</span>
                                                        <span className="font-semibold">{rec.count}</span>
                                                     </li>
                                                ))}
                                            </ul>
                                        ) : <p className="text-xs text-neutral-500">No attendance records found.</p>}
                                    </div>
                                    <div>
                                        <h5 className="font-semibold mb-2 text-neutral-600">Work Done & Cost</h5>
                                         {project.reports.flatMap(r => r.work_items).length > 0 ? (
                                            <div className="space-y-2">
                                                {project.reports.flatMap(r => r.work_items).map((item: any) => {
                                                    const itemCost = (item.rate || 0) * (item.quantity || 0);
                                                    return (
                                                    <div key={item.id} className="p-2 border rounded-md bg-white">
                                                        <div className="flex justify-between font-medium">
                                                            <span>{item.description}</span>
                                                             {item.rate && <span className="text-green-700">₹{itemCost.toLocaleString()}</span>}
                                                        </div>
                                                        <p className="text-xs text-neutral-500">{item.quantity} {item.uom}</p>
                                                    </div>
                                                )})}
                                                <div className="flex justify-between pt-2 border-t mt-2">
                                                    <span className="font-semibold">Total Cost</span>
                                                    <span className="font-bold text-primary-700">₹{project.totalCost.toLocaleString()}</span>
                                                </div>
                                            </div>
                                         ) : <p className="text-xs text-neutral-500">No work reports found.</p>}
                                    </div>
                                </div>
                            )}
                        </Card>
                    ))}
                </section>
            </div>
        </div>
    );
};

export default BoardDashboardPage;
