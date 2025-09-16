
import React, { useState, useEffect } from 'react';
import Card from '../components/ui/Card';
import { User, UserRole, Project, LabourTeam, LabourType, Material } from '../types';
import { UsersIcon, BriefcaseIcon, DatabaseIcon, PlusIcon, EditIcon, TrashIcon, BoxIcon } from '../components/icons';
import Switch from '../components/ui/Switch';
import Modal from '../components/ui/Modal';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import PageHeader from '../components/ui/PageHeader';
import { supabase } from '../core/auth/supabase';
import SkeletonCard from '../components/ui/SkeletonCard';

type AdminTab = 'Users' | 'Projects' | 'Masters' | 'Materials';

const statusColors = {
    Active: 'bg-green-100 text-green-800',
    Inactive: 'bg-neutral-100 text-neutral-800',
};

// --- Confirmation Modal ---
const ConfirmationModal: React.FC<{ title: string; message: string; onConfirm: () => void; onCancel: () => void; }> = ({ title, message, onConfirm, onCancel }) => {
    return (
        <Modal isOpen={true} onClose={onCancel}>
            <div className="text-center">
                <h3 className="text-xl font-bold">{title}</h3>
                <p className="my-4 text-neutral-600">{message}</p>
                <div className="flex justify-end space-x-2">
                    <Button variant="secondary" onClick={onCancel}>Cancel</Button>
                    <Button variant="danger" onClick={onConfirm}>Confirm Delete</Button>
                </div>
            </div>
        </Modal>
    );
};

// --- User Management ---
const UserManagement: React.FC<{ users: User[], onUserUpdate: () => void }> = ({ users, onUserUpdate }) => {
    
    const handleStatusChange = async (userId: string, newStatus: 'Active' | 'Inactive') => {
        const { error } = await supabase.from('profiles').update({ status: newStatus }).eq('id', userId);
        if (error) alert(`Error updating user status: ${error.message}`);
        else onUserUpdate();
    };
    
    return (
        <div className="space-y-4">
            {users.map(user => (
                <Card key={user.id}>
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="font-bold">{user.name}</p>
                            <p className="text-sm text-neutral-500">{user.email}</p>
                            <p className="text-xs text-neutral-500">{user.role}</p>
                        </div>
                        <div className="flex flex-col items-end space-y-2">
                             <span className={`text-xs font-bold px-2 py-1 rounded-full ${statusColors[user.status]}`}>
                                {user.status}
                            </span>
                            <Switch id={`user-status-${user.id}`} checked={user.status === 'Active'} onChange={checked => handleStatusChange(user.id, checked ? 'Active' : 'Inactive')} />
                        </div>
                    </div>
                </Card>
            ))}
        </div>
    );
};

