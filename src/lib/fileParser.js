import Papa from 'papaparse';
import * as XLSX from 'xlsx';

export function parseCSV(file) {
    return new Promise((resolve, reject) => {
        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            dynamicTyping: true,
            complete: (results) => {
                const columns = results.meta.fields || [];
                const rows = results.data;
                resolve({ columns, rows });
            },
            error: (err) => reject(err),
        });
    });
}

export function parseExcel(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
                if (jsonData.length === 0) return resolve({ columns: [], rows: [] });
                const columns = jsonData[0].map(String);
                const rows = jsonData.slice(1).map((row) => {
                    const obj = {};
                    columns.forEach((col, i) => {
                        obj[col] = row[i] !== undefined ? row[i] : null;
                    });
                    return obj;
                });
                resolve({ columns, rows });
            } catch (err) {
                reject(err);
            }
        };
        reader.onerror = reject;
        reader.readAsArrayBuffer(file);
    });
}

export function parseText(text) {
    const result = Papa.parse(text, {
        header: true,
        skipEmptyLines: true,
        dynamicTyping: true,
    });
    return { columns: result.meta.fields || [], rows: result.data };
}

export async function dispatchFile(file) {
    const ext = file.name.split('.').pop().toLowerCase();
    if (ext === 'csv' || ext === 'txt') return parseCSV(file);
    if (ext === 'xlsx' || ext === 'xls') return parseExcel(file);
    // fall back to CSV parser
    return parseCSV(file);
}
