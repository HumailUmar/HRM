import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Employee, PayrollRecord, AppSettings, Department, Designation } from '../types';
import { getEmployeeDepartment, getEmployeeDesignation, getEmployeeBaseSalary } from '../lib/employeeUtils';

export function exportEmployeeDirectoryToPDF(employees: Employee[], settings: AppSettings, departments: Department[], designations: Designation[]) {
  const doc = new jsPDF();
  const company = settings.companySettings || {
    companyName: 'HumailEli HRM',
    companyEmail: 'info@humaileli.com',
    companyPhone: '+1 555-0199',
    companyAddress: 'HR Headquarters, Suite 100'
  };

  // --- BRANDING HEADER ---
  // Accent Bar
  doc.setFillColor(79, 70, 229); // Violet/Indigo #4F46E5
  doc.rect(0, 0, 210, 8, 'F');

  // Company Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(30, 41, 59); // Slate 800
  doc.text(company.companyName, 14, 25);

  // Document Title
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139); // Slate 500
  doc.text('INTERNAL EMPLOYEE LIFECYCLE DIRECTORY', 14, 31);

  // Company Contact Details (Right-aligned)
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105); // Slate 600
  doc.text(`Email: ${company.companyEmail}`, 196, 22, { align: 'right' });
  doc.text(`Phone: ${company.companyPhone}`, 196, 27, { align: 'right' });
  doc.text(`Address: ${company.companyAddress}`, 196, 32, { align: 'right' });

  // Thin separator line
  doc.setDrawColor(226, 232, 240); // Slate 200
  doc.setLineWidth(0.5);
  doc.line(14, 38, 196, 38);

  // --- SUMMARY / METADATA ---
  const activeCount = employees.filter(e => e.status === 'Active').length;
  const onboardingCount = employees.filter(e => e.status === 'Onboarding').length;
  const terminatedCount = employees.filter(e => e.status === 'Terminated').length;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42); // Slate 900
  doc.text('Directory Overview', 14, 48);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(71, 85, 105);
  doc.text(`Date Generated: ${new Date().toLocaleDateString()}`, 14, 55);
  doc.text(`Total Personnel: ${employees.length}`, 14, 61);
  doc.text(`Active: ${activeCount}  |  Onboarding: ${onboardingCount}  |  Offboarded: ${terminatedCount}`, 14, 67);

  // --- DATA TABLE ---
  const tableRows = employees.map(emp => [
    emp.id,
    emp.name,
    getEmployeeDesignation(emp, designations),
    getEmployeeDepartment(emp, departments),
    emp.employment.joiningDate,
    `$${getEmployeeBaseSalary(emp).toLocaleString()}`,
    emp.status
  ]);

  autoTable(doc, {
    startY: 75,
    head: [['ID', 'Full Name', 'Role', 'Department', 'Joining Date', 'Base Salary', 'Status']],
    body: tableRows,
    theme: 'striped',
    headStyles: {
      fillColor: [79, 70, 229], // matching Indigo/Violet brand theme
      textColor: [255, 255, 255],
      font: 'helvetica',
      fontStyle: 'bold',
      fontSize: 10,
      halign: 'left'
    },
    bodyStyles: {
      font: 'helvetica',
      fontSize: 9,
      textColor: [51, 65, 85]
    },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 25 },
      5: { halign: 'right' },
      6: { fontStyle: 'bold' }
    },
    didDrawCell: (data) => {
      // Color status values
      if (data.column.index === 6 && data.cell.section === 'body') {
        const text = data.cell.text[0];
        if (text === 'Active') {
          doc.setTextColor(16, 185, 129); // Emerald
        } else if (text === 'Onboarding') {
          doc.setTextColor(139, 92, 246); // Violet
        } else {
          doc.setTextColor(244, 63, 94); // Rose/Offboarded
        }
      }
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252] // Slate 50
    },
    margin: { left: 14, right: 14 },
  });

  // Footer page numbers
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184); // Slate 400
    doc.text(`Page ${i} of ${pageCount}`, 196, 287, { align: 'right' });
    doc.text(`Confidential - ${company.companyName} Internal Use Only`, 14, 287);
  }

  doc.save(`Employee_Directory_Report_${new Date().toISOString().split('T')[0]}.pdf`);
}

