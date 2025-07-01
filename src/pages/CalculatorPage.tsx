import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "../supabaseClient";

export interface PriceRow {
  id: number;
  license_type: string;   // "עלילתי" or "דוקומנטרי"
  media_type: string;     // e.g. "פסטיבלים"
  territory: string;      // e.g. "ישראל"
  level_1: number;
  level_2: number;
  level_3: number;
  level_4: number;
  vat_amount: number;
}

type PriceTable = PriceRow[];

const SERVICE_FEE = 1.5;

const CalculatorPage: React.FC = () => {

    const { t } = useTranslation();
    const [productionType, setProductionType] = useState("עלילתי");
    const [media, setMedia] = useState("");
    const [territory, setTerritory] = useState("");
    const [duration, setDuration] = useState(60);
    const [result, setResult] = useState<null | { total: number }>(null);
    const [name, setName] = useState("");
    const [priceTable, setPriceTable] = useState<PriceTable>([]);

    // set price table
    const fetchPriceTable = async () => {
        try {
            const { data, error } = await supabase.from('price_table').select('*');
            if (error) {
                console.error('Error fetching price table:', error);
            } else {
                setPriceTable(data as unknown as PriceTable);
            }
        } catch (error) {
            console.error('Error fetching price table:', error);
        }
    }

    // fetch price table
    useEffect(() => {
        fetchPriceTable();
    }, []);

    // calculate price
    const handleCalculate = () => {
        if (!productionType || !media || !territory || !name || !duration) {
            alert("יש למלא את כל השדות");
            return;
        }
        const row = priceTable.find(
            row =>
                row.license_type === productionType &&
                row.media_type === media &&
                row.territory === territory
        );
        if (!row) return;

        let base = 0;
        if (duration < 5) {
            base = row[`level_${duration}` as keyof PriceRow] as number;
        } else {
            base = row.level_4 + (duration - 4) * row.vat_amount;
        }
        const total = base * SERVICE_FEE;
        setResult({ total });
    };

    const mediaOptions = Array.from(
      new Set(
        priceTable
          .filter(row => row.license_type === productionType)
          .map(row => row.media_type)
      )
    );

    const territoryOptions = priceTable.length
      ? Array.from(
          new Set(
            priceTable
              .filter(row => row.license_type === productionType && row.media_type === media)
              .map(row => row.territory)
          )
        )
      : [];

    return (
        <div className="max-w-xl mx-auto py-8 px-4 text-right rtl">
            <div className="bg-white shadow-lg rounded-xl p-6 sm:p-10 space-y-6 border border-gray-100">

                <h1 className="text-xl sm:text-2xl font-bold text-gray-800 mb-6 text-center">
                    {t('calculator.title')}
                </h1>
                {/* work name */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('calculator.work_name')}</label>
                        <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500 bg-white"  />
                    </div>
                    {/* production type */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            {t('calculator.production_type')}
                        </label>
                        <select
                            value={productionType}
                            onChange={e => {
                                const newProductionType = e.target.value;
                                setProductionType(newProductionType);
                                const newMediaOptions = Array.from(
                                    new Set(
                                        priceTable
                                            .filter(row => row.license_type === newProductionType)
                                            .map(row => row.media_type)
                                    )
                                );
                                setMedia(newMediaOptions[0] || "");
                                setTerritory("");
                            }}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                        >
                            <option value="עלילתי">{t('calculator.עלילתי')}</option>
                            <option value="דוקומנטרי">{t('calculator.דוקומנטרי')}</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            {t('calculator.media')}
                        </label>
                        <select
                            value={media}
                            onChange={e => setMedia(e.target.value)}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                        >
                            <option value="">{t('calculator.select_media')}</option>
                            {mediaOptions.map(media => (
                                <option key={media} value={media}>{t(`calculator.${media}`)}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            {t('calculator.territory')}
                        </label>
                        <select
                            value={territory}
                            onChange={e => setTerritory(e.target.value)}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                            disabled={!media}
                        >
                            <option value="">{t('calculator.select_territory')}</option>
                            {territoryOptions.map(territory => (
                                <option key={territory} value={territory}>{t(`calculator.${territory}`)}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            {t('calculator.duration')}
                        </label>
                        <select
                            value={duration}
                            onChange={e => setDuration(Number(e.target.value))}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                        >
                            <option value="1">{t('calculator.duration_1')}</option>
                            <option value="2">{t('calculator.duration_2')}</option>
                            <option value="3">{t('calculator.duration_3')}</option>
                            <option value="4">{t('calculator.duration_4')}</option>
                            <option value="5">{t('calculator.duration_5')}</option>
                        </select>
                    </div>
                </div>
                <div className="flex justify-center mt-6">
                    <button
                        onClick={handleCalculate}
                        className="px-8 py-2 text-lg rounded-lg bg-blue-600 hover:bg-blue-700 transition text-white shadow-md"
                    >
                        {t('calculator.calculate')}
                    </button>
                </div>
                {result && (
                    <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
                        <p className="text-xl font-bold text-blue-800 mb-2">
                            {t('calculator.result', { price: result.total })}
                        </p>
                    </div>
                )}
                {media === "חבילת בסיס" && (
                    <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-gray-800">
                        <p className="font-semibold mb-1">{t('calculator.media_explanation_title')}</p>
                        <p>{t('calculator.media_explanation')}</p>
                    </div>
                )}
            </div>

        </div>
    );
};

export default CalculatorPage;