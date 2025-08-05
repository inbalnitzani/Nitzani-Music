import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../supabaseClient';
import { FileText } from 'lucide-react';
import type { Log } from '../types/log.ts';
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

            const { data, error,count } = await supabase.from('calc_logs').select('*', { count: 'exact' }).range(from, to).order('calculated_at', { ascending: false });
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
        fetchLogs(1,logsPerPage);
    }, []);

    // handle pagination
    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= totalPages) setCurrentPage(newPage);
        fetchLogs(newPage, logsPerPage);
    };

    const totalPages = Math.ceil(totalLogs / logsPerPage)

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
                            <th scope="col" className="px-6 py-3">{t('monitoring.company_name')}</th>
                            <th scope="col" className="px-6 py-3">{t('calculator.work_name')}</th>
                            <th scope="col" className="px-6 py-3">{t('calculator.media')}</th>
                            <th scope="col" className="px-6 py-3">{t('calculator.production_type')}</th>
                            <th scope="col" className="px-6 py-3">{t('calculator.duration')}</th>
                            <th scope="col" className="px-6 py-3">{t('calculator.territory')}</th>
                            <th scope="col" className="px-6 py-3">{t('monitoring.search_time')}</th>
                            <th scope="col" className="px-6 py-3">{t('monitoring.price')}</th>
                            <th scope="col" className="px-6 py-3">{t('monitoring.PDF')}</th>
                        </tr>
                    </thead>

                    <tbody>
                        {searchingHistory.map(item => (
                            <tr
                                key={item.id}
                                className="bg-white border-b hover:bg-gray-50 cursor-pointer">
                                <td className="px-6 py-4">{item.name}<br />{item.phone}<br />{item.email}</td>
                                <td className="px-6 py-4">{item.company}</td>
                                <td className="px-6 py-4">{item.composition_name}</td>
                                <td className="px-6 py-4">{item.media}</td>
                                <td className="px-6 py-4">{item.production_type}</td>
                                <td className="px-6 py-4 truncate max-w-xs">{item.usage_duration_seconds}</td>
                                <td className="px-6 py-4">{item.territory}</td>
                                <td className="px-6 py-4">{
                                    new Date(item.calculated_at).toLocaleDateString('he-IL', {
                                        day: '2-digit',
                                        month: '2-digit',
                                        year: '2-digit'
                                    })
                                }</td>
                                <td className="px-6 py-4">{item.total}</td>
                                <td className="px-6 py-4"><FileText /></td>

                            </tr>
                        ))}
                    </tbody>
                </table>

            </div>
            <div className="relative flex justify-center items-center gap-2 mt-6">
                {/* Pagination controls (centered) */}
                <button
                    className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                >
                    {t('songs.prev')}
                </button>
                <span className="mx-2">{t('songs.page')} {currentPage} {t('songs.of')} {totalPages}</span>
                <button
                    className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                >
                    {t('songs.next')}
                </button>

                {/* page size */}
                <select
                    value={logsPerPage}
                    onChange={e => {
                        const newSize = Number((e.target as HTMLSelectElement).value);
                        setLogsPerPage(newSize);
                        setCurrentPage(1);
                        fetchLogs(1, newSize);
                    }}
                    className="border rounded px-2 py-1 w-24"
                >
                    {[5, 10, 20, 50, 100].map(size => (
                        <option key={size} value={size}>{size}</option>
                    ))}
                </select>

                {/*  total songs on the left */}
                <div className="flex items-center gap-2 absolute left-0">

                    <span className="text-sm text-gray-500">{t('songs.songs_in_table')}: {totalLogs}</span>
                </div>
            </div>
        </div>
    )
}