// --- Project Management ---
const ProjectManagement: React.FC<{ projects: Project[], engineers: User[], onProjectUpdate: () => void }> = ({ projects, engineers, onProjectUpdate }) => {
    const [isModalOpen, setModalOpen] = useState(false);
    const [editingProject, setEditingProject] = useState<Project | null>(null);
    const [confirmDelete, setConfirmDelete] = useState<Project | null>(null);

    const handleOpenModal = (project: Project | null) => {
        setEditingProject(project);
        setModalOpen(true);
    };

    const handleSaveProject = async (projectData: Project) => {
        try {
            const projectPayload = {
                name: projectData.name,
                location: projectData.location,
                status: projectData.status,
                start_date: projectData.startDate || null,
            };

            let projectId: string;

            if (editingProject?.id) {
                // UPDATE operation
                projectId = editingProject.id;
                const { data, error: updateError } = await supabase
                    .from('projects')
                    .update(projectPayload)
                    .eq('id', projectId)
                    .select('id');
                    
                if (updateError) throw updateError;
                if (!data || data.length === 0) {
                    throw new Error("Failed to update project. This may be due to database permissions (RLS).");
                }
            } else {
                // INSERT operation
                const { data, error: insertError } = await supabase
                    .from('projects')
                    .insert(projectPayload)
                    .select('id');
                
                if (insertError) throw insertError;
                if (!data || data.length === 0) {
                    throw new Error("Failed to create project. This may be due to database permissions (RLS). Please check your policy.");
                }
                projectId = data[0].id;
            }

            // Handle project members assignment
            const { error: deleteError } = await supabase.from('project_members').delete().eq('project_id', projectId);
            if (deleteError) throw deleteError;

            const engineerIds = projectData.engineerIds || [];
            if (engineerIds.length > 0) {
                const membersToInsert = engineerIds.map(engineerId => ({
                    project_id: projectId,
                    user_id: engineerId,
                }));
                const { error: insertMembersError } = await supabase.from('project_members').insert(membersToInsert);
                if (insertMembersError) throw insertMembersError;
            }

            setModalOpen(false);
            onProjectUpdate();

        } catch (error: any) {
            console.error("Error saving project:", error);
            const errorMessage = error.message 
                ? error.message 
                : "An unknown error occurred. Check the console and your database's Row Level Security policies.";
            alert(`Error saving project:\n${errorMessage}`);
        }
    };
    
    const handleDeleteProject = async () => {
        if (!confirmDelete) return;
        // RLS policies on projects might cascade delete, but being explicit is safer.
        await supabase.from('project_members').delete().eq('project_id', confirmDelete.id);
        const { error } = await supabase.from('projects').delete().eq('id', confirmDelete.id);
        if (error) alert(`Error deleting project: ${error.message}`);
        setConfirmDelete(null);
        onProjectUpdate();
    }

    return (
        <div className="space-y-4">
            <Button fullWidth onClick={() => handleOpenModal(null)} className="lg:hidden"><PlusIcon className="w-5 h-5 mr-2" /> Create New Project</Button>
            {projects.map(project => (
                <Card key={project.id}>
                    <div className="flex justify-between items-center">
                        <div>
                            <p className="font-bold">{project.name}</p>
                            <p className="text-sm text-neutral-500">{project.location}</p>
                        </div>
                        <div className="space-x-2">
                           <button onClick={() => handleOpenModal(project)} className="text-neutral-500 hover:text-primary-600 p-2"><EditIcon className="w-5 h-5" /></button>
                           <button onClick={() => setConfirmDelete(project)} className="text-neutral-500 hover:text-red-600 p-2"><TrashIcon className="w-5 h-5" /></button>
                        </div>
                    </div>
                </Card>
            ))}
            {isModalOpen && <ProjectModal isOpen={isModalOpen} onClose={() => setModalOpen(false)} onSave={handleSaveProject} project={editingProject} engineers={engineers} />}
            {confirmDelete && <ConfirmationModal title="Delete Project?" message={`Are you sure you want to delete "${confirmDelete.name}"? This action cannot be undone.`} onConfirm={handleDeleteProject} onCancel={() => setConfirmDelete(null)} />}
        </div>
    );
};

