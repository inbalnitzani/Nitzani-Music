import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../supabaseClient';
import { FileText } from 'lucide-react';
import type { Log } from '../types/log.ts';
import { exportUsageReportPDF } from "../utils/exportUsageReportPDF";
import Pagination from '../components/Pagination.tsx';

export default function MonitoringPage() {
    const { t } = useTranslation();
    const [isLoading, setIsLoading] = useState(false);
    const [searchingHistory, setSearchingHistory] = useState<Log[]>([]);
    const [logsPerPage, setLogsPerPage] = useState(5); // default 5
    const [currentPage, setCurrentPage] = useState(1);
    const [totalLogs, setTotalLogs] = useState(0);

    const fetchLogs = async (page: number, pageSize = logsPerPage) => {
        try {
            setIsLoading(true);
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // Calculate range for pagination
            const from = (page - 1) * pageSize;
            const to = from + pageSize - 1;

            const { data, error, count } = await supabase.from('calc_logs').select('*', { count: 'exact' }).range(from, to).order('calculated_at', { ascending: false });
            if (error) {
                console.error('Error fetching logs table:', error);
            } else {
                setSearchingHistory(data);
                setTotalLogs(count ?? 0);
            }
        } catch (error) {
            console.error('Error fetching price table:', error);

        } finally {
            setIsLoading(false);
        }
    }

    // fetch logs table
    useEffect(() => {
        fetchLogs(1, logsPerPage);
    }, []);

    // handle pagination
    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= totalPages) setCurrentPage(newPage);
        fetchLogs(newPage, logsPerPage);
    };

    const totalPages = Math.ceil(totalLogs / logsPerPage)

    const handelPDFDownload = async (log: Log) => {
        await exportUsageReportPDF(
            [log],
            ["name", "company", "composition_name", "media", "production_type", "usage_duration_seconds", "territory", "total"],
            {
                name: "שם משתמש",
                company: "חברה",
                composition_name: "שם היצירה",
                media: "מדיה",
                production_type: "סוג הפקה",
                usage_duration_seconds: "משך שימוש (שניות)",
                territory: "טריטוריה",
                total: "מחיר"
            },
            `דו"ח שימוש - ${log.name}`
        );
    };

    return (
        <div className="p-4 sm:p-8">
            <div className="flex justify-between items-center mb-4 sm:mb-6">
                <h1 className="text-xl sm:text-2xl font-bold">{t('monitoring.monitoring')}</h1>
            </div>
            {/* Modern Tailwind Table */}
            {isLoading && (
                <div className="absolute inset-0 bg-white/50 flex items-center justify-center">
                    <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
            )}
            <div className="relative overflow-x-auto shadow-md sm:rounded-lg">
                <table className="w-full text-sm text-left text-gray-500">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                        <tr>
                            <th scope="col" className="px-6 py-3">{t('monitoring.user')}</th>
                            <th scope="col" className="hidden sm:table-cell px-6 py-3">{t('monitoring.company_name')}</th>
                            <th scope="col" className="hidden sm:table-cell px-6 py-3">{t('calculator.work_name')}</th>
                            <th scope="col" className="hidden sm:table-cell px-6 py-3">{t('calculator.media')}</th>
                            <th scope="col" className="hidden sm:table-cell px-6 py-3">{t('calculator.production_type')}</th>
                            <th scope="col" className="hidden sm:table-cell px-6 py-3">{t('calculator.duration')}</th>
                            <th scope="col" className="hidden sm:table-cell px-6 py-3">{t('calculator.territory')}</th>
                            <th scope="col" className="hidden sm:table-cell px-6 py-3">{t('monitoring.search_time')}</th>
                            <th scope="col" className="hidden sm:table-cell px-6 py-3">{t('monitoring.price')}</th>
                            <th scope="col" className="px-6 py-3">{t('monitoring.PDF')}</th>
                            <th scope="col" className="px-6 py-3">{t('monitoring.contacted')}</th>
                        </tr>
                    </thead>

                    <tbody>
                        {searchingHistory.map(item => (
                            <tr
                                key={item.id}
                                className="bg-white border-b hover:bg-gray-50 cursor-pointer">
                                <td className="px-6 py-4">{item.name}<br />{item.phone}<br />{item.email}</td>
                                <td className="hidden sm:table-cell px-6 py-4">{item.company}</td>
                                <td className="hidden sm:table-cell px-6 py-4">{item.composition_name}</td>
                                <td className="hidden sm:table-cell px-6 py-4">{item.media}</td>
                                <td className="hidden sm:table-cell px-6 py-4">{item.production_type}</td>
                                <td className="hidden sm:table-cell px-6 py-4 truncate max-w-xs">{item.usage_duration_seconds}</td>
                                <td className="hidden sm:table-cell px-6 py-4">{item.territory}</td>
                                <td className="hidden sm:table-cell px-6 py-4">{
                                    new Date(item.calculated_at).toLocaleDateString('he-IL', {
                                        day: '2-digit',
                                        month: '2-digit',
                                        year: '2-digit'
                                    })
                                }</td>
                                <td className="hidden sm:table-cell px-6 py-4">{item.total}</td>
                                <td className="px-6 py-4">
                                    <button
                                        onClick={() => handelPDFDownload(item)}
                                        className="text-[var(--color-primary)] hover:text-white hover:bg-[var(--color-primary)] p-2 rounded-full transition-colors"
                                        title="הורד PDF"
                                    >
                                        <FileText />
                                    </button>
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <input
                                        type="checkbox"
                                        checked={item.contacted ?? false}
                                        onChange={async () => {
                                            const { error } = await supabase
                                                .from('calc_logs')
                                                .update({ contacted: !item.contacted })
                                                .eq('id', item.id);

                                            if (error) {
                                                console.error('Error updating contacted status:', error.message);
                                                return;
                                            }


                                            setSearchingHistory(prev =>
                                                prev.map(log =>
                                                    log.id === item.id ? { ...log, contacted: !item.contacted } : log
                                                )
                                            );
                                        }}
                                        className="checkbox-base"
                                    />
                                </td>


                            </tr>
                        ))}
                    </tbody>
                </table>

                <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    totalItems={totalLogs}
                    pageSize={logsPerPage}
                    onPrev={() => handlePageChange(currentPage - 1)}
                    onNext={() => handlePageChange(currentPage + 1)}
                    onPageSizeChange={(newSize) => {
                        setLogsPerPage(newSize);
                        setCurrentPage(1);
                        fetchLogs(1, newSize);
                    }}
                />
            </div>
            </div>
            )
}