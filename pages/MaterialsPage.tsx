
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import Select from '../components/ui/Select';
import Stepper from '../components/ui/Stepper';
import Input from '../components/ui/Input';
import { Material } from '../types';
import PageHeader from '../components/ui/PageHeader';
import { supabase } from '../core/auth/supabase';
import SkeletonCard from '../components/ui/SkeletonCard';
import PageStatus from '../components/ui/PageStatus';
import { BoxIcon } from '../components/icons';

const MaterialsPage: React.FC = () => {
    const navigate = useNavigate();
    const [materials, setMaterials] = useState<Material[]>([]);
    const [loading, setLoading] = useState(true);
    const [isReceiptModalOpen, setReceiptModalOpen] = useState(false);
    const [isUsageModalOpen, setUsageModalOpen] = useState(false);
    const [selectedMaterialId, setSelectedMaterialId] = useState('');
    const [quantity, setQuantity] = useState(1);
    const [description, setDescription] = useState('');

    useEffect(() => {
        fetchMaterials();
    }, []);

    const fetchMaterials = async () => {
        setLoading(true);
        const { data, error } = await supabase.from('materials').select('*').order('name', { ascending: true });
        if (data) setMaterials(data);
        setLoading(false);
    };

    const resetForm = () => {
        setSelectedMaterialId('');
        setQuantity(1);
        setDescription('');
    };

    const handleTransaction = async (type: 'in' | 'out') => {
        if (!selectedMaterialId || quantity <= 0) return;
    
        const originalMaterials = [...materials];
        const material = originalMaterials.find(m => m.id === selectedMaterialId);
        if (!material) return;
    
        // --- Optimistic Update ---
        const newStock = type === 'in' ? material.currentStock + quantity : material.currentStock - quantity;
        const updatedMaterials = originalMaterials.map(m => 
            m.id === selectedMaterialId ? { ...m, currentStock: newStock } : m
        );
        setMaterials(updatedMaterials);
    
        // Close modal immediately
        setReceiptModalOpen(false);
        setUsageModalOpen(false);
        resetForm();
    
        // --- Background Sync ---
        try {
            // 1. Update material stock in DB
            const { error: updateError } = await supabase
                .from('materials')
                .update({ current_stock: newStock })
                .eq('id', selectedMaterialId);
            if (updateError) throw updateError;
    
            // 2. Create transaction record in DB
            const transaction = {
                material_id: selectedMaterialId,
                type: type,
                quantity,
                date: new Date().toISOString().substring(0, 10),
                description: description || (type === 'in' ? 'Material Receipt' : 'Manual Usage Entry')
            };
            const { error: insertError } = await supabase.from('material_transactions').insert(transaction);
            if (insertError) {
                // If transaction fails, we must attempt to revert the stock update in the DB as well.
                await supabase.from('materials').update({ current_stock: material.currentStock }).eq('id', selectedMaterialId);
                throw insertError;
            }
            
        } catch (error: any) {
            // --- Revert UI on Failure ---
            alert(`Failed to save material transaction: ${error.message}. Reverting changes.`);
            setMaterials(originalMaterials);
        }
    };

    const handleReceiptSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        handleTransaction('in');
    };
    
    const handleUsageSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        handleTransaction('out');
    };

    const renderContent = () => {
        if (loading) {
            return (
                <div className="space-y-4 mt-4 lg:mt-0">
                    <SkeletonCard />
                    <SkeletonCard />
                    <SkeletonCard />
                    <SkeletonCard />
                </div>
            );
        }

        if (materials.length === 0) {
            return (
                <Card>
                    <PageStatus
                        icon={BoxIcon}
                        title="No Materials Found"
                        message="Get started by adding materials in the Admin panel."
                    />
                </Card>
            );
        }

        return (
            <div className="space-y-4 mt-4 lg:mt-0">
                {materials.map(material => {
                    const isLow = material.currentStock < material.minStock;
                    return (
                        <Card 
                            key={material.id} 
                            className={isLow ? 'border-l-4 border-red-500' : ''}
                            onClick={() => navigate(`/materials/${material.id}`)}
                        >
                            <div className="flex justify-between items-center">
                                <div>
                                    <p className="font-semibold text-neutral-800">{material.name}</p>
                                    {isLow && <p className="text-xs text-red-600 font-bold">Stock Low!</p>}
                                </div>
                                <div className="text-right">
                                    <p className="text-xl font-bold">{material.currentStock} <span className="text-sm font-normal text-neutral-500">{material.unit}</span></p>
                                    <p className="text-xs text-neutral-500">Min: {material.minStock} {material.unit}</p>
                                </div>
                            </div>
                        </Card>
                    );
                })}
            </div>
        );
    }

    return (
        <div className="p-4 lg:p-0">
            <PageHeader title="Materials Management" subtitle="Track current stock levels and record transactions.">
                <Button variant="secondary" onClick={() => { resetForm(); setReceiptModalOpen(true); }}>Record Receipt (In)</Button>
                <Button variant="primary" onClick={() => { resetForm(); setUsageModalOpen(true); }}>Record Usage (Out)</Button>
            </PageHeader>
            
            {/* --- Modals --- */}
            <Modal isOpen={isReceiptModalOpen} onClose={() => setReceiptModalOpen(false)}>
                <form onSubmit={handleReceiptSubmit} className="space-y-4">
                    <h3 className="text-xl font-bold">Record Material Receipt (In)</h3>
                    <Select id="material-receipt" label="Material" value={selectedMaterialId} onChange={e => setSelectedMaterialId(e.target.value)} required>
                        <option value="" disabled>Select a material</option>
                        {materials.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                    </Select>
                    <div className="flex flex-col items-center">
                        <label className="block text-sm font-medium text-neutral-700 mb-1 w-full">Quantity</label>
                        <Stepper value={quantity} onChange={setQuantity} />
                    </div>
                     <Input id="receipt-desc" label="Description (Optional)" value={description} onChange={e => setDescription(e.target.value)} placeholder="e.g., From vendor XYZ"/>
                    <Button type="submit" fullWidth>Add Receipt</Button>
                </form>
            </Modal>

             <Modal isOpen={isUsageModalOpen} onClose={() => setUsageModalOpen(false)}>
                <form onSubmit={handleUsageSubmit} className="space-y-4">
                    <h3 className="text-xl font-bold">Record Material Usage (Out)</h3>
                    <Select id="material-usage" label="Material" value={selectedMaterialId} onChange={e => setSelectedMaterialId(e.target.value)} required>
                        <option value="" disabled>Select a material</option>
                        {materials.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                    </Select>
                    <div className="flex flex-col items-center">
                         <label className="block text-sm font-medium text-neutral-700 mb-1 w-full">Quantity</label>
                        <Stepper value={quantity} onChange={setQuantity} max={materials.find(m => m.id === selectedMaterialId)?.currentStock} />
                    </div>
                    <Input id="usage-desc" label="Reason (Optional)" value={description} onChange={e => setDescription(e.target.value)} placeholder="e.g., for site cleaning"/>
                    <Button type="submit" fullWidth>Record Usage</Button>
                </form>
            </Modal>
            
            {/* --- Main Content --- */}
            <div className="grid grid-cols-2 gap-2 lg:hidden">
                <Button variant="primary" onClick={() => { resetForm(); setUsageModalOpen(true); }}>Record Usage (Out)</Button>
                <Button variant="secondary" onClick={() => { resetForm(); setReceiptModalOpen(true); }}>Record Receipt (In)</Button>
            </div>
            
            <h2 className="text-xl font-bold pt-2 text-neutral-800 lg:hidden">Current Stock</h2>
            
            {renderContent()}
        </div>
    );
};

export default MaterialsPage;
