
import React, { useState, useMemo, useEffect } from 'react';
import { WorkItem, LabourAllocation, MaterialConsumption, Material, Project, LabourTeam, LabourType, AttendanceRecord, WorkReport } from '../types';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Select from '../components/ui/Select';
import DateInput from '../components/ui/DateInput';
import Input from '../components/ui/Input';
import Stepper from '../components/ui/Stepper';
import { PlusIcon, TrashIcon, BoxIcon, UsersIcon, CheckCircleIcon, XCircleIcon, WorkIcon, EditIcon, FileTextIcon, HistoryIcon } from '../components/icons';
import PageHeader from '../components/ui/PageHeader';
import { supabase } from '../lib/supabase';
import ViewReportModal from '../components/modals/ViewReportModal';
import { useNavigate } from 'react-router-dom';

type WorkPageMode = 'new' | 'existing' | 'editing';

// --- EXISTING REPORT VIEW ---
const ExistingReportView: React.FC<{
    report: any;
    onEdit: () => void;
    onView: () => void;
    onReset: () => void;
}> = ({ report, onEdit, onView, onReset }) => (
    <Card>
        <h3 className="text-lg font-bold text-neutral-700">Work Report Submitted</h3>
        <p className="text-sm text-neutral-500 mb-4">A work report for this project and date already exists with {report.work_items.length} item(s).</p>
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Button onClick={onView} variant="secondary">
                <FileTextIcon className="w-4 h-4 mr-2"/> View Report
            </Button>
            <Button onClick={onEdit} variant="primary">
                <EditIcon className="w-4 h-4 mr-2"/> Edit Report
            </Button>
        </div>
        <Button onClick={onReset} fullWidth className="mt-3">Create for Another Date</Button>
    </Card>
);

