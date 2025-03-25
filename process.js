const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Load DEPLOYMENT_ID from environment variable
const DEPLOYMENT_ID = process.env.DEPLOYMENT_ID;
if (!DEPLOYMENT_ID) {
  console.error('❌ DEPLOYMENT_ID is missing. Aborting...');
  process.exit(1);
}

const API_URL = `https://script.google.com/macros/s/${DEPLOYMENT_ID}/exec?action=read&sheet=marhoom_enhanced`;
const DATA_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR);

const fetchAndProcess = async () => {
  try {
    console.log('📡 Fetching data...');
    const response = await axios.get(API_URL, {
      headers: { 'Content-Type': 'application/json' },
    });

    const marhooms = response.data.data;
    console.log(`✅ Fetched ${marhooms.length} records`);

    // Save the full response
    const allFile = path.join(DATA_DIR, 'allmarhooms.json');
    fs.writeFileSync(allFile, JSON.stringify(marhooms, null, 2));
    console.log('✅ Saved allmarhooms.json');

    // Filter status === true
    const activeMarhooms = marhooms.filter((m) => m.status === true);

    // Create DD-MM based files
    const dateWise = {};
    const monthWise = {};

    activeMarhooms.forEach((m) => {
      const [day, month] = m.original_date.split('-');
      const key = `${day}-${month}`;
      const monthKey = month;

      if (!dateWise[key]) dateWise[key] = [];
      dateWise[key].push(m);

      if (!monthWise[monthKey]) monthWise[monthKey] = [];
      monthWise[monthKey].push(m);
    });

    // Write DD-MM wise JSON files
    Object.entries(dateWise).forEach(([date, entries]) => {
      const filePath = path.join(DATA_DIR, `${date}.json`);
      fs.writeFileSync(filePath, JSON.stringify(entries, null, 2));
    });
    console.log('✅ Saved date-wise JSON files');

    // Write monthwise.json
    const monthwisePath = path.join(DATA_DIR, 'monthwise.json');
    fs.writeFileSync(monthwisePath, JSON.stringify(monthWise, null, 2));
    console.log('✅ Saved monthwise.json');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

fetchAndProcess();
