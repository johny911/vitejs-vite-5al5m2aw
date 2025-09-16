
import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Project, LabourTeam, LabourType, AttendanceRecord, Material } from '../types';
import Card from '../components/ui/Card';
import Modal from '../components/ui/Modal';
import Button from '../components/ui/Button';
import { AttendanceIcon, MaterialsIcon, UsersIcon, BoxIcon } from '../components/icons';
import PageHeader from '../components/ui/PageHeader';
import { supabase } from '../core/auth/supabase';

const statusColors: Record<Project['status'], string> = {
    Ongoing: 'bg-blue-100 text-blue-800',
    Completed: 'bg-green-100 text-green-800',
    'On Hold': 'bg-yellow-100 text-yellow-800',
};

type AttendanceSummary = Record<string, Record<string, number>>;
type MaterialUsageSummary = Record<string, { quantity: number; unit: string }>;

// --- Attendance Summary Modal ---
const AttendanceSummaryModal: React.FC<{ isOpen: boolean; onClose: () => void; summary: AttendanceSummary }> = ({ isOpen, onClose, summary }) => {
    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <div className="space-y-4">
                <h3 className="text-xl font-bold">Total Attendance Summary</h3>
                <div className="border-t pt-4">
                    <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                        {Object.keys(summary).length > 0 ? Object.entries(summary).map(([teamName, types]) => (
                            <div key={teamName} className="p-3 bg-neutral-50 rounded-lg">
                                <p className="font-semibold text-primary-700 flex items-center"><UsersIcon className="w-5 h-5 mr-2" />{teamName}</p>
                                <div className="pl-4 mt-2 text-sm text-neutral-700 space-y-1">
                                    {Object.entries(types).map(([typeName, count]) => (
                                        <div key={typeName} className="flex justify-between">
                                            <span>{typeName}</span>
                                            <span className="font-bold">{count}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )) : <p className="text-neutral-500 text-center py-4">No attendance records for this project.</p>}
                    </div>
                </div>
                <Button onClick={onClose} fullWidth variant="secondary" className="mt-2">Close</Button>
            </div>
        </Modal>
    );
};

// --- Materials Usage Modal ---
const MaterialsUsageModal: React.FC<{ isOpen: boolean; onClose: () => void; summary: MaterialUsageSummary }> = ({ isOpen, onClose, summary }) => {
    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <div className="space-y-4">
                <h3 className="text-xl font-bold">Total Materials Usage</h3>
                <div className="border-t pt-4">
                    <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-2">
                        {Object.keys(summary).length > 0 ? Object.entries(summary).map(([materialName, data]) => (
                            <div key={materialName} className="flex justify-between items-center text-sm p-3 bg-neutral-50 rounded-lg">
                                <div className="flex items-center text-neutral-700">
                                    <BoxIcon className="w-5 h-5 mr-3 text-primary-600"/>
                                    <span>{materialName}</span>
                                </div>
                                <span className="font-bold">{data.quantity.toLocaleString()} {data.unit}</span>
                            </div>
                        )) : <p className="text-neutral-500 text-center py-4">No materials consumed for this project.</p>}
                    </div>
                </div>
                <Button onClick={onClose} fullWidth variant="secondary" className="mt-2">Close</Button>
            </div>
        </Modal>
    );
};


// --- Main Page Component ---
const BoardProjectDetailPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [project, setProject] = useState<Project | null>(null);
    const [loading, setLoading] = useState(true);
    const [attendanceSummary, setAttendanceSummary] = useState<AttendanceSummary>({});
    const [materialsSummary, setMaterialsSummary] = useState<MaterialUsageSummary>({});

    const [isAttendanceModalOpen, setAttendanceModalOpen] = useState(false);
    const [isMaterialsModalOpen, setMaterialsModalOpen] = useState(false);

    useEffect(() => {
        if (!id) return;
        const fetchData = async () => {
            setLoading(true);
            
            const { data: projectData } = await supabase.from('projects').select('*').eq('id', id).single();
            if(!projectData) {
                setLoading(false);
                return;
            }
            setProject(projectData as unknown as Project);
            
            // Fetch and compute attendance summary
            const { data: attendanceData } = await supabase.from('attendance_records')
                .select('count, labour_teams(name), labour_types(name)')
                .eq('project_id', id);
            
            if (attendanceData) {
                const summary = (attendanceData as any).reduce((acc: any, record: any) => {
                    const teamName = record.labour_teams.name;
                    const typeName = record.labour_types.name;
                    if (!acc[teamName]) acc[teamName] = {};
                    if (!acc[teamName][typeName]) acc[teamName][typeName] = 0;
                    acc[teamName][typeName] += record.count;
                    return acc;
                }, {});
                setAttendanceSummary(summary);
            }

            // Fetch and compute materials summary
            const { data: usageData } = await supabase.from('material_consumptions')
                .select('quantity, materials(name, unit)')
                .eq('work_items.work_reports.project_id', id);

            if(usageData) {
                const summary = (usageData as any).reduce((acc: any, record: any) => {
                    const matName = record.materials.name;
                    if(!acc[matName]) acc[matName] = { quantity: 0, unit: record.materials.unit };
                    acc[matName].quantity += record.quantity;
                    return acc;
                }, {});
                setMaterialsSummary(summary);
            }

            setLoading(false);
        }
        fetchData();
    }, [id]);

    if (loading) {
        return <div className="p-4 text-center">Loading project overview...</div>;
    }
    
    if (!project) {
        return (
            <div className="p-4 lg:p-0 text-center">
                <p>Project not found.</p>
                <button onClick={() => navigate(-1)} className="text-primary-600 mt-4">Go Back</button>
            </div>
        );
    }

    return (
        <div className="p-4 lg:p-0 space-y-6">
            <PageHeader title={project.name} subtitle={project.location} />
            <AttendanceSummaryModal isOpen={isAttendanceModalOpen} onClose={() => setAttendanceModalOpen(false)} summary={attendanceSummary} />
            <MaterialsUsageModal isOpen={isMaterialsModalOpen} onClose={() => setMaterialsModalOpen(false)} summary={materialsSummary} />

            <Card>
                <div className="flex justify-between items-start mb-4">
                    <div className="lg:hidden">
                         <h2 className="text-2xl font-bold">{project.name}</h2>
                         <p className="text-neutral-500">{project.location}</p>
                    </div>
                    <span className={`text-sm font-bold px-3 py-1.5 rounded-full ${statusColors[project.status]}`}>
                        {project.status}
                    </span>
                </div>
                <div className="border-t border-neutral-200 pt-4">
                    <h3 className="text-sm font-semibold text-neutral-500">Project Start Date</h3>
                    <p className="text-lg font-bold text-neutral-800">{project.startDate ? new Date(project.startDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Not specified'}</p>
                </div>
            </Card>
            

            <div className="space-y-3">
                 <h3 className="text-lg font-bold text-neutral-700">Project Summaries</h3>
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Button fullWidth variant="secondary" onClick={() => setAttendanceModalOpen(true)} className="justify-start text-base py-4">
                         <AttendanceIcon className="w-6 h-6 mr-3 text-primary-600"/> View Total Attendance
                     </Button>
                     <Button fullWidth variant="secondary" onClick={() => setMaterialsModalOpen(true)} className="justify-start text-base py-4">
                         <MaterialsIcon className="w-6 h-6 mr-3 text-primary-600"/> View Materials Usage
                     </Button>
                 </div>
            </div>
        </div>
    );
};

export default BoardProjectDetailPage;
