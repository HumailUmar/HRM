import React, { useState } from 'react';
import { Upload } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { generateUUID } from '../lib/idHelper';

export default function DataImporter() {
  const dataService = useData();
  const [file, setFile] = useState<File | null>(null);
  const [columns, setColumns] = useState<string[]>([]);
  const [data, setData] = useState<Record<string, unknown>[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  const systemFields = ['Name', 'Email', 'Role', 'Department', 'Joining Date', 'Phone'];
  const supportedExtensions = ['.csv', '.xlsx', '.xls', '.tsv'];

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    if (selectedFile.size > 50 * 1024 * 1024) {
      setMessage('File exceeds the 50MB limit.');
      return;
    }
    const lowerName = selectedFile.name.toLowerCase();
    if (!supportedExtensions.some((extension) => lowerName.endsWith(extension))) {
      setMessage('Unsupported file type.');
      return;
    }

    setFile(selectedFile);
    setMessage(null);

    if (lowerName.endsWith('.csv') || lowerName.endsWith('.tsv')) {
      const Papa = (await import('papaparse')).default;
      Papa.parse(selectedFile, {
        header: true,
        preview: 5,
        delimiter: lowerName.endsWith('.tsv') ? '\t' : ',',
        skipEmptyLines: true,
        complete: (results) => {
          setColumns(results.meta.fields || []);
          setData(results.data);
        },
        error: (error) => setMessage(`Could not parse file: ${error.message}`),
      });
      return;
    }

    try {
      const buffer = await selectedFile.arrayBuffer();
      const { default: ExcelJS } = await import('exceljs');
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer);
      const worksheet = workbook.getWorksheet(1);
      if (!worksheet) {
        setMessage('The workbook has no first worksheet.');
        return;
      }

      const headerRow = worksheet.getRow(5);
      const cols: string[] = [];
      headerRow.eachCell((cell) => cols.push(cell.value?.toString() || ''));
      setColumns(cols);

      const previewData: Record<string, unknown>[] = [];
      for (let i = 6; i <= 10; i += 1) {
        const row = worksheet.getRow(i);
        const rowData: Record<string, unknown> = {};
        row.eachCell((cell, colNumber) => {
          const header = cols[colNumber - 1];
          if (header) rowData[header] = cell.value;
        });
        if (Object.keys(rowData).length > 0) previewData.push(rowData);
      }
      setData(previewData);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not parse workbook.');
    }
  };

  const handleImport = async () => {
    if (!file || data.length === 0) {
      setMessage('Select a file containing at least one data row.');
      return;
    }

    setIsImporting(true);
    setMessage(null);
    try {
      const employees = data.map((row) => {
        const mapped: Record<string, unknown> = {};
        Object.entries(mapping).forEach(([source, target]) => {
          if (target) mapped[target] = row[source];
        });
        return {
          id: generateUUID('EMP-'),
          name: String(mapped.Name ?? '').trim(),
          email: String(mapped.Email ?? '').trim(),
          role: String(mapped.Role ?? 'Employee'),
          departmentId: String(mapped.Department ?? '').trim() || undefined,
          joiningDate: String(mapped['Joining Date'] ?? '').trim(),
          phone: String(mapped.Phone ?? '').trim() || undefined,
          status: 'Onboarding' as const,
        };
      });

      const invalidRows = employees.filter((employee) => !employee.name || !employee.email || !employee.joiningDate);
      if (invalidRows.length > 0) {
        throw new Error(`${invalidRows.length} row(s) are missing Name, Email, or Joining Date.`);
      }
      await dataService.saveEmployees(employees);
      setMessage(`${employees.length} employee(s) imported successfully.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Import failed.');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Data Importer</h1>
      <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center bg-white/50 backdrop-blur-sm">
        <input type="file" onChange={handleFileUpload} className="hidden" id="file-upload" />
        <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center gap-2">
          <Upload size={48} className="text-indigo-500" />
          <span className="font-medium">Drag & Drop or Click to Upload</span>
          <span className="text-sm text-slate-500">CSV, XLS, XLSX, TSV (Max 50MB)</span>
        </label>
      </div>
      {message && <p role="status" className="text-sm text-slate-700">{message}</p>}
      {columns.length > 0 && (
        <div className="bg-white p-6 rounded-xl shadow space-y-4">
          <h2 className="text-lg font-bold">Column Mapping</h2>
          <div className="grid grid-cols-2 gap-4">
            {columns.map((col) => (
              <div key={col} className="flex items-center gap-2">
                <span className="flex-1 bg-slate-100 p-2 rounded">{col}</span>
                <span className="text-slate-400">→</span>
                <select className="flex-1 border p-2 rounded" value={mapping[col] || ''} onChange={(event) => setMapping({ ...mapping, [col]: event.target.value })}>
                  <option value="">Skip Column</option>
                  {systemFields.map((field) => <option key={field} value={field}>{field}</option>)}
                </select>
              </div>
            ))}
          </div>
          <button disabled={isImporting} onClick={handleImport} className="bg-indigo-600 text-white px-6 py-2 rounded-xl disabled:opacity-50">
            {isImporting ? 'Importing...' : 'Import Data'}
          </button>
        </div>
      )}
    </div>
  );
}
