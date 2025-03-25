const axios = require('axios');
const fs = require('fs');
const path = require('path');

const API_URL = `${process.env.API_BASE_URL}?action=read&sheet=marhoom_enhanced`;
const DATA_DIR = path.join(__dirname, 'data');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR);
}

async function fetchAndProcess() {
    try {
        const response = await axios.get(API_URL, { headers: { 'Content-Type': 'application/json' } });
        const allData = response.data.data;

        // Save the full API response
        fs.writeFileSync(path.join(DATA_DIR, 'allmarhooms.json'), JSON.stringify(allData, null, 2));

        const validMarhooms = allData.filter(m => m.status);

        const dayMonthGroups = {};  // For DD-MM files
        const monthGroups = {};     // For Month-wise grouping

        validMarhooms.forEach(m => {
            const [day, month, year] = m.original_date.split('-');
            const ddmm = `${day.padStart(2, '0')}-${month.padStart(2, '0')}`;
            const mm = month.padStart(2, '0');

            // Group by DD-MM
            if (!dayMonthGroups[ddmm]) dayMonthGroups[ddmm] = [];
            dayMonthGroups[ddmm].push(m);

            // Group by Month only
            if (!monthGroups[mm]) monthGroups[mm] = [];
            monthGroups[mm].push(m);
        });

        // Process DD-MM JSON files
        for (const dateKey in dayMonthGroups) {
            const filePath = path.join(DATA_DIR, `${dateKey}.json`);
            let existing = [];
            if (fs.existsSync(filePath)) {
                existing = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
            }

            const combined = mergeUnique(existing, dayMonthGroups[dateKey]);
            fs.writeFileSync(filePath, JSON.stringify(combined, null, 2));
        }

        // Write month-wise grouping
        fs.writeFileSync(path.join(DATA_DIR, 'monthwise.json'), JSON.stringify(monthGroups, null, 2));

        console.log('✅ Data processing completed.');
    } catch (err) {
        console.error('❌ Error:', err);
        process.exit(1);
    }
}

function mergeUnique(existing, newData) {
    const existingIds = new Set(existing.map(e => e.id));
    const merged = [...existing];
    newData.forEach(m => {
        if (!existingIds.has(m.id)) merged.push(m);
    });
    return merged;
}

fetchAndProcess();