const WorkPage: React.FC = () => {
    const [selectedProjectId, setSelectedProjectId] = useState<string>('');
    const [date, setDate] = useState(new Date().toISOString().substring(0, 10));
    const [workItems, setWorkItems] = useState<WorkItem[]>([]);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [loading, setLoading] = useState(true);

    // Data from Supabase
    const [projects, setProjects] = useState<Project[]>([]);
    const [labourTeams, setLabourTeams] = useState<LabourTeam[]>([]);
    const [allLabourTypes, setAllLabourTypes] = useState<LabourType[]>([]);
    const [materials, setMaterials] = useState<Material[]>([]);
    const [availableLabour, setAvailableLabour] = useState<any[]>([]);
    
    // New state management
    const [mode, setMode] = useState<WorkPageMode>('new');
    const [isChecking, setIsChecking] = useState(false);
    const [existingReport, setExistingReport] = useState<any | null>(null);
    const [isViewModalOpen, setViewModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchInitialData = async () => {
            setLoading(true);
            const projectsPromise = supabase.from('projects').select('*').eq('status', 'Ongoing');
            const teamsPromise = supabase.from('labour_teams').select(`*, team_labour_costs(*, labour_types(*))`);
            const typesPromise = supabase.from('labour_types').select('*');
            const materialsPromise = supabase.from('materials').select('*');

            const [projectsRes, teamsRes, typesRes, materialsRes] = await Promise.all([projectsPromise, teamsPromise, typesPromise, materialsPromise]);

            if (projectsRes.data) setProjects(projectsRes.data as unknown as Project[]);
            if (teamsRes.data) {
                 const formattedTeams = teamsRes.data.map(team => ({
                    id: team.id, name: team.name, workType: team.work_type,
                    types: team.team_labour_costs.map((tlc: any) => ({ typeId: tlc.labour_types.id, cost: tlc.cost }))
                }));
                setLabourTeams(formattedTeams as any);
            }
            if (typesRes.data) setAllLabourTypes(typesRes.data);
            if (materialsRes.data) setMaterials(materialsRes.data);
            setLoading(false);
        };
        fetchInitialData();
    }, []);

    useEffect(() => {
        const checkAndFetchData = async () => {
            if (!selectedProjectId || !date) {
                setAvailableLabour([]);
                setMode('new');
                setExistingReport(null);
                setWorkItems([]);
                return;
            }
            setIsChecking(true);

            // Fetch attendance
            const { data: attendanceData } = await supabase.from('attendance_records')
                .select('*, labour_teams(name), labour_types(name)')
                .eq('project_id', selectedProjectId)
                .eq('date', date);
            if(attendanceData) setAvailableLabour(attendanceData as any);

            // Check for existing work report
            const { data: reportData, error: reportError } = await supabase
                .from('work_reports')
                .select('*, work_items(*, labour_allocations(*), material_consumptions(*))')
                .eq('project_id', selectedProjectId)
                .eq('date', date)
                .maybeSingle(); // Use maybeSingle to get one or null

            if (reportData) {
                setExistingReport(reportData);
                setMode('existing');
            } else {
                setExistingReport(null);
                setMode('new');
            }

            setWorkItems([]); // Reset form on any change
            setIsChecking(false);
        };
        checkAndFetchData();
    }, [selectedProjectId, date]);


    const selectedProjectName = useMemo(() => {
        if (!existingReport) return 'N/A';
        return projects.find(p => p.id === existingReport.project_id)?.name || 'Unknown Project';
    }, [existingReport, projects]);

    const allocatedLabour = useMemo(() => {
        const allocationsMap = new Map<string, number>();
        for (const item of workItems) {
            for (const alloc of item.allocations) {
                const key = `${alloc.teamId}-${alloc.typeId}`;
                const currentCount = allocationsMap.get(key) || 0;
                allocationsMap.set(key, currentCount + alloc.count);
            }
        }
        return allocationsMap;
    }, [workItems]);

    const isAllocationComplete = useMemo(() => {
        if (availableLabour.length === 0 && workItems.some(wi => wi.allocations.length > 0)) return false;
        if (availableLabour.length > 0 && workItems.length === 0) return false;
        if (availableLabour.length === 0 && workItems.length === 0) return true;
        
        for (const labour of availableLabour) {
            const key = `${labour.team_id}-${labour.type_id}`;
            if ((allocatedLabour.get(key) || 0) !== labour.count) {
                return false;
            }
        }
        return true;
    }, [availableLabour, allocatedLabour, workItems]);
    
    // --- Handlers ---
    const handleEdit = () => {
        if (!existingReport) return;
        const loadedWorkItems = existingReport.work_items.map((item: any) => ({
            id: item.id,
            description: item.description,
            quantity: item.quantity,
            uom: item.uom,
            rate: item.rate,
            allocations: item.labour_allocations.map((alloc: any) => ({
                id: alloc.id,
                teamId: alloc.team_id,
                typeId: alloc.type_id,
                count: alloc.count,
            })),
            materialsConsumed: item.material_consumptions.map((mat: any) => ({
                id: mat.id,
                materialId: mat.material_id,
                quantity: mat.quantity,
            })),
        }));
        setWorkItems(loadedWorkItems);
        setMode('editing');
    };

    const handleAddWorkItem = () => {
        const newItem: WorkItem = { id: `wi-${Date.now()}`, description: '', quantity: 0, uom: '', rate: 0, allocations: [], materialsConsumed: [] };
        setWorkItems([...workItems, newItem]);
    };

    const handleRemoveWorkItem = (id: string) => setWorkItems(workItems.filter(item => item.id !== id));
    const handleWorkItemChange = (id: string, field: keyof WorkItem, value: any) => setWorkItems(workItems.map(item => item.id === id ? { ...item, [field]: value } : item));
    const handleAddAllocation = (workItemId: string) => {
        const newAlloc: LabourAllocation = { id: `la-${Date.now()}`, teamId: '', typeId: '', count: 1 };
        setWorkItems(workItems.map(item => item.id === workItemId ? { ...item, allocations: [...item.allocations, newAlloc] } : item ));
    };
    const handleRemoveAllocation = (workItemId: string, allocId: string) => setWorkItems(workItems.map(item => item.id === workItemId ? { ...item, allocations: item.allocations.filter(a => a.id !== allocId) } : item ));
    const handleAllocationChange = (workItemId: string, allocId: string, field: keyof LabourAllocation, value: any) => {
        setWorkItems(workItems.map(item => item.id === workItemId ? { ...item, allocations: item.allocations.map(a => a.id === allocId ? { ...a, [field]: value, ...(field === 'teamId' && { typeId: '', count: 1 }) } : a ) } : item ));
    };
    const handleAddMaterial = (workItemId: string) => {
        const newMaterial: MaterialConsumption = { id: `mc-${Date.now()}`, materialId: '', quantity: 1 };
        setWorkItems(workItems.map(item => item.id === workItemId ? { ...item, materialsConsumed: [...item.materialsConsumed, newMaterial] } : item ));
    };
    const handleRemoveMaterial = (workItemId: string, materialId: string) => setWorkItems(workItems.map(item => item.id === workItemId ? { ...item, materialsConsumed: item.materialsConsumed.filter(m => m.id !== materialId) } : item ));
    const handleMaterialChange = (workItemId: string, materialId: string, field: keyof MaterialConsumption, value: any) => {
        setWorkItems(workItems.map(item => item.id === workItemId ? { ...item, materialsConsumed: item.materialsConsumed.map(m => m.id === materialId ? { ...m, [field]: value } : m ) } : item ));
    };
    
    const handleSubmit = async () => {
        if (isSubmitting) return;
        setIsSubmitting(true);
        try {
            let reportId = existingReport?.id;
            
            if (mode === 'editing' && reportId) {
                await supabase.from('work_items').delete().eq('report_id', reportId);
            } else {
                const { data: reportData, error: reportError } = await supabase
                    .from('work_reports').insert({ project_id: selectedProjectId, date: date }).select().single();
                if (reportError) throw reportError;
                reportId = reportData.id;
            }

            if (!reportId) throw new Error("Could not create or find a report to attach items to.");

            for (const item of workItems) {
                const { data: itemData, error: itemError } = await supabase.from('work_items')
                    .insert({ report_id: reportId, description: item.description, quantity: item.quantity, uom: item.uom, rate: item.rate }).select().single();
                if (itemError) throw itemError;
                const workItemId = itemData.id;

                if (item.allocations.length > 0) {
                    const allocationsToInsert = item.allocations.map(alloc => ({ work_item_id: workItemId, team_id: alloc.teamId, type_id: alloc.typeId, count: alloc.count, }));
                    const { error: allocError } = await supabase.from('labour_allocations').insert(allocationsToInsert);
                    if (allocError) throw allocError;
                }
                if (item.materialsConsumed.length > 0) {
                    const consumptionsToInsert = item.materialsConsumed.map(mat => ({ work_item_id: workItemId, material_id: mat.materialId, quantity: mat.quantity, }));
                    const { error: consError } = await supabase.from('material_consumptions').insert(consumptionsToInsert);
                    if (consError) throw consError;
                    
                    for (const mat of item.materialsConsumed) {
                         const { data: material } = await supabase.from('materials').select('current_stock').eq('id', mat.materialId).single();
                         if(material) {
                            await supabase.from('materials').update({ current_stock: material.current_stock - mat.quantity }).eq('id', mat.materialId);
                            await supabase.from('material_transactions').insert({ material_id: mat.materialId, type: 'out', quantity: mat.quantity, date: date, description: `Used in: ${item.description || 'Work Report'}` });
                         }
                    }
                }
            }
             setIsSubmitted(true);
        } catch (error: any) {
            console.error("Error submitting work report:", error);
            alert(`Failed to submit report: ${error.message}`);
        } finally {
            setIsSubmitting(false);
        }
    };
    
    if (loading) return <div className="p-4 text-center">Loading...</div>;

    if (isSubmitted) {
        return (
            <div className="p-4 lg:p-0 h-full flex items-center justify-center">
                 <Card className="w-full max-w-lg text-center">
                    <div className="mx-auto bg-green-100 rounded-full w-20 h-20 flex items-center justify-center">
                        <CheckCircleIcon className="w-12 h-12 text-green-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-neutral-800 mt-4">Work Report Submitted!</h2>
                    <p className="mt-2 text-neutral-600">The report has been saved and material stock has been updated.</p>
                    <Button onClick={() => { setIsSubmitted(false); setWorkItems([]); setSelectedProjectId(''); setMode('new'); setDate(new Date().toISOString().substring(0,10)) }} fullWidth className="mt-6">Create Another Report</Button>
                 </Card>
            </div>
        );
    }
    
    return (
        <div className="p-4 lg:p-0 pb-6">
             <PageHeader title="Create Work Report" subtitle="Record work done, allocate labour, and track material consumption.">
                <Button variant="secondary" onClick={() => navigate('/work/history')}>
                    <HistoryIcon className="w-5 h-5 mr-2" />
                    View History
                </Button>
             </PageHeader>
             <ViewReportModal 
                isOpen={isViewModalOpen} 
                onClose={() => setViewModalOpen(false)} 
                report={existingReport}
                teams={labourTeams}
                types={allLabourTypes}
                materials={materials}
                projectName={selectedProjectName}
            />

            <div className="lg:hidden mb-4">
                <Button fullWidth variant="secondary" onClick={() => navigate('/work/history')}>
                    <HistoryIcon className="w-4 h-4 mr-2" />
                    View Work Report History
                </Button>
            </div>

             <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 space-y-6">
                    <Card>
                        <h3 className="font-bold text-lg mb-4 text-neutral-700">1. Setup</h3>
                        <div className="space-y-4">
                            <Select id="project" label="Project" value={selectedProjectId} onChange={e => setSelectedProjectId(e.target.value)}>
                                <option value="" disabled>Select a project</option>
                                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </Select>
                            <DateInput id="date" label="Date" value={date} onChange={e => setDate(e.target.value)} />
                        </div>
                    </Card>

                    {selectedProjectId && (mode === 'new' || mode === 'editing') && (
                        <Card>
                            <h3 className="font-bold text-lg mb-2 text-neutral-700">Available Labour Today</h3>
                            {availableLabour.length > 0 ? (
                                <ul className="text-sm text-neutral-600 space-y-1">
                                    {availableLabour.map((record) => (
                                        <li key={`${record.team_id}-${record.type_id}`} className="flex justify-between items-center p-2 bg-neutral-100 rounded-md">
                                            <span>{record.labour_teams.name} - {record.labour_types.name}</span>
                                            <span className="font-bold bg-white px-2 py-0.5 rounded">{record.count}</span>
                                        </li>
                                    ))}
                                </ul>
                            ) : <p className="text-neutral-500 text-sm text-center py-2">No attendance data found for this day.</p>}
                        </Card>
                    )}
                </div>

                <div className="lg:col-span-2 space-y-4">
                     {selectedProjectId && (
                        <>
                             <h3 className="hidden lg:block font-bold text-lg text-neutral-700">2. Record Work Items</h3>
                             {isChecking ? (
                                <Card><p className="text-center text-neutral-500 py-4">Checking for existing report...</p></Card>
                            ) : mode === 'existing' ? (
                                <ExistingReportView 
                                    report={existingReport} 
                                    onEdit={handleEdit} 
                                    onView={() => setViewModalOpen(true)}
                                    onReset={() => { setMode('new'); setSelectedProjectId(''); setDate(new Date().toISOString().substring(0, 10)); }}
                                />
                            ) : (
                                <>
                                    {workItems.map((item, index) => {
                                        const allocatedTeamIds = item.allocations.map(a => a.teamId);
                                        const involvesRateWork = allocatedTeamIds.some(teamId => labourTeams.find(t => t.id === teamId)?.workType === 'Rate Work');

                                        return (
                                        <Card key={item.id}>
                                             <div className="flex justify-between items-center mb-4">
                                               <h4 className="font-bold text-lg text-neutral-700 flex items-center"><WorkIcon className="w-5 h-5 mr-2 text-primary-600"/>Work Item #{index + 1}</h4>
                                               <button onClick={() => handleRemoveWorkItem(item.id)} className="text-neutral-500 hover:text-red-600 p-1 rounded-full hover:bg-red-50"><TrashIcon className="w-5 h-5"/></button>
                                            </div>
                                            <div className="space-y-3">
                                                <Input id={`desc-${item.id}`} label="Work Description" value={item.description} onChange={e => handleWorkItemChange(item.id, 'description', e.target.value)} />
                                                <div className="flex space-x-2">
                                                    <Input id={`qty-${item.id}`} label="Quantity" type="number" value={item.quantity} onChange={e => handleWorkItemChange(item.id, 'quantity', parseFloat(e.target.value) || 0)} />
                                                    <Input id={`uom-${item.id}`} label="UOM" value={item.uom} onChange={e => handleWorkItemChange(item.id, 'uom', e.target.value)} />
                                                </div>
                                                {involvesRateWork && <Input id={`rate-${item.id}`} label="Rate per UOM" type="number" value={item.rate || ''} onChange={e => handleWorkItemChange(item.id, 'rate', parseFloat(e.target.value) || 0)} placeholder="Enter cost per UOM"/> }
                                                
                                                <div className="pt-2 space-y-2">
                                                    <h5 className="font-semibold text-sm text-neutral-700 flex items-center"><UsersIcon className="w-4 h-4 mr-2"/>Allotted Labour</h5>
                                                    {item.allocations.map(alloc => {
                                                        const totalAvailableForType = availableLabour.find(l => l.team_id === alloc.teamId && l.type_id === alloc.typeId)?.count || 0;
                                                        const totalAllocatedForType = (allocatedLabour.get(`${alloc.teamId}-${alloc.typeId}`) || 0);
                                                        const remainingForType = totalAvailableForType - totalAllocatedForType;
                                                        const maxForThisStepper = alloc.count + remainingForType;
                                                        const teamData = labourTeams.find(t => t.id === alloc.teamId);

                                                        return (
                                                            <div key={alloc.id} className="p-3 border rounded-lg bg-neutral-50 space-y-3">
                                                                <div className="flex justify-between items-start">
                                                                    <div className="flex-grow pr-2">
                                                                        <Select label="Team" id={`team-${alloc.id}`} value={alloc.teamId} onChange={e => handleAllocationChange(item.id, alloc.id, 'teamId', e.target.value)}><option value="" disabled>Select team</option>{availableLabour.map(l => l.team_id).filter((v, i, a) => a.indexOf(v) === i).map(teamId => <option key={teamId} value={teamId}>{availableLabour.find(l => l.team_id === teamId)?.labour_teams.name}</option>)}</Select>
                                                                        {teamData && (<div className="text-left mt-1"><span className={`text-xs font-bold px-2 py-0.5 rounded-full ${teamData.workType === 'NMR' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}>{teamData.workType}</span></div>)}
                                                                    </div>
                                                                    <button onClick={() => handleRemoveAllocation(item.id, alloc.id)} className="text-neutral-400 hover:text-red-500 flex-shrink-0 p-1 rounded-full hover:bg-red-50"><TrashIcon className="w-5 h-5" /></button>
                                                                </div>

                                                                <div className="flex items-end space-x-2">
                                                                    <div className="flex-grow"><Select label="Type" id={`type-${alloc.id}`} value={alloc.typeId} onChange={e => handleAllocationChange(item.id, alloc.id, 'typeId', e.target.value)} disabled={!alloc.teamId}><option value="" disabled>Select type</option>{availableLabour.filter(l => l.team_id === alloc.teamId).map(l => <option key={l.type_id} value={l.type_id}>{l.labour_types.name}</option>)}</Select></div>
                                                                    <div className="flex flex-col items-center"><label className="text-sm font-medium text-neutral-700 mb-1">Count</label><Stepper value={alloc.count} onChange={val => handleAllocationChange(item.id, alloc.id, 'count', val)} max={maxForThisStepper} />{alloc.typeId && (<p className={`text-xs mt-1 font-semibold ${remainingForType < 0 ? 'text-red-600' : 'text-neutral-500'}`}>{remainingForType} left</p>)}</div>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                    <Button variant="secondary" onClick={() => handleAddAllocation(item.id)} fullWidth disabled={availableLabour.length === 0}><PlusIcon className="w-4 h-4 mr-2" /> Allocate Labour</Button>
                                                </div>
                                                <div className="pt-2 space-y-2">
                                                    <h5 className="font-semibold text-sm text-neutral-700 flex items-center"><BoxIcon className="w-4 h-4 mr-2" />Materials Consumed</h5>
                                                    {item.materialsConsumed.map(mat => {
                                                        const selectedMaterial = materials.find(m => m.id === mat.materialId);
                                                        return (
                                                        <div key={mat.id} className="p-3 border rounded-lg bg-neutral-50 flex items-end space-x-2">
                                                            <div className="flex-grow space-y-1">
                                                                <Select label="Material" id={`mat-select-${mat.id}`} value={mat.materialId} onChange={e => handleMaterialChange(item.id, mat.id, 'materialId', e.target.value)}><option value="" disabled>Select material</option>{materials.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}</Select>
                                                                 {selectedMaterial && <p className="text-xs text-neutral-500 pl-1">In Stock: {selectedMaterial.currentStock} {selectedMaterial.unit}</p>}
                                                            </div>
                                                             <div className="flex flex-col items-center">
                                                                <label className="text-sm font-medium text-neutral-700 mb-1">Qty</label>
                                                                <Stepper value={mat.quantity} onChange={val => handleMaterialChange(item.id, mat.id, 'quantity', val)} max={selectedMaterial?.currentStock} />
                                                            </div>
                                                            <button onClick={() => handleRemoveMaterial(item.id, mat.id)} className="text-neutral-400 hover:text-red-500 flex-shrink-0 p-1 rounded-full hover:bg-red-50"><TrashIcon className="w-5 h-5" /></button>
                                                        </div>
                                                    )})}
                                                    <Button variant="secondary" onClick={() => handleAddMaterial(item.id)} fullWidth><PlusIcon className="w-4 h-4 mr-2" /> Add Material</Button>
                                                </div>
                                            </div>
                                        </Card>
                                    )})}
                                    <Button fullWidth variant="primary" onClick={handleAddWorkItem} className="bg-opacity-90"><PlusIcon className="w-5 h-5 mr-2" /> Add Work Item</Button>
                                </>
                             )}
                        </>
                    )}
                </div>
             </div>
             
             {selectedProjectId && (mode === 'new' || mode === 'editing') && workItems.length > 0 &&
                <div className="mt-6">
                    <Card>
                        <h3 className="font-bold text-lg mb-2 text-neutral-700">Allocation Summary</h3>
                        {availableLabour.length > 0 ? 
                            <ul className="text-sm space-y-2">
                                {availableLabour.map((labour) => {
                                    const key = `${labour.team_id}-${labour.type_id}`;
                                    const allocated = allocatedLabour.get(key) || 0;
                                    const isMatch = allocated === labour.count;
                                    return (
                                    <li key={key} className={`flex items-center p-2 rounded-md ${isMatch ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                                        {isMatch ? <CheckCircleIcon className="w-5 h-5 mr-2"/> : <XCircleIcon className="w-5 h-5 mr-2"/>}
                                        <span className="flex-grow">{labour.labour_teams.name} - {labour.labour_types.name}</span>
                                        <span className="font-bold">{allocated} / {labour.count}</span>
                                    </li>
                                )})}
                            </ul>
                            : <p className="text-xs text-center text-neutral-500">No attendance data to allocate.</p>
                        }
                        <Button fullWidth className="mt-6" onClick={handleSubmit} disabled={!isAllocationComplete || workItems.length === 0 || isSubmitting}>
                           {isSubmitting ? 'Submitting...' : (mode === 'editing' ? 'Update Work Report' : 'Submit Work Report')}
                        </Button>
                        {!isAllocationComplete && <p className="text-xs text-center text-red-600 mt-2">You must allocate all available labour before submitting.</p>}
                    </Card>
                </div>
            }
        </div>
    );
};

export default WorkPage;
