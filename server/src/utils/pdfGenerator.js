const PDFDocument = require('pdfkit');

/**
 * Generates a clean, professional payslip PDF buffer
 */
function generatePayslipPDF(data) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 40, size: 'A4' });
      const buffers = [];

      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfData = Buffer.concat(buffers);
        resolve(pdfData);
      });

      // Header Brand
      doc.rect(0, 0, doc.page.width, 90).fill('#0f172a');
      doc.fillColor('#ffffff').fontSize(22).font('Helvetica-Bold').text('DAYFLOW HRMS', 40, 25);
      doc.fontSize(10).font('Helvetica').fillColor('#94a3b8').text('Every workday, perfectly aligned.', 40, 52);
      
      doc.fillColor('#ffffff').fontSize(14).font('Helvetica-Bold').text('PAYSLIP', 400, 25, { align: 'right' });
      doc.fontSize(10).font('Helvetica').fillColor('#38bdf8').text(`Period: ${data.period || `${data.month}/${data.year}`}`, 400, 45, { align: 'right' });

      // Employee Information Box
      doc.y = 110;
      doc.rect(40, 105, 515, 95).lineWidth(1).strokeColor('#e2e8f0').stroke();
      doc.rect(40, 105, 515, 24).fill('#f8fafc');

      doc.fillColor('#334155').fontSize(11).font('Helvetica-Bold').text('EMPLOYEE DETAILS', 50, 112);

      doc.fontSize(9).font('Helvetica-Bold').fillColor('#64748b').text('Name:', 50, 138);
      doc.font('Helvetica').fillColor('#0f172a').text(`${data.first_name} ${data.last_name}`, 120, 138);

      doc.font('Helvetica-Bold').fillColor('#64748b').text('Employee ID:', 50, 154);
      doc.font('Helvetica').fillColor('#0f172a').text(data.login_id || 'N/A', 120, 154);

      doc.font('Helvetica-Bold').fillColor('#64748b').text('Department:', 50, 170);
      doc.font('Helvetica').fillColor('#0f172a').text(data.department || 'General', 120, 170);

      doc.font('Helvetica-Bold').fillColor('#64748b').text('Job Position:', 300, 138);
      doc.font('Helvetica').fillColor('#0f172a').text(data.job_position || 'N/A', 380, 138);

      doc.font('Helvetica-Bold').fillColor('#64748b').text('PAN / Bank:', 300, 154);
      doc.font('Helvetica').fillColor('#0f172a').text(`${data.pan_no || 'N/A'} / ${data.bank_name || 'N/A'}`, 380, 154);

      doc.font('Helvetica-Bold').fillColor('#64748b').text('Payable Days:', 300, 170);
      doc.font('Helvetica-Bold').fillColor('#0284c7').text(`${data.payable_days} / ${data.total_working_days} Days`, 380, 170);

      // Earnings & Deductions Tables
      const startY = 220;
      doc.rect(40, startY, 250, 24).fill('#0f172a');
      doc.fillColor('#ffffff').fontSize(10).font('Helvetica-Bold').text('EARNINGS (₹)', 50, startY + 7);

      doc.rect(305, startY, 250, 24).fill('#0f172a');
      doc.fillColor('#ffffff').fontSize(10).font('Helvetica-Bold').text('DEDUCTIONS (₹)', 315, startY + 7);

      const earnings = [
        ['Basic Salary', data.basic],
        ['House Rent Allowance (HRA)', data.hra],
        ['Standard Allowance', data.standard_allowance],
        ['Performance Bonus', data.performance_bonus],
        ['Leave Travel Allowance (LTA)', data.lta],
        ['Fixed Allowance', data.fixed_allowance]
      ];

      const deductions = [
        ['Provident Fund (Employee 12%)', data.pf_employee],
        ['Professional Tax', data.professional_tax]
      ];

      let curY = startY + 30;
      earnings.forEach(([item, amount]) => {
        doc.fontSize(9).font('Helvetica').fillColor('#334155').text(item, 50, curY);
        doc.font('Helvetica-Bold').text(`₹${Number(amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 220, curY, { align: 'right', width: 60 });
        curY += 20;
      });

      let curDedY = startY + 30;
      deductions.forEach(([item, amount]) => {
        doc.fontSize(9).font('Helvetica').fillColor('#334155').text(item, 315, curDedY);
        doc.font('Helvetica-Bold').text(`₹${Number(amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 485, curDedY, { align: 'right', width: 60 });
        curDedY += 20;
      });

      // Total Row
      const totalsY = Math.max(curY, curDedY) + 10;
      doc.rect(40, totalsY, 250, 22).fill('#f1f5f9');
      doc.fillColor('#0f172a').fontSize(9).font('Helvetica-Bold').text('Gross Earnings:', 50, totalsY + 6);
      doc.text(`₹${Number(data.gross_salary || data.monthly_wage || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 220, totalsY + 6, { align: 'right', width: 60 });

      doc.rect(305, totalsY, 250, 22).fill('#f1f5f9');
      doc.fillColor('#0f172a').fontSize(9).font('Helvetica-Bold').text('Total Deductions:', 315, totalsY + 6);
      doc.text(`₹${Number(data.total_deductions || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 485, totalsY + 6, { align: 'right', width: 60 });

      // Net Pay Banner
      const netPayY = totalsY + 40;
      doc.rect(40, netPayY, 515, 45).fill('#f8fafc').strokeColor('#cbd5e1').stroke();
      doc.fillColor('#0f172a').fontSize(12).font('Helvetica-Bold').text('NET TAKE-HOME PAY:', 55, netPayY + 16);
      doc.fontSize(16).font('Helvetica-Bold').fillColor('#16a34a').text(`₹${Number(data.net_salary || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 350, netPayY + 14, { align: 'right', width: 190 });

      // Footer
      doc.fontSize(8).font('Helvetica').fillColor('#94a3b8').text('This is a computer-generated document and does not require a physical signature.', 40, 750, { align: 'center', width: 515 });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

module.exports = {
  generatePayslipPDF
};