const ProjectModal: React.FC<{isOpen: boolean, onClose: () => void, onSave: (project: Project) => void, project: Project | null, engineers: User[]}> = ({ isOpen, onClose, onSave, project, engineers }) => {
    const [projectData, setProjectData] = useState<Partial<Project>>({});

    useEffect(() => {
        setProjectData(project ? {...project} : { name: '', location: '', status: 'Ongoing', engineerIds: [] });
    }, [project]);

    const handleEngineerToggle = (engineerId: string) => {
        const currentIds = projectData.engineerIds || [];
        const newIds = currentIds.includes(engineerId)
            ? currentIds.filter(id => id !== engineerId)
            : [...currentIds, engineerId];
        setProjectData(p => ({...p, engineerIds: newIds }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(projectData as Project);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <form className="space-y-4" onSubmit={handleSubmit}>
                <h3 className="text-xl font-bold">{project ? 'Edit Project' : 'Create Project'}</h3>
                <Input id="projectName" label="Project Name" value={projectData.name || ''} onChange={e => setProjectData(p => ({...p, name: e.target.value}))} required />
                <Input id="projectLocation" label="Location" value={projectData.location || ''} onChange={e => setProjectData(p => ({...p, location: e.target.value}))} required />
                <Select id="projectStatus" label="Status" value={projectData.status} onChange={e => setProjectData(p => ({...p, status: e.target.value as any}))}>
                    <option value="Ongoing">Ongoing</option>
                    <option value="Completed">Completed</option>
                    <option value="On Hold">On Hold</option>
                </Select>
                 <Input id="startDate" label="Start Date" type="date" value={projectData.startDate || ''} onChange={e => setProjectData(p => ({...p, startDate: e.target.value}))} />
                <div>
                    <h4 className="block text-sm font-medium text-neutral-700 mb-2">Assign Engineers</h4>
                    <div className="space-y-2 max-h-40 overflow-y-auto p-2 border rounded-md">
                        {engineers.map(eng => (
                            <label key={eng.id} className="flex items-center space-x-2">
                                <input type="checkbox" checked={projectData.engineerIds?.includes(eng.id)} onChange={() => handleEngineerToggle(eng.id)} />
                                <span>{eng.name}</span>
                            </label>
                        ))}
                    </div>
                </div>
                <Button type="submit" fullWidth>Save Project</Button>
            </form>
        </Modal>
    )
}

// --- Masters Management ---
const MastersManagement: React.FC<{ teams: LabourTeam[], types: LabourType[], onUpdate: () => void }> = ({ teams, types, onUpdate }) => {
    const [isTeamModalOpen, setTeamModalOpen] = useState(false);
    const [isTypeModalOpen, setTypeModalOpen] = useState(false);
    const [editingTeam, setEditingTeam] = useState<LabourTeam | null>(null);
    const [editingType, setEditingType] = useState<LabourType | null>(null);
    const [confirmAction, setConfirmAction] = useState<{ action: () => void } | null>(null);
    const [confirmDelete, setConfirmDelete] = useState<{ type: 'team' | 'type', item: any} | null>(null);

    const handleOpenTeamModal = (team: LabourTeam | null) => {
        setEditingTeam(team);
        setTeamModalOpen(true);
    };

    const handleSaveTeam = (teamData: LabourTeam) => {
        const isEditing = !!(editingTeam && editingTeam.id);
        const saveAction = async () => {
            try {
                // FIX: Generate a client-side ID for new teams to satisfy the NOT NULL constraint.
                const teamId = isEditing
                    ? teamData.id
                    : (teamData.name.toLowerCase().replace(/[^a-z0-9]/g, '') || `team-${Date.now()}`);

                if (isEditing) {
                    // When updating, the payload shouldn't include the primary key itself.
                    const teamPayload = { name: teamData.name, work_type: teamData.workType };
                    const { error } = await supabase.from('labour_teams').update(teamPayload).eq('id', teamId);
                    if (error) throw error;
                } else {
                    // When inserting, the payload MUST include the ID.
                    const teamPayload = { id: teamId, name: teamData.name, work_type: teamData.workType };
                    const { error } = await supabase.from('labour_teams').insert(teamPayload);
                    if (error) throw error;
                }
                
                // Now, handle the associated costs with the guaranteed teamId.
                await supabase.from('team_labour_costs').delete().eq('team_id', teamId);
                if (teamData.types && teamData.types.length > 0) {
                     const costs = teamData.types.map(t => ({ team_id: teamId, type_id: t.typeId, cost: t.cost || null }));
                     const { error: costError } = await supabase.from('team_labour_costs').insert(costs);
                     if (costError) throw costError;
                }
    
                setTeamModalOpen(false);
                onUpdate();
            } catch (error: any) {
                console.error("Error saving team:", error);
                alert(`Error saving team: ${error.message}`);
            }
        };
        
        if (isEditing) {
            setConfirmAction({ action: saveAction });
        } else {
            saveAction();
        }
    };
    
    const handleDelete = async () => {
        if (!confirmDelete) return;
        try {
            if(confirmDelete.type === 'team') {
                await supabase.from('team_labour_costs').delete().eq('team_id', confirmDelete.item.id);
                const { error } = await supabase.from('labour_teams').delete().eq('id', confirmDelete.item.id);
                if (error) throw error;
            } else {
                const { error } = await supabase.from('labour_types').delete().eq('id', confirmDelete.item.id);
                if (error) throw error;
            }
        } catch(error: any) {
            alert(`Error deleting: ${error.message}. It might be in use in attendance or work records.`);
        }
        setConfirmDelete(null);
        onUpdate();
    }
    
    const handleOpenTypeModal = (type: LabourType | null) => {
        setEditingType(type);
        setTypeModalOpen(true);
    };

    const handleSaveType = (typeData: LabourType) => {
        const isEditing = !!(editingType && editingType.id);
        const saveAction = async () => {
             try {
                const payload = { 
                    name: typeData.name, 
                    id: isEditing ? editingType!.id : (typeData.id || typeData.name.toLowerCase().replace(/[^a-z0-9]/g, '') || `lt-${Date.now()}`)
                };
                 if (isEditing) {
                    const { error } = await supabase.from('labour_types').update({ name: payload.name }).eq('id', payload.id);
                    if (error) throw error;
                } else {
                    const { error } = await supabase.from('labour_types').insert(payload);
                    if (error) throw error;
                }
                setTypeModalOpen(false);
                onUpdate();
            } catch (error: any) {
                 console.error("Error saving type:", error);
                alert(`Error saving type: ${error.message}`);
            }
        };

        if (isEditing) {
            setConfirmAction({ action: saveAction });
        } else {
            saveAction();
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
                <div className="flex justify-between items-center mb-2">
                    <h3 className="text-lg font-bold">Labour Teams</h3>
                    <Button onClick={() => handleOpenTeamModal(null)} className="py-1 px-3 text-sm"><PlusIcon className="w-4 h-4 mr-1"/>Add</Button>
                </div>
                <div className="space-y-2">
                    {teams.map(team => (
                        <div key={team.id} className="flex justify-between items-center p-2 bg-neutral-50 rounded-md">
                           <div>
                             <span className="font-semibold">{team.name}</span>
                             <span className={`ml-2 text-xs font-bold px-2 py-0.5 rounded-full ${team.workType === 'NMR' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}>{team.workType}</span>
                           </div>
                           <div className="space-x-1">
                                <button onClick={() => handleOpenTeamModal(team)} className="text-neutral-500 hover:text-primary-600 p-2"><EditIcon className="w-5 h-5"/></button>
                                <button onClick={() => setConfirmDelete({type: 'team', item: team})} className="text-neutral-500 hover:text-red-600 p-2"><TrashIcon className="w-5 h-5"/></button>
                           </div>
                        </div>
                    ))}
                </div>
            </Card>
             <Card>
                <div className="flex justify-between items-center mb-2">
                    <h3 className="text-lg font-bold">Labour Types</h3>
                    <Button onClick={() => handleOpenTypeModal(null)} className="py-1 px-3 text-sm"><PlusIcon className="w-4 h-4 mr-1"/>Add</Button>
                </div>
                <div className="space-y-2">
                    {types.map(type => (
                        <div key={type.id} className="flex justify-between items-center p-2 bg-neutral-50 rounded-md">
                            <span>{type.name}</span>
                            <div className="space-x-1">
                                <button onClick={() => handleOpenTypeModal(type)} className="text-neutral-500 hover:text-primary-600 p-2"><EditIcon className="w-5 h-5"/></button>
                                <button onClick={() => setConfirmDelete({type: 'type', item: type})} className="text-neutral-500 hover:text-red-600 p-2"><TrashIcon className="w-5 h-5"/></button>
                            </div>
                        </div>
                    ))}
                </div>
            </Card>

            {isTeamModalOpen && <TeamModal isOpen={isTeamModalOpen} onClose={() => setTeamModalOpen(false)} onSave={handleSaveTeam} team={editingTeam} allTypes={types} />}
            {isTypeModalOpen && <TypeModal isOpen={isTypeModalOpen} onClose={() => setTypeModalOpen(false)} onSave={handleSaveType} type={editingType} />}
            {confirmAction && <ConfirmationModal title="Confirm Changes" message="Are you sure? Modifying master data can affect existing records." onConfirm={() => { confirmAction.action(); setConfirmAction(null); }} onCancel={() => setConfirmAction(null)} />}
            {confirmDelete && <ConfirmationModal title={`Delete ${confirmDelete.type}?`} message={`Are you sure you want to delete "${confirmDelete.item.name}"? This cannot be undone.`} onConfirm={handleDelete} onCancel={() => setConfirmDelete(null)} />}
        </div>
    );
};

const TypeModal: React.FC<{isOpen: boolean, onClose: () => void, onSave: (type: any) => void, type: LabourType | null}> = ({isOpen, onClose, onSave, type}) => {
    const [name, setName] = useState('');
    useEffect(() => { setName(type ? type.name : ''); }, [type]);
    const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); onSave({ id: type?.id || '', name }); };
    return (
         <Modal isOpen={isOpen} onClose={onClose}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <h3 className="text-xl font-bold">{type ? 'Edit Labour Type' : 'Add Labour Type'}</h3>
                <Input id="typeName" label="Type Name" value={name} onChange={e => setName(e.target.value)} required />
                 <Button type="submit" fullWidth>Save Type</Button>
            </form>
        </Modal>
    )
}

const TeamModal: React.FC<{isOpen: boolean, onClose: () => void, onSave: (team: any) => void, team: LabourTeam | null, allTypes: LabourType[]}> = ({isOpen, onClose, onSave, team, allTypes}) => {
    const [teamData, setTeamData] = useState<Partial<LabourTeam>>({});
    useEffect(() => { setTeamData(team ? {...team} : { id: '', name: '', workType: 'NMR', types: [] }); }, [team]);

    const handleTypeToggle = (typeId: string) => {
        const currentTypes = teamData.types || [];
        const isSelected = currentTypes.some(t => t.typeId === typeId);
        let newTypes = isSelected ? currentTypes.filter(t => t.typeId !== typeId) : [...currentTypes, { typeId, cost: 0 }];
        setTeamData(t => ({...t, types: newTypes }));
    };
    const handleCostChange = (typeId: string, cost: number) => {
        setTeamData(t => ({...t, types: (t.types || []).map(ty => ty.typeId === typeId ? { ...ty, cost } : ty) }));
    };
    const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); onSave(teamData); };

    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <h3 className="text-xl font-bold">{team ? 'Edit Team' : 'Add Team'}</h3>
                <Input id="teamName" label="Team Name" value={teamData.name || ''} onChange={e => setTeamData(t => ({...t, name: e.target.value}))} required />
                <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">Work Type</label>
                    <div className="flex space-x-2 rounded-lg bg-neutral-100 p-1">
                        <button type="button" onClick={() => setTeamData(t => ({...t, workType: 'NMR'}))} className={`flex-1 py-1.5 rounded-md text-sm font-semibold transition-all ${teamData.workType === 'NMR' ? 'bg-white shadow' : 'text-neutral-600'}`}>NMR</button>
                        <button type="button" onClick={() => setTeamData(t => ({...t, workType: 'Rate Work'}))} className={`flex-1 py-1.5 rounded-md text-sm font-semibold transition-all ${teamData.workType === 'Rate Work' ? 'bg-white shadow' : 'text-neutral-600'}`}>Rate Work</button>
                    </div>
                </div>
                <div>
                    <h4 className="block text-sm font-medium text-neutral-700 mb-2">Associated Labour Types</h4>
                     <div className="space-y-3 max-h-48 overflow-y-auto p-3 border rounded-md bg-neutral-50">
                        {allTypes.map(type => {
                             const isSelected = teamData.types?.some(t => t.typeId === type.id);
                             const selectedType = teamData.types?.find(t => t.typeId === type.id);
                            return(
                            <div key={type.id}>
                                <label className="flex items-center space-x-3">
                                    <input type="checkbox" checked={isSelected} onChange={() => handleTypeToggle(type.id)} className="h-4 w-4 rounded border-neutral-300 text-primary-600 focus:ring-primary-500" />
                                    <span className="flex-grow">{type.name}</span>
                                </label>
                                {isSelected && teamData.workType === 'NMR' && (
                                    <div className="pl-7 pt-2">
                                        <Input label="Cost per count" id={`cost-${type.id}`} type="number" placeholder="e.g., 800" value={selectedType?.cost || ''} onChange={(e) => handleCostChange(type.id, parseFloat(e.target.value) || 0)} className="text-sm py-1" />
                                    </div>
                                )}
                            </div>
                        )})}
                    </div>
                </div>
                 <Button type="submit" fullWidth>Save Team</Button>
            </form>
        </Modal>
    )
}

// --- Material Management ---
const MaterialModal: React.FC<{isOpen: boolean, onClose: () => void, onSave: (material: any) => void, material: any | null}> = ({ isOpen, onClose, onSave, material }) => {
    const [materialData, setMaterialData] = useState<any>({});
    const isEditing = !!material;

    useEffect(() => {
        if (isOpen) {
            setMaterialData(material ? {...material} : { name: '', unit: '', min_stock: 0, current_stock: 0 });
        }
    }, [isOpen, material]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(materialData);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <form className="space-y-4" onSubmit={handleSubmit}>
                <h3 className="text-xl font-bold">{isEditing ? 'Edit Material' : 'Add New Material'}</h3>
                <Input id="materialName" label="Material Name" value={materialData.name || ''} onChange={e => setMaterialData(p => ({...p, name: e.target.value}))} required />
                <Input id="materialUnit" label="Unit (e.g., bags, kg, nos)" value={materialData.unit || ''} onChange={e => setMaterialData(p => ({...p, unit: e.target.value}))} required />
                <Input id="minStock" label="Minimum Stock Level" type="number" value={materialData.min_stock || 0} onChange={e => setMaterialData(p => ({...p, min_stock: parseInt(e.target.value, 10) || 0}))} required />
                {!isEditing && (
                    <Input id="initialStock" label="Initial Stock" type="number" value={materialData.current_stock || 0} onChange={e => setMaterialData(p => ({...p, current_stock: parseInt(e.target.value, 10) || 0}))} required />
                )}
                <Button type="submit" fullWidth>Save Material</Button>
            </form>
        </Modal>
    );
};

const MaterialManagement: React.FC<{ materials: any[], onUpdate: () => void }> = ({ materials, onUpdate }) => {
    const [isModalOpen, setModalOpen] = useState(false);
    const [editingMaterial, setEditingMaterial] = useState<any | null>(null);
    const [confirmDelete, setConfirmDelete] = useState<any | null>(null);

    const handleOpenModal = (material: any | null) => {
        setEditingMaterial(material);
        setModalOpen(true);
    };

    const handleSaveMaterial = async (materialData: any) => {
        const isEditing = !!editingMaterial?.id;

        const payload = {
            name: materialData.name,
            unit: materialData.unit,
            min_stock: materialData.min_stock,
            current_stock: materialData.current_stock,
        };

        try {
            if (isEditing) {
                const { error } = await supabase
                    .from('materials')
                    .update({ name: payload.name, unit: payload.unit, min_stock: payload.min_stock })
                    .eq('id', editingMaterial.id);
                if (error) throw error;
            } else {
                const { data, error } = await supabase
                    .from('materials')
                    .insert(payload)
                    .select()
                    .single();
                if (error) throw error;
                
                if (data && payload.current_stock > 0) {
                    await supabase.from('material_transactions').insert({
                        material_id: data.id,
                        type: 'in',
                        quantity: payload.current_stock,
                        date: new Date().toISOString(),
                        description: 'Initial stock'
                    });
                }
            }
            setModalOpen(false);
            onUpdate();
        } catch (error: any) {
            alert(`Error saving material: ${error.message}`);
        }
    };
    
    const handleDeleteMaterial = async () => {
        if (!confirmDelete) return;
        try {
            await supabase.from('material_transactions').delete().eq('material_id', confirmDelete.id);
            const { error } = await supabase.from('materials').delete().eq('id', confirmDelete.id);
            if (error) throw error;
        } catch (error: any) {
            alert(`Error deleting material: ${error.message}. It might be in use in a work report.`);
        }
        setConfirmDelete(null);
        onUpdate();
    }

    return (
        <div className="space-y-4">
            <Button fullWidth onClick={() => handleOpenModal(null)} className="lg:hidden"><PlusIcon className="w-5 h-5 mr-2" /> Add New Material</Button>
            {materials.map(material => (
                <Card key={material.id}>
                    <div className="flex justify-between items-center">
                        <div>
                            <p className="font-bold">{material.name}</p>
                            <p className="text-sm text-neutral-500">Unit: {material.unit} | Min Stock: {material.min_stock}</p>
                        </div>
                        <div className="space-x-2">
                           <button onClick={() => handleOpenModal(material)} className="text-neutral-500 hover:text-primary-600 p-2"><EditIcon className="w-5 h-5" /></button>
                           <button onClick={() => setConfirmDelete(material)} className="text-neutral-500 hover:text-red-600 p-2"><TrashIcon className="w-5 h-5" /></button>
                        </div>
                    </div>
                </Card>
            ))}
            {isModalOpen && <MaterialModal isOpen={isModalOpen} onClose={() => setModalOpen(false)} onSave={handleSaveMaterial} material={editingMaterial} />}
            {confirmDelete && <ConfirmationModal title="Delete Material?" message={`Are you sure you want to delete "${confirmDelete.name}"? This also deletes its transaction history and cannot be undone.`} onConfirm={handleDeleteMaterial} onCancel={() => setConfirmDelete(null)} />}
        </div>
    );
};


const AdminPage: React.FC = () => {
    const [activeTab, setActiveTab] = useState<AdminTab>('Projects');
    const [loading, setLoading] = useState(true);
    const [users, setUsers] = useState<User[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);
    const [engineers, setEngineers] = useState<User[]>([]);
    const [labourTeams, setLabourTeams] = useState<LabourTeam[]>([]);
    const [labourTypes, setLabourTypes] = useState<LabourType[]>([]);
    const [materials, setMaterials] = useState<Material[]>([]);

    const fetchData = async () => {
        setLoading(true);
        const usersPromise = supabase.from('profiles').select('*');
        const projectsPromise = supabase.from('projects').select('*, project_members(user_id)');
        const teamsPromise = supabase.from('labour_teams').select(`*, team_labour_costs(*, labour_types(*))`);
        const typesPromise = supabase.from('labour_types').select('*');
        const materialsPromise = supabase.from('materials').select('*').order('name');

        const [usersRes, projectsRes, teamsRes, typesRes, materialsRes] = await Promise.all([usersPromise, projectsPromise, teamsPromise, typesPromise, materialsPromise]);
        
        if(usersRes.data) {
            setUsers(usersRes.data as User[]);
            setEngineers(usersRes.data.filter(u => u.role === UserRole.Engineer) as User[]);
        }
        if(projectsRes.data) {
            const formattedProjects = projectsRes.data.map((p: any) => ({ ...p, engineerIds: p.project_members.map((m: any) => m.user_id) }));
            setProjects(formattedProjects);
        }
        if(teamsRes.data) {
            const formattedTeams = teamsRes.data.map(team => ({
                id: team.id, name: team.name, workType: team.work_type,
                types: team.team_labour_costs.map((tlc: any) => ({ typeId: tlc.labour_types.id, cost: tlc.cost }))
            }));
            setLabourTeams(formattedTeams as any);
        }
        if(typesRes.data) setLabourTypes(typesRes.data);
        if(materialsRes.data) setMaterials(materialsRes.data as Material[]);

        setLoading(false);
    }
    
    useEffect(() => {
        fetchData();
    }, []);

    const tabs: { name: AdminTab; icon: React.FC<{className?: string}> }[] = [
        { name: 'Projects', icon: BriefcaseIcon },
        { name: 'Users', icon: UsersIcon },
        { name: 'Masters', icon: DatabaseIcon },
        { name: 'Materials', icon: BoxIcon },
    ];

    return (
        <div className="lg:p-0">
            <PageHeader title="Admin Panel" subtitle="Manage users, projects, and master data." />
            <div className="lg:bg-white lg:rounded-xl lg:shadow-sm">
                <div className="flex border-b border-neutral-200 sticky top-0 bg-white z-[5] lg:rounded-t-xl">
                    {tabs.map(tab => (
                        <button 
                            key={tab.name}
                            onClick={() => setActiveTab(tab.name)}
                            className={`flex-1 py-3 px-2 text-xs sm:text-sm font-bold text-center transition-colors duration-200 flex items-center justify-center space-x-2 ${
                                activeTab === tab.name 
                                ? 'text-primary-600 border-b-2 border-primary-600' 
                                : 'text-neutral-500 hover:text-primary-500'
                            }`}
                        >
                            <tab.icon className="w-5 h-5" />
                            <span>{tab.name}</span>
                        </button>
                    ))}
                </div>

                <div className="p-4 bg-neutral-100 lg:bg-white lg:p-6 lg:rounded-b-xl">
                    {loading ? (
                        <div className="space-y-4">
                            <SkeletonCard />
                            <SkeletonCard />
                            <SkeletonCard />
                        </div>
                    ) : (
                    <>
                        {activeTab === 'Users' && <UserManagement users={users} onUserUpdate={fetchData} />}
                        {activeTab === 'Projects' && <ProjectManagement projects={projects} engineers={engineers} onProjectUpdate={fetchData} />}
                        {activeTab === 'Masters' && <MastersManagement teams={labourTeams} types={labourTypes} onUpdate={fetchData} />}
                        {activeTab === 'Materials' && <MaterialManagement materials={materials} onUpdate={fetchData} />}
                    </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminPage;
