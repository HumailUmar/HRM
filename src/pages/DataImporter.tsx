import React, { useState } from 'react';
import { Upload } from 'lucide-react';

export default function DataImporter() {
  const [file, setFile] = useState<File | null>(null);
  const [columns, setColumns] = useState<string[]>([]);
  const [data, setData] = useState<any[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});

  const systemFields = ['Name', 'Email', 'Role', 'Department', 'Joining Date', 'Phone'];

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    setFile(selectedFile);

    if (selectedFile.name.endsWith('.csv')) {
      const Papa = (await import('papaparse')).default;
      Papa.parse(selectedFile, {
        header: true,
        preview: 5,
        complete: (results) => {
          setColumns(results.meta.fields || []);
          setData(results.data);
        },
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      const buffer = event.target?.result as ArrayBuffer;
      const { default: ExcelJS } = await import('exceljs');
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer);
      const worksheet = workbook.getWorksheet(1);

      if (!worksheet) return;

      const headerRow = worksheet.getRow(5);
      const cols: string[] = [];
      headerRow.eachCell((cell) => {
        cols.push(cell.value?.toString() || '');
      });
      setColumns(cols);

      const previewData: any[] = [];
      for (let i = 6; i <= 10; i++) {
        const row = worksheet.getRow(i);
        const rowData: Record<string, any> = {};
        row.eachCell((cell, colNumber) => {
          const header = cols[colNumber - 1];
          if (header) {
            rowData[header] = cell.value;
          }
        });
        if (Object.keys(rowData).length > 0) {
          previewData.push(rowData);
        }
      }
      setData(previewData);
    };
    reader.readAsArrayBuffer(selectedFile);
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

      {columns.length > 0 && (
        <div className="bg-white p-6 rounded-xl shadow space-y-4">
          <h2 className="text-lg font-bold">Column Mapping</h2>
          <div className="grid grid-cols-2 gap-4">
            {columns.map((col) => (
              <div key={col} className="flex items-center gap-2">
                <span className="flex-1 bg-slate-100 p-2 rounded">{col}</span>
                <span className="text-slate-400">→</span>
                <select
                  className="flex-1 border p-2 rounded"
                  value={mapping[col] || ''}
                  onChange={(event) => setMapping({ ...mapping, [col]: event.target.value })}
                >
                  <option value="">Skip Column</option>
                  {systemFields.map((field) => (
                    <option key={field} value={field}>
                      {field}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
          <button className="bg-indigo-600 text-white px-6 py-2 rounded-xl">Import Data</button>
        </div>
      )}
    </div>
  );
}
