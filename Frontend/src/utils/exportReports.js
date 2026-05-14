// src/utils/exportReports.js
// Enhanced Export scan results to PDF or CSV

import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Export scan results to PDF - ENHANCED VERSION
 */
export const exportToPDF = (scanData) => {
  const doc = new jsPDF();
  let yPosition = 20;
  
  // ===== HEADER WITH LOGO PLACEHOLDER =====
  doc.setFontSize(28);
  doc.setTextColor(34, 197, 94); // Green
  doc.text('WebSecura', 20, yPosition);
  doc.setFontSize(12);
  doc.setTextColor(100, 100, 100);
  doc.text('Security & Performance Report', 20, yPosition + 7);
  
  // Divider line
  doc.setDrawColor(34, 197, 94);
  doc.setLineWidth(0.5);
  doc.line(20, yPosition + 12, 190, yPosition + 12);
  
  yPosition = 45;
  
  // ===== SCAN INFORMATION BOX =====
  doc.setFillColor(245, 245, 245);
  doc.roundedRect(20, yPosition, 170, 25, 3, 3, 'F');
  
  doc.setFontSize(10);
  doc.setTextColor(60, 60, 60);
  doc.setFont(undefined, 'bold');
  doc.text('Website URL:', 25, yPosition + 7);
  doc.setFont(undefined, 'normal');
  doc.setTextColor(34, 34, 34);
  const urlText = scanData.url.length > 70 ? scanData.url.substring(0, 67) + '...' : scanData.url;
  doc.text(urlText, 25, yPosition + 13);
  
  doc.setFont(undefined, 'bold');
  doc.setTextColor(60, 60, 60);
  doc.text('Scan Date:', 25, yPosition + 19);
  doc.setFont(undefined, 'normal');
  doc.setTextColor(34, 34, 34);
  doc.text(new Date(scanData.scan_time).toLocaleString(), 50, yPosition + 19);
  
  yPosition += 35;
  
  // ===== SCORE SUMMARY SECTION =====
  doc.setFontSize(16);
  doc.setTextColor(34, 197, 94);
  doc.setFont(undefined, 'bold');
  doc.text('Score Summary', 20, yPosition);
  yPosition += 10;
  
  // Score cards
  const scores = [
    { label: 'Overall', value: scanData.overall_score, x: 20 },
    { label: 'Security', value: scanData.security.score, x: 80 },
    { label: 'Performance', value: scanData.performance.overall_score, x: 140 }
  ];
  
  scores.forEach(score => {
    const color = score.value >= 80 ? [34, 197, 94] : 
                  score.value >= 60 ? [251, 191, 36] : 
                  score.value >= 40 ? [251, 146, 60] : [239, 68, 68];
    
    // Score box
    doc.setFillColor(...color, 20);
    doc.setDrawColor(...color);
    doc.setLineWidth(1);
    doc.roundedRect(score.x, yPosition, 45, 25, 3, 3, 'FD');
    
    // Score value
    doc.setFontSize(24);
    doc.setTextColor(...color);
    doc.setFont(undefined, 'bold');
    doc.text(String(score.value), score.x + 22.5, yPosition + 14, { align: 'center' });
    
    // Label
    doc.setFontSize(9);
    doc.setTextColor(80, 80, 80);
    doc.setFont(undefined, 'normal');
    doc.text(score.label, score.x + 22.5, yPosition + 20, { align: 'center' });
  });
  
  yPosition += 35;
  
  // ===== QUICK STATS =====
  doc.setFillColor(240, 253, 244);
  doc.roundedRect(20, yPosition, 50, 15, 2, 2, 'F');
  doc.setFontSize(10);
  doc.setTextColor(34, 34, 34);
  doc.setFont(undefined, 'bold');
  doc.text('Total Checks:', 25, yPosition + 6);
  doc.setFont(undefined, 'normal');
  doc.text(String(scanData.security.summary.total_checks), 25, yPosition + 11);
  
  doc.setFillColor(240, 253, 244);
  doc.roundedRect(75, yPosition, 50, 15, 2, 2, 'F');
  doc.setFont(undefined, 'bold');
  doc.text('Passed:', 80, yPosition + 6);
  doc.setFont(undefined, 'normal');
  doc.setTextColor(34, 197, 94);
  doc.text(String(scanData.security.summary.passed_checks), 80, yPosition + 11);
  
  doc.setFillColor(254, 242, 242);
  doc.roundedRect(130, yPosition, 50, 15, 2, 2, 'F');
  doc.setFont(undefined, 'bold');
  doc.setTextColor(34, 34, 34);
  doc.text('Failed:', 135, yPosition + 6);
  doc.setFont(undefined, 'normal');
  doc.setTextColor(239, 68, 68);
  doc.text(String(scanData.security.summary.failed_checks), 135, yPosition + 11);
  
  yPosition += 25;
  
  // ===== SECURITY CHECKS DETAILED TABLE =====
  doc.setFontSize(16);
  doc.setTextColor(34, 197, 94);
  doc.setFont(undefined, 'bold');
  doc.text('Security Check Details', 20, yPosition);
  yPosition += 5;
  
  const tableData = scanData.security.results.map(result => {
    const status = result.passed ? 'PASS' : 'FAIL';
    const check = result.category || result.check || 'Security Check';
    const details = result.passed 
      ? (result.message || result.description || 'No issues detected')
      : (result.recommendation || result.message || result.description || 'Action required');
    
    return [check, status, details];
  });
  
  autoTable(doc, {
    startY: yPosition,
    head: [['Security Check', 'Status', 'Details / Recommendations']],
    body: tableData,
    theme: 'striped',
    headStyles: { 
      fillColor: [34, 197, 94],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 10
    },
    styles: { 
      fontSize: 9,
      cellPadding: 4,
      lineColor: [220, 220, 220],
      lineWidth: 0.1
    },
    columnStyles: {
      0: { cellWidth: 50, fontStyle: 'bold' },
      1: { 
        cellWidth: 20, 
        halign: 'center',
        fontStyle: 'bold'
      },
      2: { cellWidth: 110 }
    },
    didParseCell: function(data) {
      // Color code the status column
      if (data.column.index === 1 && data.row.section === 'body') {
        const status = data.cell.text[0];
        if (status === 'PASS') {
          data.cell.styles.textColor = [34, 197, 94];
          data.cell.styles.fillColor = [240, 253, 244];
        } else if (status === 'FAIL') {
          data.cell.styles.textColor = [239, 68, 68];
          data.cell.styles.fillColor = [254, 242, 242];
        }
      }
    }
  });
  
  yPosition = doc.lastAutoTable.finalY + 15;
  
  // ===== PERFORMANCE METRICS =====
  if (scanData.performance?.metrics && yPosition < 250) {
    doc.addPage();
    yPosition = 20;
    
    doc.setFontSize(16);
    doc.setTextColor(34, 197, 94);
    doc.setFont(undefined, 'bold');
    doc.text('Performance Analysis', 20, yPosition);
    yPosition += 10;
    
    const perfData = Object.entries(scanData.performance.metrics)
      .filter(([key, metric]) => metric && typeof metric === 'object')
      .map(([key, metric]) => [
        key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        metric.status || 'N/A',
        metric.description || 'No details available'
      ]);
    
    if (perfData.length > 0) {
      autoTable(doc, {
        startY: yPosition,
        head: [['Metric', 'Status', 'Description']],
        body: perfData,
        theme: 'striped',
        headStyles: { 
          fillColor: [59, 130, 246],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 10
        },
        styles: { 
          fontSize: 9,
          cellPadding: 4
        },
        columnStyles: {
          0: { cellWidth: 50, fontStyle: 'bold' },
          1: { cellWidth: 30, halign: 'center' },
          2: { cellWidth: 100 }
        }
      });
      
      yPosition = doc.lastAutoTable.finalY + 15;
    }
  }
  
  // ===== RECOMMENDATIONS SECTION =====
  const failedChecks = scanData.security.results.filter(r => !r.passed);
  if (failedChecks.length > 0) {
    if (yPosition > 250) {
      doc.addPage();
      yPosition = 20;
    }
    
    doc.setFontSize(16);
    doc.setTextColor(251, 146, 60);
    doc.setFont(undefined, 'bold');
    doc.text('Critical Recommendations', 20, yPosition);
    yPosition += 5;
    
    const recData = failedChecks.map((check, index) => [
      String(index + 1),
      check.category || check.check || 'Security Issue',
      check.recommendation || 'Review and fix this security issue'
    ]);
    
    autoTable(doc, {
      startY: yPosition,
      head: [['#', 'Issue', 'Recommended Action']],
      body: recData,
      theme: 'striped',
      headStyles: { 
        fillColor: [251, 146, 60],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 10
      },
      styles: { 
        fontSize: 9,
        cellPadding: 4
      },
      columnStyles: {
        0: { cellWidth: 10, halign: 'center', fontStyle: 'bold' },
        1: { cellWidth: 50, fontStyle: 'bold' },
        2: { cellWidth: 130 }
      }
    });
  }
  
  // ===== FOOTER ON ALL PAGES =====
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    
    // Footer line
    doc.setDrawColor(34, 197, 94);
    doc.setLineWidth(0.3);
    doc.line(20, doc.internal.pageSize.getHeight() - 20, 190, doc.internal.pageSize.getHeight() - 20);
    
    // Footer text
    doc.setFontSize(9);
    doc.setTextColor(128, 128, 128);
    doc.setFont(undefined, 'normal');
    doc.text(
      'Generated by WebSecura - Professional Security & Performance Analysis',
      doc.internal.pageSize.getWidth() / 2,
      doc.internal.pageSize.getHeight() - 13,
      { align: 'center' }
    );
    doc.text(
      `Page ${i} of ${pageCount}`,
      doc.internal.pageSize.getWidth() / 2,
      doc.internal.pageSize.getHeight() - 8,
      { align: 'center' }
    );
  }
  
  // Download
  const filename = `websecura-report-${new Date().getTime()}.pdf`;
  doc.save(filename);
};

