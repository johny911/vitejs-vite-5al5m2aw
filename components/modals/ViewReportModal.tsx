
import React, { useRef, useState } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { LabourTeam, LabourType, Material } from '../../types';
import { UsersIcon, BoxIcon, DownloadIcon } from '../icons';
import { useAuth } from '../../hooks/useAuth';
import PdfReportLayout from '../pdf/PdfReportLayout';

// Declare global variables from CDN scripts for TypeScript
declare const html2canvas: any;
declare const jspdf: any;

interface ViewReportModalProps {
    isOpen: boolean;
    onClose: () => void;
    report: any;
    teams: LabourTeam[];
    types: LabourType[];
    materials: Material[];
    projectName: string;
}

const ViewReportModal: React.FC<ViewReportModalProps> = ({ isOpen, onClose, report, teams, types, materials, projectName }) => {
    const pdfLayoutRef = useRef<HTMLDivElement>(null);
    const [isDownloading, setIsDownloading] = useState(false);
    const { user } = useAuth();
    
    const handleDownloadPdf = async () => {
        if (!pdfLayoutRef.current) return;
        setIsDownloading(true);

        const input = pdfLayoutRef.current;
        try {
            const canvas = await html2canvas(input, { scale: 2 });
            const imgData = canvas.toDataURL('image/png');
            
            const { jsPDF } = jspdf;
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            
            const imgProps = pdf.getImageProperties(imgData);
            const imgHeight = (imgProps.height * pdfWidth) / imgProps.width;
            const pdfHeight = pdf.internal.pageSize.getHeight();
            
            let heightLeft = imgHeight;
            let position = 0;
            
            pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
            heightLeft -= pdfHeight;
            
            while (heightLeft > 0) {
              position = heightLeft - imgHeight;
              pdf.addPage();
              pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
              heightLeft -= pdfHeight;
            }
    
            pdf.save(`Work-Report-${report.date}.pdf`);
        } catch (error) {
            console.error("Error generating PDF:", error);
            alert("Sorry, there was an error generating the PDF.");
        } finally {
            setIsDownloading(false);
        }
    };

    if (!report) return null;

    const ReportBody = () => (
        <div className="space-y-4">
            {report.work_items.map((item: any) => (
                <div key={item.id} className="p-3 bg-neutral-50 rounded-lg break-inside-avoid">
                    <p className="font-bold text-neutral-800">{item.description}</p>
                    <p className="text-sm text-neutral-600">{item.quantity} {item.uom}</p>
                    
                    {item.labour_allocations.length > 0 && (
                        <div className="mt-2 pt-2 border-t">
                            <h5 className="text-xs font-semibold text-neutral-500 mb-1 flex items-center"><UsersIcon className="w-3 h-3 mr-1.5" />Labour</h5>
                            <ul className="text-xs space-y-0.5 pl-4">
                                {item.labour_allocations.map((alloc: any) => (
                                    <li key={alloc.id} className="flex justify-between">
                                        <span>{teams.find(t=>t.id===alloc.team_id)?.name} - {types.find(t=>t.id===alloc.type_id)?.name}</span>
                                        <span className="font-semibold">{alloc.count}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                    {item.material_consumptions.length > 0 && (
                        <div className="mt-2 pt-2 border-t">
                            <h5 className="text-xs font-semibold text-neutral-500 mb-1 flex items-center"><BoxIcon className="w-3 h-3 mr-1.5" />Materials</h5>
                            <ul className="text-xs space-y-0.5 pl-4">
                                {item.material_consumptions.map((mat: any) => (
                                    <li key={mat.id} className="flex justify-between">
                                        <span>{materials.find(m=>m.id===mat.material_id)?.name}</span>
                                        <span className="font-semibold">{mat.quantity} {materials.find(m=>m.id===mat.material_id)?.unit}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            ))}
        </div>
    );

    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <>
                {/* Visible Content */}
                <div className="bg-white p-4 max-h-[70vh] overflow-y-auto">
                    <h3 className="text-xl font-bold text-center mb-2">Work Report</h3>
                     <p className="text-center text-sm text-neutral-500 mb-1">
                        Project: <span className="font-semibold">{projectName}</span>
                    </p>
                    <p className="text-center text-sm text-neutral-500 mb-4">
                        Date: {new Date(report.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}
                    </p>
                    <div className="border-t pt-4">
                        <ReportBody />
                    </div>
                </div>
                
                <div className="mt-4 flex flex-col sm:flex-row-reverse gap-2">
                    <Button onClick={onClose} fullWidth variant="secondary">Close</Button>
                    <Button onClick={handleDownloadPdf} fullWidth variant="primary" disabled={isDownloading}>
                        <DownloadIcon className="w-5 h-5 mr-2" />
                        {isDownloading ? 'Downloading...' : 'Download as PDF'}
                    </Button>
                </div>

                {/* Hidden Layout for PDF Generation */}
                <div className="absolute -left-[9999px] -top-[9999px]">
                    {user && (
                        <PdfReportLayout
                            ref={pdfLayoutRef}
                            title="Work Report"
                            projectName={projectName}
                            reportDate={report.date}
                            generatedBy={user.name}
                        >
                            <ReportBody />
                        </PdfReportLayout>
                    )}
                </div>
            </>
        </Modal>
    );
};

export default ViewReportModal;
