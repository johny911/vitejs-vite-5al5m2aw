
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { supabase } from '../core/auth/supabase';
import Card from '../components/ui/Card';
import PageHeader from '../components/ui/PageHeader';
import { UsersIcon, ChevronRightIcon, DownloadIcon } from '../components/icons';
import Modal from '../components/ui/Modal';
import Button from '../components/ui/Button';
import PdfReportLayout from '../components/pdf/PdfReportLayout';
import { useAuth } from '../core/auth/useAuth';
import SkeletonCard from '../components/ui/SkeletonCard';

// Declare global variables from CDN scripts for TypeScript
declare const html2canvas: any;
declare const jspdf: any;

// A shared component to display attendance details, now using joined data
const AttendanceDetail: React.FC<{ records: any[] }> = ({ records }) => {
    const summary = useMemo(() => {
        return records.reduce((acc, record) => {
            const teamName = record.labour_teams?.name || 'Unknown Team';
            const typeName = record.labour_types?.name || 'Unknown Type';
            if (!acc[teamName]) {
                acc[teamName] = [];
            }
            acc[teamName].push({ typeName, count: record.count });
            return acc;
        }, {} as Record<string, { typeName: string, count: number }[]>);
    }, [records]);

    if (records.length === 0) {
        return <p className="text-neutral-500 text-center py-4">No records for this date.</p>;
    }

    return (
        <div className="space-y-3">
            {Object.entries(summary).map(([teamName, typeDetails]) => (
                <div key={teamName} className="p-3 bg-primary-50 rounded-lg break-inside-avoid">
                    <p className="font-bold text-primary-800 flex items-center mb-2">
                        <UsersIcon className="w-5 h-5 mr-2"/>
                        {teamName}
                    </p>
                    <div className="space-y-1 pl-7 text-sm">
                        {/* FIX: Add an Array.isArray check to prevent runtime errors if typeDetails is not an array. */}
                        {Array.isArray(typeDetails) && typeDetails.map(t => (
                            <div key={t.typeName} className="flex justify-between items-center">
                                <span className="text-neutral-700">{t.typeName}</span>
                                <span className="font-bold text-neutral-800 bg-white px-2 py-0.5 rounded-md">{t.count}</span>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
};


const AttendanceHistoryPage: React.FC = () => {
    const [history, setHistory] = useState<Record<string, any[]>>({});
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const [isDownloading, setIsDownloading] = useState(false);
    const pdfLayoutRef = useRef<HTMLDivElement>(null);
    const { user } = useAuth();

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            const { data, error } = await supabase
                .from('attendance_records')
                .select('*, labour_teams(name), labour_types(name), projects(name)')
                .order('date', { ascending: false });

            if (data) {
                const groupedByDate = data.reduce((acc, record) => {
                    const date = record.date;
                    if (!acc[date]) {
                        acc[date] = [];
                    }
                    acc[date].push(record);
                    return acc;
                }, {} as Record<string, any[]>);
                setHistory(groupedByDate);
            }
            if (error) {
                console.error("Error fetching attendance history:", error);
                alert("Could not load attendance history.");
            }

            setLoading(false);
        };
        fetchData();
    }, []);

    const handleDownloadPdf = async () => {
        if (!pdfLayoutRef.current) return;
        setIsDownloading(true);
    
        try {
            const { jsPDF } = jspdf;
            const canvas = await html2canvas(pdfLayoutRef.current, { scale: 2 });
            const imgData = canvas.toDataURL('image/png');
    
            const pdf = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
    
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const imgProps = pdf.getImageProperties(imgData);
            const imgHeight = (imgProps.height * pdfWidth) / imgProps.width;
            
            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, imgHeight);
            pdf.save(`Attendance-Report-${selectedDate}.pdf`);
    
        } catch (error) {
            console.error("Error generating PDF:", error);
            alert("Sorry, there was an error generating the PDF.");
        } finally {
            setIsDownloading(false);
        }
    };

    const sortedDates = useMemo(() => Object.keys(history).sort((a, b) => new Date(b).getTime() - new Date(a).getTime()), [history]);
    
    const selectedProjectName = useMemo(() => {
        if (!selectedDate || !history[selectedDate] || history[selectedDate].length === 0) return 'N/A';
        return history[selectedDate][0].projects?.name || 'Unknown Project';
    }, [selectedDate, history]);

    if (loading) {
        return (
            <div className="p-4 lg:p-0 space-y-4">
                <PageHeader title="Attendance History" subtitle="Review past attendance records." />
                <SkeletonCard />
                <SkeletonCard />
                <SkeletonCard />
                <SkeletonCard />
            </div>
        );
    }

    return (
        <div className="p-4 lg:p-0 space-y-4">
            <PageHeader title="Attendance History" subtitle="Review past attendance records." />

            {sortedDates.length === 0 ? (
                <Card><p className="text-center py-8 text-neutral-500">No attendance history found.</p></Card>
            ) : (
                sortedDates.map(date => {
                    const records = history[date];
                    const totalLabour = records.reduce((sum, rec) => sum + rec.count, 0);
                    return (
                        <Card key={date} onClick={() => setSelectedDate(date)}>
                            <div className="flex justify-between items-center">
                                <div>
                                    <p className="font-bold text-lg text-neutral-800">{new Date(date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                                    <p className="text-sm text-neutral-500">Total Labour: {totalLabour}</p>
                                </div>
                                <ChevronRightIcon className="w-5 h-5 text-neutral-400" />
                            </div>
                        </Card>
                    );
                })
            )}

            <Modal isOpen={!!selectedDate} onClose={() => setSelectedDate(null)}>
                <>
                    {/* Visible Content */}
                    <div className="bg-white p-4 max-h-[70vh] overflow-y-auto">
                        <h3 className="text-xl font-bold text-center mb-2">Attendance Summary</h3>
                        <p className="text-center text-sm text-neutral-600 mb-4">
                            Date: {selectedDate && new Date(selectedDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}
                        </p>
                        <div className="mt-4 border-t pt-4">
                            {selectedDate && <AttendanceDetail records={history[selectedDate] || []} />}
                        </div>
                    </div>
                    <div className="mt-4 flex flex-col sm:flex-row-reverse gap-2">
                        <Button onClick={() => setSelectedDate(null)} fullWidth variant="secondary">Close</Button>
                        <Button onClick={handleDownloadPdf} fullWidth variant="primary" disabled={isDownloading}>
                            <DownloadIcon className="w-5 h-5 mr-2" />
                            {isDownloading ? 'Downloading...' : 'Download as PDF'}
                        </Button>
                    </div>

                    {/* Hidden Layout for PDF */}
                    <div className="absolute -left-[9999px] -top-[9999px]">
                        {selectedDate && user && (
                            <PdfReportLayout
                                ref={pdfLayoutRef}
                                title="Attendance Report"
                                projectName={selectedProjectName}
                                reportDate={selectedDate}
                                generatedBy={user.name}
                            >
                                {selectedDate && <AttendanceDetail records={history[selectedDate] || []} />}
                            </PdfReportLayout>
                        )}
                    </div>
                </>
            </Modal>
        </div>
    );
};

export default AttendanceHistoryPage;