/**
 * Export scan results to CSV
 */
export const exportToCSV = (scanData) => {
  const headers = ['Check Category', 'Status', 'Message', 'Recommendation'];
  
  const rows = scanData.security.results.map(result => [
    result.category || result.check || 'N/A',
    result.passed ? 'PASS' : 'FAIL',
    result.message || result.description || '',
    result.recommendation || ''
  ]);
  
  // Add summary header
  const summaryRows = [
    ['WebSecura Security Report'],
    [''],
    ['URL', scanData.url],
    ['Scan Date', new Date(scanData.scan_time).toLocaleString()],
    ['Overall Score', scanData.overall_score],
    ['Security Score', scanData.security.score],
    ['Performance Score', scanData.performance.overall_score],
    ['Total Checks', scanData.security.summary.total_checks],
    ['Passed Checks', scanData.security.summary.passed_checks],
    ['Failed Checks', scanData.security.summary.failed_checks],
    [''],
    headers
  ];
  
  const allRows = [...summaryRows, ...rows];
  
  // Convert to CSV string
  const csvContent = allRows
    .map(row => row.map(cell => `"${cell}"`).join(','))
    .join('\n');
  
  // Download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `websecura-report-${new Date().getTime()}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Export multiple scans to CSV (for history export)
 */
export const exportHistoryToCSV = (scans) => {
  const headers = ['URL', 'Scan Date', 'Overall Score', 'Security Score', 'Performance Score', 'Status'];
  
  const rows = scans.map(scan => [
    scan.url,
    new Date(scan.scan_time).toLocaleString(),
    scan.overall_score,
    scan.security_score,
    scan.performance_score || 0,
    scan.overall_score >= 80 ? 'EXCELLENT' : 
    scan.overall_score >= 60 ? 'GOOD' : 
    scan.overall_score >= 40 ? 'FAIR' : 'POOR'
  ]);
  
  const allRows = [
    ['WebSecura Scan History'],
    ['Exported on', new Date().toLocaleString()],
    ['Total Scans', scans.length],
    [''],
    headers,
    ...rows
  ];
  
  const csvContent = allRows
    .map(row => row.map(cell => `"${cell}"`).join(','))
    .join('\n');
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `websecura-history-${new Date().getTime()}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};