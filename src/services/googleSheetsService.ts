import { logger } from '../lib/logger';
import { getAccessToken } from '../lib/auth';
import { getSettings } from '../lib/storage';

const SHEETS_TIMEOUT_MS = 30000;

// Generic fetch with error handling, timeout, and Authorization header
async function callSheetsApi(endpoint: string, method = 'GET', body?: any) {
  const token = getAccessToken();
  const settings = getSettings();
  const spreadsheetId = settings.googleSheets.spreadsheetId;

  if (!token) {
    throw new Error('Google OAuth is not connected. Please connect in Settings.');
  }
  if (!spreadsheetId || spreadsheetId.includes('Placeholder')) {
    throw new Error('Google Sheet ID is not set. Please set it in Settings.');
  }

  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}${endpoint}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), SHEETS_TIMEOUT_MS);
  let response: Response;
  try {
    response = await fetch(url, {
      method,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
  } catch (err: any) {
    if (err?.name === 'AbortError') {
      throw new Error('Google Sheets request timed out after 30s');
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    const errText = await response.text();
    let parsedErr;
    try {
      parsedErr = JSON.parse(errText);
    } catch {
      parsedErr = errText;
    }
    logger.error('Sheets API Error:', parsedErr);
    throw new Error(parsedErr?.error?.message || `Google Sheets API error: ${response.statusText}`);
  }

  return response.json();
}

// Get the sheetId (number) of a sheet by its name (title)
async function getSheetIdByName(sheetName: string): Promise<number | null> {
  const metadata = await callSheetsApi('?fields=sheets.properties');
  const sheet = metadata.sheets?.find((s: any) => s.properties?.title === sheetName);
  return sheet ? sheet.properties.sheetId : null;
}

/**
 * Read data from a Google Sheet range.
 * Only returns [] when the spreadsheet is genuinely unconfigured. Any other
 * error is rethrown so callers surface it instead of masking as empty data.
 * Returns a distinguishable marker so callers can differentiate "not configured"
 * from "genuinely empty" if needed.
 */
export interface ReadSheetResult {
  values: any[][] | null;
  /** True when the sheet ID is not configured (data source missing). */
  notConfigured: boolean;
}

export async function readSheet(sheetName: string, range: string): Promise<any[][]> {
  try {
    const result = await callSheetsApi(`/values/${encodeURIComponent(sheetName)}!${range}`);
    return result.values || [];
  } catch (e: any) {
    if (e?.message === 'Google Sheet ID is not set. Please set it in Settings.') {
      // Return [] but also dispatch an event so the UI can warn about misconfiguration.
      if (typeof window !== 'undefined' && window.dispatchEvent) {
        window.dispatchEvent(new CustomEvent('hrm:gsheet-not-configured', { detail: { sheetName } }));
      }
      return [];
    }
    throw e;
  }
}

/**
 * Append data to a Google Sheet
 */
export async function appendToSheet(sheetName: string, values: any[][]): Promise<void> {
  await callSheetsApi(`/values/${encodeURIComponent(sheetName)}!A1:append?valueInputOption=USER_ENTERED`, 'POST', {
    values,
  });
}

/**
 * Update data in a Google Sheet range
 */
export async function updateSheet(sheetName: string, range: string, values: any[][]): Promise<void> {
  await callSheetsApi(`/values/${encodeURIComponent(sheetName)}!${range}?valueInputOption=USER_ENTERED`, 'PUT', {
    values,
  });
}

/**
 * Find a row by ID (checks the first column, index 0, for the specified ID)
 * Returns the 1-based row index, or -1 if not found.
 */
export async function findRowById(sheetName: string, id: string): Promise<number> {
  try {
    const rows = await readSheet(sheetName, 'A:A');
    for (let i = 0; i < rows.length; i++) {
      if (rows[i] && rows[i][0] === id) {
        return i + 1; // 1-based index
      }
    }
    return -1;
  } catch (e) {
    logger.error(`Error finding row by ID in ${sheetName}:`, e);
    return -1;
  }
}

/**
 * Delete a row by its 1-based row index
 */
export async function deleteRow(sheetName: string, rowIndex: number): Promise<void> {
  const sheetId = await getSheetIdByName(sheetName);
  if (sheetId === null) {
    throw new Error(`Sheet "${sheetName}" not found in spreadsheet.`);
  }

  const requestBody = {
    requests: [
      {
        deleteDimension: {
          range: {
            sheetId: sheetId,
            dimension: 'ROWS',
            startIndex: rowIndex - 1,
            endIndex: rowIndex,
          },
        },
      },
    ],
  };

  await callSheetsApi(':batchUpdate', 'POST', requestBody);
}

/**
 * Ensures a sheet exists, and creates it with the specified headers if it doesn't.
 */
export async function ensureSheetExists(sheetName: string, headers: string[]): Promise<void> {
  try {
    await readSheet(sheetName, 'A1:A1');
  } catch (e: any) {
    // Distinguish auth/rate-limit errors from genuinely missing sheets.
    const msg = (e?.message || '').toLowerCase();
    if (msg.includes('401') || msg.includes('403') || msg.includes('429') || msg.includes('quota')) {
      logger.error(`ensureSheetExists: cannot access "${sheetName}" — auth or rate limit:`, e?.message);
      return;
    }
    logger.info(`Sheet "${sheetName}" not found. Creating it...`);
    try {
      const requestBody = {
        requests: [
          {
            addSheet: {
              properties: {
                title: sheetName,
              },
            },
          },
        ],
      };
      await callSheetsApi(':batchUpdate', 'POST', requestBody);
      await updateSheet(sheetName, 'A1', [headers]);
    } catch (err: any) {
      logger.error(`Failed to auto-create sheet "${sheetName}":`, err);
    }
  }
}

/**
 * Upload a file to Google Drive under a specific folder, returning the Drive File ID
 */
export async function uploadToDrive(fileName: string, mimeType: string, content: string | Blob, folderId?: string): Promise<string> {
  const token = getAccessToken();
  if (!token) {
    throw new Error('Google OAuth is not connected.');
  }

  const metadata = {
    name: fileName,
    mimeType: mimeType,
    parents: folderId && folderId !== 'drive_folder_id_resumes_placeholder' ? [folderId] : undefined,
  };

  const form = new FormData();
  form.append(
    'metadata',
    new Blob([JSON.stringify(metadata)], { type: 'application/json' })
  );
  form.append('file', content instanceof Blob ? content : new Blob([content], { type: mimeType }));

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), SHEETS_TIMEOUT_MS);
  let response: Response;
  try {
    response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: form,
      signal: controller.signal,
    });
  } catch (err: any) {
    if (err?.name === 'AbortError') {
      throw new Error('Google Drive upload timed out after 30s');
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Google Drive upload failed: ${errText}`);
  }

  const result = await response.json();
  return result.id;
}
