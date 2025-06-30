import React, { useState } from "react";
import { useTranslation } from "react-i18next";

// Add index signatures for type safety
interface PriceTable {
  [productionType: string]: {
    [media: string]: {
      [territory: string]: number[];
    };
  };
}

const priceTable: PriceTable = {
  drama: {
    "פסטיבלים": {
      "ישראל": [1000, 1200, 1380, 1520, 104],
      "עולם": [1668, 2000, 2300, 2532, 172]
    },
    "קולנוע": {
      "ישראל": [4000, 4800, 5520, 6072, 416],
      "עולם": [6000, 7200, 8280, 9108, 620]
    },
    "אינטרנט": {
      "ישראל": [3233, 3880, 5355, 8140, 323],
      "עולם": [5180, 6216, 8580, 13040, 518]
    },
    "טלויזיה": {
      "ישראל": [6667, 8000, 9200, 10120, 691],
      "עולם": [10000, 12000, 13800, 15180, 1036]
    },
    "DVD": {
      "ישראל": [1200, 1440, 1656, 1820, 124],
      "עולם": [2000, 2400, 2760, 3036, 208]
    },
    "פסטיבלים + טלויזיה": {
      "ישראל + עולם": [11400, 13680, 15732, 17308, 1180]
    },
    "פסטיבלים + הקרנות לא מסחריות": {
      "ישראל": [2000, 2400, 2760, 3038, 208]
    },
    "פסטיבלים (ישראל+ עולם) +  בתי קולנוע בארץ": {
      "ישראל + עולם": [6000, 7200, 8280, 9108, 620]
    },
    "בתי קולנוע": {
      "ישראל + עולם": [9000, 10800, 12420, 13664, 932]
    },
    "כל המדיות בארץ + פסטיבלים בעולם": {
      "ישראל + עולם": [7080, 8496, 9772, 10748, 732]
    },
    "כל המדיות": {
      "עולם": [16200, 19440, 22356, 24592, 1676]
    },
    "חבילת בסיס": {
      "ישראל + עולם": [19400, 23280, 26772, 29542, 2008]
    }
  },
  docu: {
    "פסטיבלים": {
      "ישראל": [600, 720, 828, 912, 64],
      "עולם": [1000, 1200, 1380, 1520, 104]
    },
    "קולנוע": {
      "ישראל": [2000, 2400, 2760, 3036, 208],
      "עולם": [3200, 3840, 4416, 4856, 332]
    },
    "אינטרנט": {
      "ישראל": [1800, 2160, 2980, 4530, 180],
      "עולם": [2900, 3480, 4802, 7300, 290]
    },
    "טלויזיה": {
      "ישראל": [4000, 4800, 5520, 6072, 413],
      "עולם": [6000, 7200, 8280, 9108, 620]
    },
    "DVD": {
      "ישראל": [600, 720, 828, 912, 64],
      "עולם": [1000, 1200, 1380, 1520, 104]
    },
    "פסטיבלים + טלויזיה": {
      "ישראל + עולם": [6840, 8208, 9440, 10384, 708]
    },
    "פסטיבלים + הקרנות לא מסחריות": {
      "ישראל": [1100, 1320, 1518, 1671, 116]
    },
    "פסטיבלים + בתי קולנוע": {
      "ישראל + עולם": [3240, 3888, 4472, 4920, 336]
    },
    "בתי קולנוע": {
      "ישראל + עולם": [4680, 5616, 6460, 7104, 484]
    },
    "כל המדיות בארץ + פסטיבלים": {
      "עולם": [3780, 4536, 5216, 5740, 392]
    },
    "כל המדיות": {
      "עולם": [9180, 11016, 12668, 13936, 952]
    },
    "חבילת בסיס": {
      "ישראל + עולם": [10800, 12960, 14904, 16396, 1116]
    }
  }
};

const CalculatorPage: React.FC = () => {
  const { t } = useTranslation();
  const [productionType, setProductionType] = useState("docu");
  const [media, setMedia] = useState("");
  const [territory, setTerritory] = useState("");
  const [duration, setDuration] = useState(60);
  const [result, setResult] = useState<null | { total: number }>(null);
  const [name, setName] = useState("");

  // Get media options for selected production type
  const mediaOptions = Object.keys(priceTable[productionType]);

  // Get territory options for selected media
  const territoryOptions = media
    ? Object.keys(priceTable[productionType][media])
    : [];

  // If media changes, reset territory
  React.useEffect(() => {
    if (media) {
      const terrs = Object.keys(priceTable[productionType][media]);
      setTerritory(terrs.length === 1 ? terrs[0] : "");
    } else {
      setTerritory("");
    }
  }, [media, productionType]);

  const handleCalculate = () => {
    if (!productionType || !media || !territory) return;
    const prices = priceTable[productionType][media][territory];
    if (!prices) return;
    
    let base = 0;
    if (duration < 5) {
      base = prices[duration - 1];
    } else {
      base = prices[4] * (duration - 4) + prices[3];
    }
    setResult({ total: base });
  };

  return (
    <div className="max-w-xl mx-auto py-8 px-4 text-right rtl">
      <div className="bg-white shadow-lg rounded-xl p-6 sm:p-10 space-y-6 border border-gray-100">

        <h1 className="text-xl sm:text-2xl font-bold text-gray-800 mb-6 text-center">
          {t('calculator.title')}
        </h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">שם היצירה</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500 bg-white" />
            </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
             {t('calculator.production_type')}
            </label>
            <select
              value={productionType}
              onChange={e => {
                setProductionType(e.target.value);
                setMedia("");
              }}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
            >
              <option value="docu">דוקומנטרי</option>
              <option value="drama">עלילתי</option>
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
              {mediaOptions.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('territory')}
            </label>
            <select
              value={territory}
              onChange={e => setTerritory(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
              disabled={!media}
            >
              <option value="">{t('calculator.select_territory')}</option>
              {territoryOptions.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
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
      </div>

    </div>
  );
};

export default CalculatorPage;