
import React, { useState, useEffect } from 'react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { PlusIcon, DownloadIcon, TrashIcon, CalendarCheckIcon, UsersIcon, EditIcon, HistoryIcon } from '../components/icons';
import Select from '../components/ui/Select';
import DateInput from '../components/ui/DateInput';
import Stepper from '../components/ui/Stepper';
import { AttendanceRecord, Project, LabourTeam, LabourType } from '../types';
import PageHeader from '../components/ui/PageHeader';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import SkeletonCard from '../components/ui/SkeletonCard';

// --- COMPONENT-SPECIFIC TYPES ---
interface SelectedLabour {
  id: string;
  typeId: string;
  shifts: number;
}

interface SelectedTeam {
  id: string;
  teamId: string;
  labour: SelectedLabour[];
}

type AttendanceMode = 'new' | 'existing' | 'editing';

// --- HELPER COMPONENT FOR EXISTING RECORDS ---
const ExistingAttendanceView: React.FC<{
    records: AttendanceRecord[];
    onEdit: () => void;
    onReset: () => void;
    labourTeams: LabourTeam[];
    allLabourTypes: LabourType[];
}> = ({ records, onEdit, onReset, labourTeams, allLabourTypes }) => {
    
    const summary = records.reduce((acc, record) => {
        const teamName = labourTeams.find(t => t.id === record.teamId)?.name || 'Unknown Team';
        const typeName = allLabourTypes.find(t => t.id === record.typeId)?.name || 'Unknown Type';
        if (!acc[teamName]) {
            acc[teamName] = [];
        }
        acc[teamName].push({ typeName, count: record.count });
        return acc;
    }, {} as Record<string, { typeName: string, count: number }[]>);

    return (
        <Card>
            <h3 className="text-lg font-bold text-neutral-700">Attendance Already Submitted</h3>
            <p className="text-sm text-neutral-500 mb-4">An attendance record for this project and date already exists.</p>
            
            <div className="space-y-3 max-h-60 overflow-y-auto p-3 bg-neutral-100 rounded-lg">
                {Object.entries(summary).map(([teamName, types]) => (
                    <div key={teamName}>
                        <p className="font-semibold text-primary-700 flex items-center"><UsersIcon className="w-4 h-4 mr-2"/>{teamName}</p>
                        <div className="pl-6 text-sm">
                            {types.map(t => (
                                <div key={t.typeName} className="flex justify-between">
                                    <span>{t.typeName}</span>
                                    <span className="font-bold">{t.count}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Button onClick={onEdit} variant="primary">
                    <EditIcon className="w-4 h-4 mr-2"/> Edit Attendance
                </Button>
                <Button onClick={onReset} variant="secondary">Mark for Another Date</Button>
            </div>
        </Card>
    );
};


const AttendancePage: React.FC = () => {
    const [selectedProjectId, setSelectedProjectId] = useState<string>('');
    const [date, setDate] = useState(new Date().toISOString().substring(0, 10));
    const [teams, setTeams] = useState<SelectedTeam[]>([]);
    const [submitted, setSubmitted] = useState(false);
    
    // Data states
    const [loading, setLoading] = useState(true);
    const [projects, setProjects] = useState<Project[]>([]);
    const [labourTeams, setLabourTeams] = useState<LabourTeam[]>([]);
    const [allLabourTypes, setAllLabourTypes] = useState<LabourType[]>([]);

    // Create/Update flow states
    const [mode, setMode] = useState<AttendanceMode>('new');
    const [existingRecords, setExistingRecords] = useState<AttendanceRecord[]>([]);
    const [isChecking, setIsChecking] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const navigate = useNavigate();

    // Initial data fetch for dropdowns
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            const projectsPromise = supabase.from('projects').select('*').eq('status', 'Ongoing');
            const teamsPromise = supabase.from('labour_teams').select(`*, team_labour_costs(*, labour_types(*))`);
            const typesPromise = supabase.from('labour_types').select('*');

            const [projectsRes, teamsRes, typesRes] = await Promise.all([projectsPromise, teamsPromise, typesPromise]);

            if (projectsRes.data) setProjects(projectsRes.data as unknown as Project[]);
            if (teamsRes.data) {
                const formattedTeams = teamsRes.data.map(team => ({
                    id: team.id,
                    name: team.name,
                    workType: team.work_type,
                    types: team.team_labour_costs.map((tlc: any) => ({
                        typeId: tlc.labour_types.id,
                        cost: tlc.cost
                    }))
                }));
                setLabourTeams(formattedTeams as unknown as LabourTeam[]);
            }
            if (typesRes.data) setAllLabourTypes(typesRes.data);
            
            setLoading(false);
        };
        fetchData();
    }, []);

    // Effect to check for existing records when project/date changes
    useEffect(() => {
        const checkForExistingRecords = async () => {
            if (!selectedProjectId || !date) {
                setMode('new');
                setTeams([]);
                setExistingRecords([]);
                return;
            }

            setIsChecking(true);
            const { data, error } = await supabase
                .from('attendance_records')
                .select('*')
                .eq('project_id', selectedProjectId)
                .eq('date', date);
            
            if (error) {
                alert("Error checking for existing records.");
                console.error(error);
                setMode('new');
            } else if (data && data.length > 0) {
                const formattedRecords: AttendanceRecord[] = data.map((record: any) => ({
                    id: record.id,
                    projectId: record.project_id,
                    date: record.date,
                    teamId: record.team_id,
                    typeId: record.type_id,
                    count: record.count,
                }));
                setExistingRecords(formattedRecords);
                setMode('existing');
            } else {
                setMode('new');
                setExistingRecords([]);
            }
            
            setTeams([]); // Reset form state on any date/project change
            setIsChecking(false);
        };

        checkForExistingRecords();
    }, [selectedProjectId, date]);

    // --- EVENT HANDLERS ---
    const handleEdit = () => {
        const teamsMap = new Map<string, SelectedTeam>();
        existingRecords.forEach(record => {
            if (!teamsMap.has(record.teamId)) {
                teamsMap.set(record.teamId, {
                    id: `team-${record.teamId}-${Date.now()}`,
                    teamId: record.teamId,
                    labour: []
                });
            }
            const team = teamsMap.get(record.teamId)!;
            team.labour.push({
                id: `labour-${record.id}`,
                typeId: record.typeId,
                shifts: record.count
            });
        });
        setTeams(Array.from(teamsMap.values()));
        setMode('editing');
    };

    const handleAddTeam = () => {
        const newTeam: SelectedTeam = { id: `team-${Date.now()}`, teamId: '', labour: [] };
        setTeams(currentTeams => [...currentTeams, newTeam]);
    };

    const handleRemoveTeam = (teamIdToRemove: string) => {
        setTeams(currentTeams => currentTeams.filter(team => team.id !== teamIdToRemove));
    };
    
    const handleTeamSelectionChange = (teamIdToUpdate: string, newSelectedTeamId: string) => {
         setTeams(currentTeams => currentTeams.map(team => 
            team.id === teamIdToUpdate ? { ...team, teamId: newSelectedTeamId, labour: [] } : team
        ));
    };

    const handleAddLabour = (teamId: string) => {
        const newLabour: SelectedLabour = { id: `labour-${Date.now()}`, typeId: '', shifts: 1 };
        setTeams(currentTeams => currentTeams.map(team =>
            team.id === teamId ? { ...team, labour: [...team.labour, newLabour] } : team
        ));
    };
    
    const handleRemoveLabour = (teamId: string, labourIdToRemove: string) => {
        setTeams(currentTeams => currentTeams.map(team => 
            team.id === teamId ? { ...team, labour: team.labour.filter(l => l.id !== labourIdToRemove) } : team
        ));
    };
    
    const handleLabourUpdate = (teamId: string, labourIdToUpdate: string, field: 'typeId' | 'shifts', value: string | number) => {
        setTeams(currentTeams => currentTeams.map(team => 
            team.id === teamId ? {
                ...team,
                labour: team.labour.map(l => 
                    l.id === labourIdToUpdate ? { ...l, [field]: value } : l
                )
            } : team
        ));
    };

    const handleSubmit = async () => {
        if (!selectedProjectId || isSubmitting) return;
        setIsSubmitting(true);

        try {
            const recordsToInsert = teams.flatMap(team => 
                team.labour
                    .filter(l => l.typeId && l.shifts > 0)
                    .map(l => ({
                        project_id: selectedProjectId,
                        date: date,
                        team_id: team.teamId,
                        type_id: l.typeId,
                        count: l.shifts,
                    }))
            );
    
            if (mode === 'editing') {
                const { error: deleteError } = await supabase
                    .from('attendance_records')
                    .delete()
                    .eq('project_id', selectedProjectId)
                    .eq('date', date);
                
                if (deleteError) throw deleteError;
            }
    
            if (recordsToInsert.length > 0) {
                const { error } = await supabase.from('attendance_records').insert(recordsToInsert);
                if (error) throw error;
            }
            
            setSubmitted(true);

        } catch (error: any) {
            alert(`Error submitting attendance: ${error.message}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    // --- CALCULATIONS ---
    const totalShifts = teams.reduce((acc, team) => 
        acc + team.labour.reduce((labourAcc, l) => labourAcc + l.shifts, 0), 0
    );

    const handleDownloadPdf = () => alert("Downloading PDF... (This is a placeholder)");

    // --- RENDER LOGIC ---
    if(loading) {
        return (
            <div className="p-4 lg:p-0 animate-pulse">
                <div className="h-8 bg-neutral-200 rounded w-1/3 mb-6 hidden lg:block"></div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-1 space-y-4">
                        <SkeletonCard className="h-48" />
                    </div>
                    <div className="lg:col-span-2 space-y-4">
                        <SkeletonCard className="h-64" />
                    </div>
                </div>
            </div>
        );
    }

    if (submitted) {
        return (
            <div className="p-4 lg:p-0 h-full flex items-center justify-center">
                 <Card className="w-full max-w-lg text-center">
                    <div className="mx-auto bg-green-100 rounded-full w-20 h-20 flex items-center justify-center">
                        <CalendarCheckIcon className="w-12 h-12 text-green-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-neutral-800 mt-4">Attendance Saved!</h2>
                    <p className="mt-2 text-neutral-600">Total of <span className="font-bold">{totalShifts}</span> labour shifts recorded for {new Date(date).toLocaleDateString()}.</p>
                    <div className="mt-6 space-y-2">
                        <Button onClick={handleDownloadPdf} variant="secondary" fullWidth>
                            <DownloadIcon className="w-5 h-5 mr-2" /> Download Report
                        </Button>
                        <Button onClick={() => { setSubmitted(false); setTeams([]); setSelectedProjectId(''); setMode('new'); }} fullWidth>Mark Another</Button>
                    </div>
                 </Card>
            </div>
        );
    }

    return (
        <div className="p-4 lg:p-0 pb-6">
            <PageHeader title="Mark Attendance" subtitle="Record daily labour attendance for a project.">
                <Button variant="secondary" onClick={() => navigate('/attendance/history')}>
                    <HistoryIcon className="w-5 h-5 mr-2" />
                    View History
                </Button>
            </PageHeader>

            <div className="lg:hidden mb-4">
                <Button fullWidth variant="secondary" onClick={() => navigate('/attendance/history')}>
                    <HistoryIcon className="w-4 h-4 mr-2" />
                    View Attendance History
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column: Setup */}
                <div className="lg:col-span-1 space-y-6">
                    <Card>
                        <h3 className="font-bold text-lg mb-4 text-neutral-700">1. Select Project & Date</h3>
                        <div className="space-y-4">
                             <Select id="project" label="Project" value={selectedProjectId} onChange={e => setSelectedProjectId(e.target.value)}>
                                <option value="" disabled>Select a project</option>
                                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                             </Select>
                            <DateInput id="date" label="Date" value={date} onChange={e => setDate(e.target.value)} />
                        </div>
                    </Card>
                </div>

                {/* Right Column: Teams */}
                <div className="lg:col-span-2 space-y-4">
                     {selectedProjectId && (
                        <>
                            <h3 className="hidden lg:block font-bold text-lg text-neutral-700">2. Add Teams & Labour</h3>
                            {isChecking ? (
                                <Card><p className="text-center text-neutral-500 py-4">Checking for existing records...</p></Card>
                            ) : mode === 'existing' ? (
                                <ExistingAttendanceView 
                                    records={existingRecords}
                                    onEdit={handleEdit}
                                    onReset={() => { setMode('new'); setSelectedProjectId(''); setDate(new Date().toISOString().substring(0, 10)); }}
                                    labourTeams={labourTeams}
                                    allLabourTypes={allLabourTypes}
                                />
                            ) : (
                                <>
                                    {teams.map((team, index) => {
                                        const selectedTeamData = labourTeams.find(t => t.id === team.teamId);
                                        const availableLabourTypes = selectedTeamData 
                                            ? allLabourTypes.filter(lt => selectedTeamData.types.map(t => t.typeId).includes(lt.id))
                                            : [];
                                        
                                        return (
                                        <Card key={team.id}>
                                            <div className="flex justify-between items-center mb-4">
                                               <h4 className="font-bold text-lg text-neutral-700">Team #{index + 1}</h4>
                                               <button onClick={() => handleRemoveTeam(team.id)} className="text-neutral-500 hover:text-red-600 p-1 rounded-full hover:bg-red-50"><TrashIcon className="w-5 h-5"/></button>
                                            </div>
                                           
                                            <div className="space-y-4">
                                                <Select id={`team-select-${team.id}`} label="Labour Team" value={team.teamId} onChange={e => handleTeamSelectionChange(team.id, e.target.value)}>
                                                    <option value="" disabled>Select team</option>
                                                    {labourTeams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                                </Select>

                                                {selectedTeamData && (<div className="flex justify-end -mt-2"><span className={`text-xs font-bold px-2 py-0.5 rounded-full ${selectedTeamData.workType === 'NMR' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}>{selectedTeamData.workType}</span></div>)}
                                                
                                                {team.teamId && (
                                                  <div className="space-y-3 pt-2">
                                                    {team.labour.map(l => (
                                                        <div key={l.id} className="grid grid-cols-1 md:grid-cols-[1fr_auto_auto] gap-2 items-end p-3 bg-neutral-50 rounded-lg">
                                                            <div className="flex-grow">
                                                                <Select label="Type" id={`labour-type-${l.id}`} value={l.typeId} onChange={e => handleLabourUpdate(team.id, l.id, 'typeId', e.target.value)}>
                                                                    <option value="" disabled>Select type</option>
                                                                     {availableLabourTypes.map(lt => <option key={lt.id} value={lt.id}>{lt.name}</option>)}
                                                                </Select>
                                                            </div>
                                                            <div className="flex flex-col items-center">
                                                                <label className="text-sm font-medium text-neutral-700 mb-1">Count</label>
                                                                <Stepper value={l.shifts} onChange={val => handleLabourUpdate(team.id, l.id, 'shifts', val)} />
                                                            </div>
                                                            <button onClick={() => handleRemoveLabour(team.id, l.id)} className="text-neutral-400 hover:text-red-500 p-1 rounded-full hover:bg-red-50"><TrashIcon className="w-5 h-5"/></button>
                                                        </div>
                                                    ))}
                                                    <Button variant="secondary" onClick={() => handleAddLabour(team.id)} fullWidth><PlusIcon className="w-4 h-4 mr-2" /> Add Labour Type</Button>
                                                  </div>
                                                )}
                                            </div>
                                        </Card>
                                    )})}
                                    <Button fullWidth variant="primary" onClick={handleAddTeam} className="bg-opacity-90"><PlusIcon className="w-5 h-5 mr-2" /> Add Team</Button>
                                </>
                            )}
                        </>
                    )}
                </div>
            </div>

            {selectedProjectId && (mode === 'new' || mode === 'editing') && (
                <div className="mt-6 lg:col-start-2 lg:col-span-2">
                    <Card>
                        <h3 className="text-lg font-bold text-neutral-700">Summary</h3>
                        <div className="mt-2 text-neutral-600">
                            <div className="flex justify-between font-bold text-xl">
                                <span>Total Labour Count</span>
                                <span>{totalShifts}</span>
                            </div>
                        </div>
                        <Button fullWidth className="mt-6" onClick={handleSubmit} disabled={teams.length === 0 || isSubmitting}>
                            {isSubmitting ? 'Submitting...' : (mode === 'editing' ? 'Update Attendance' : 'Submit Attendance')}
                        </Button>
                    </Card>
                </div>
            )}
        </div>
    );
};

export default AttendancePage;
