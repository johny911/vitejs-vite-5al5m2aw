
import React from 'react';

interface PageHeaderProps {
    title: string;
    subtitle?: string;
    children?: React.ReactNode;
}

const PageHeader: React.FC<PageHeaderProps> = ({ title, subtitle, children }) => {
    return (
        <div className="hidden lg:flex justify-between items-center mb-6">
            <div>
                <h1 className="text-2xl font-bold text-neutral-900">{title}</h1>
                {subtitle && <p className="text-neutral-500 mt-1">{subtitle}</p>}
            </div>
            {children && <div className="flex items-center space-x-2">{children}</div>}
        </div>
    );
};

export default PageHeader;