export function exportPayrollReportToPDF(
  payrolls: PayrollRecord[],
  selectedMonth: string,
  settings: AppSettings
) {
  const doc = new jsPDF();
  const company = settings.companySettings || {
    companyName: 'HumailEli HRM',
    companyEmail: 'info@humaileli.com',
    companyPhone: '+1 555-0199',
    companyAddress: 'HR Headquarters, Suite 100'
  };

  // --- BRANDING HEADER ---
  // Accent Bar
  doc.setFillColor(79, 70, 229); // Violet/Indigo #4F46E5
  doc.rect(0, 0, 210, 8, 'F');

  // Company Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(30, 41, 59); // Slate 800
  doc.text(company.companyName, 14, 25);

  // Document Title
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139); // Slate 500
  doc.text(`COMPENSATIONS & PAYROLL LEDGER: ${selectedMonth.toUpperCase()}`, 14, 31);

  // Company Contact Details (Right-aligned)
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105); // Slate 600
  doc.text(`Email: ${company.companyEmail}`, 196, 22, { align: 'right' });
  doc.text(`Phone: ${company.companyPhone}`, 196, 27, { align: 'right' });
  doc.text(`Address: ${company.companyAddress}`, 196, 32, { align: 'right' });

  // Thin separator line
  doc.setDrawColor(226, 232, 240); // Slate 200
  doc.setLineWidth(0.5);
  doc.line(14, 38, 196, 38);

  // --- TOTALS SUMMARY TABLE / METADATA ---
  let totalBase = 0;
  let totalBonus = 0;
  let totalPenalty = 0;
  let totalDeductions = 0;
  let totalNet = 0;

  payrolls.forEach(p => {
    totalBase += p.baseSalary;
    totalBonus += p.bonus;
    totalPenalty += p.penalty;
    totalDeductions += p.leaveDeductions;
    totalNet += p.netSalary;
  });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42); // Slate 900
  doc.text('Compensation Summary', 14, 48);

  // Left metadata details
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(71, 85, 105);
  doc.text(`Reporting Month: ${selectedMonth}`, 14, 55);
  doc.text(`Processed Staff: ${payrolls.length}`, 14, 61);
  doc.text(`Generation Date: ${new Date().toLocaleDateString()}`, 14, 67);

  // Dashboard Box on the right (X: 110, Y: 43, Width: 86, Height: 26)
  doc.setFillColor(248, 250, 252); // Slate 50 background
  doc.setDrawColor(226, 232, 240); // Slate 200 border
  doc.setLineWidth(0.5);
  doc.roundedRect(110, 43, 86, 26, 3, 3, 'FD');

  // Summary figures in box
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('TOTAL BASE SALARIES', 114, 49);
  doc.text('BONUSES / PENALTY', 114, 55);
  doc.text('NET SALARIES PAYOUT', 114, 63);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(30, 41, 59);
  doc.text(`$${totalBase.toLocaleString()}`, 192, 49, { align: 'right' });
  doc.text(`+$${totalBonus.toLocaleString()} / -$${(totalPenalty + totalDeductions).toLocaleString()}`, 192, 55, { align: 'right' });

  doc.setFontSize(11);
  doc.setTextColor(79, 70, 229); // Violet brand color
  doc.text(`$${totalNet.toLocaleString()}`, 192, 64, { align: 'right' });

  // --- DATA TABLE ---
  const tableRows = payrolls.map(p => [
    p.employeeId,
    p.employeeName,
    `$${p.baseSalary.toLocaleString()}`,
    p.bonus > 0 ? `+$${p.bonus.toLocaleString()}` : '—',
    p.penalty > 0 ? `-$${p.penalty.toLocaleString()}` : '—',
    p.leaveDeductions > 0 ? `-$${p.leaveDeductions.toLocaleString()}` : '—',
    `$${p.netSalary.toLocaleString()}`,
    p.status.toUpperCase()
  ]);

  if (payrolls.length > 0) {
    // Append total/summation row at the end of table body
    tableRows.push([
      'TOTALS',
      `${payrolls.length} Employees`,
      `$${totalBase.toLocaleString()}`,
      `+$${totalBonus.toLocaleString()}`,
      `-$${totalPenalty.toLocaleString()}`,
      `-$${totalDeductions.toLocaleString()}`,
      `$${totalNet.toLocaleString()}`,
      ''
    ]);
  }

  autoTable(doc, {
    startY: 75,
    head: [['ID', 'Employee Name', 'Base Salary', 'Perfect Bonus', 'Late Penalties', 'Leave Deductions', 'Net Salary', 'Status']],
    body: tableRows,
    theme: 'striped',
    headStyles: {
      fillColor: [79, 70, 229],
      textColor: [255, 255, 255],
      font: 'helvetica',
      fontStyle: 'bold',
      fontSize: 9,
      halign: 'left'
    },
    bodyStyles: {
      font: 'helvetica',
      fontSize: 8.5,
      textColor: [51, 65, 85]
    },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 22 },
      2: { halign: 'right' },
      3: { halign: 'right', textColor: [16, 185, 129] }, // emerald for bonus
      4: { halign: 'right', textColor: [244, 63, 94] },  // rose for penalty
      5: { halign: 'right', textColor: [244, 63, 94] },  // rose for deductions
      6: { halign: 'right', fontStyle: 'bold', textColor: [79, 70, 229] }, // violet for net salary
      7: { halign: 'center', fontStyle: 'bold' }
    },
    didDrawCell: (data) => {
      // Style the final total summation row uniquely
      if (payrolls.length > 0 && data.row.index === tableRows.length - 1 && data.cell.section === 'body') {
        data.cell.styles.fontStyle = 'bold';
        data.cell.styles.fillColor = [241, 245, 249]; // Slate 100 background
        
        // Reset colors for sum cells so they are bold
        if (data.column.index === 2) data.cell.styles.textColor = [30, 41, 59];
        if (data.column.index === 3) data.cell.styles.textColor = [16, 185, 129];
        if (data.column.index === 4) data.cell.styles.textColor = [244, 63, 94];
        if (data.column.index === 5) data.cell.styles.textColor = [244, 63, 94];
        if (data.column.index === 6) data.cell.styles.textColor = [79, 70, 229];
      }

      // Color check status values
      if (data.column.index === 7 && data.cell.section === 'body' && (payrolls.length === 0 || data.row.index !== tableRows.length - 1)) {
        data.cell.styles.textColor = [16, 185, 129]; // Emerald for Paid status
      }
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252] // Slate 50
    },
    margin: { left: 14, right: 14 },
  });

  // Footer page numbers
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184); // Slate 400
    doc.text(`Page ${i} of ${pageCount}`, 196, 287, { align: 'right' });
    doc.text(`Generated automatically by ${company.companyName} Payroll Engine`, 14, 287);
  }

  doc.save(`Payroll_Report_${selectedMonth.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`);
}
