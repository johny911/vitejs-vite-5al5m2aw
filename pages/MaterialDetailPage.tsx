
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Card from '../components/ui/Card';
import { Material, MaterialTransaction } from '../types';
import { ArrowUpCircleIcon, ArrowDownCircleIcon } from '../components/icons';
import PageHeader from '../components/ui/PageHeader';
import { supabase } from '../core/auth/supabase';
import SkeletonCard from '../components/ui/SkeletonCard';

const MaterialDetailPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [material, setMaterial] = useState<Material | null>(null);
    const [transactions, setTransactions] = useState<MaterialTransaction[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!id) {
            navigate('/materials');
            return;
        }

        const fetchMaterialData = async () => {
            setLoading(true);
            const materialPromise = supabase.from('materials').select('*').eq('id', id).single();
            const transactionsPromise = supabase.from('material_transactions').select('*').eq('material_id', id).order('date', { ascending: false });

            const [materialRes, transactionsRes] = await Promise.all([materialPromise, transactionsPromise]);

            if (materialRes.data) setMaterial(materialRes.data);
            if (transactionsRes.data) setTransactions(transactionsRes.data as unknown as MaterialTransaction[]);

            setLoading(false);
        };

        fetchMaterialData();
    }, [id, navigate]);


    if (loading) {
        return (
            <div className="p-4 lg:p-0 animate-pulse">
                <div className="h-8 bg-neutral-200 rounded w-1/3 mb-2 hidden lg:block"></div>
                <div className="h-6 bg-neutral-200 rounded w-1/2 mb-1 lg:hidden"></div>
                <div className="h-4 bg-neutral-200 rounded w-1/3 mb-4 lg:hidden"></div>
                <SkeletonCard className="h-96" />
            </div>
        );
    }
    
    if (!material) {
        return (
            <div className="p-4 lg:p-0 text-center">
                <p>Material not found.</p>
                <button onClick={() => navigate(-1)} className="text-primary-600 mt-4">Go Back</button>
            </div>
        );
    }
    
    return (
        <div className="p-4 lg:p-0 space-y-4">
             <PageHeader title={material.name} subtitle={`Current Stock: ${material.currentStock} ${material.unit}`} />
            <section className="lg:hidden">
                <h2 className="text-2xl font-bold text-neutral-800">{material.name}</h2>
                <p className="text-neutral-500">Current Stock: <span className="font-bold">{material.currentStock} {material.unit}</span></p>
            </section>

            <Card>
                <h3 className="text-lg font-bold mb-4 text-neutral-700">Transaction Ledger</h3>
                <div className="space-y-3">
                    {transactions.length > 0 ? transactions.map(txn => {
                        const isReceipt = txn.type === 'in';
                        return (
                            <div key={txn.id} className="flex items-center space-x-3 p-3 bg-neutral-50 rounded-lg">
                                {isReceipt 
                                    ? <ArrowUpCircleIcon className="w-8 h-8 text-green-500 flex-shrink-0" /> 
                                    : <ArrowDownCircleIcon className="w-8 h-8 text-red-500 flex-shrink-0" />
                                }
                                <div className="flex-grow">
                                    <p className="font-semibold text-sm text-neutral-800">{txn.description}</p>
                                    <p className="text-xs text-neutral-500">{new Date(txn.date).toLocaleDateString()}</p>
                                </div>
                                <p className={`font-bold text-lg whitespace-nowrap ${isReceipt ? 'text-green-600' : 'text-red-600'}`}>
                                    {isReceipt ? '+' : '-'}{txn.quantity}
                                </p>
                            </div>
                        )
                    }) : (
                        <p className="text-neutral-500 text-center py-4">No transactions found for this material.</p>
                    )}
                </div>
            </Card>
        </div>
    );
};

export default MaterialDetailPage;
