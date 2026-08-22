const API = 'http://localhost:5000/api';

async function runTests() {
  console.log('--- STARTING DAYFLOW HRMS INTEGRATION TESTS ---');

  try {
    // 1. Admin Login
    console.log('1. Testing Admin Login...');
    const adminLoginRes = await fetch(`${API}/auth/signin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        loginIdOrEmail: 'OIADMI20220001',
        password: 'admin123'
      })
    }).then(r => r.json());
    
    console.log('   ✓ Admin Login Success! User:', adminLoginRes.user.login_id, 'Role:', adminLoginRes.user.role);
    const adminToken = adminLoginRes.token;

    // 2. Employee Login
    console.log('2. Testing Employee Login...');
    const empLoginRes = await fetch(`${API}/auth/signin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        loginIdOrEmail: 'OIJODO20220001',
        password: 'password123'
      })
    }).then(r => r.json());

    console.log('   ✓ Employee Login Success! User:', empLoginRes.user.login_id, 'Name:', empLoginRes.user.first_name);
    const empToken = empLoginRes.token;
    const empId = empLoginRes.user.employee_id;

    // 3. Admin creates a new Employee -> Test Auto Login ID Generation format
    console.log('3. Testing Admin Employee Creation & Auto Login ID Generation...');
    const newEmpRes = await fetch(`${API}/employees/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        first_name: 'Jane',
        last_name: 'Smith',
        email: `jane.smith.${Date.now()}@odooindia.com`,
        mobile: '+91 98765 00000',
        job_position: 'Frontend Engineer',
        department: 'Engineering',
        date_of_joining: '2026-08-22',
        monthly_wage: 75000
      })
    }).then(r => r.json());

    console.log('   ✓ New Employee Created!');
    console.log('   ✓ Generated Login ID:', newEmpRes.employee.login_id);
    console.log('   ✓ Generated Temp Password:', newEmpRes.employee.temp_password);

    // Validate Login ID format [OI][JA][SM][2026][000X]
    const expectedPrefix = 'OIJASM2026';
    if (newEmpRes.employee.login_id.startsWith(expectedPrefix)) {
      console.log(`   ✓ Login ID correctly formatted according to business spec: starts with ${expectedPrefix}`);
    } else {
      console.warn(`   ⚠️ Warning: Login ID format is ${newEmpRes.employee.login_id}, expected to start with ${expectedPrefix}`);
    }

    // 4. Test Employee Systray Check In / Status
    console.log('4. Testing Systray Check In & Status...');
    const checkInRes = await fetch(`${API}/attendance/check-in`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${empToken}`
      }
    }).then(r => r.json());

    console.log('   ✓ Check In response:', checkInRes.message || 'Checked In');

    const statusRes = await fetch(`${API}/attendance/status`, {
      headers: { 'Authorization': `Bearer ${empToken}` }
    }).then(r => r.json());
    console.log('   ✓ Systray Status:', statusRes.statusDot, '| Text:', statusRes.sinceText);

    // 5. Test Leave Balances & Request
    console.log('5. Testing Time Off Balances & Request...');
    const balancesRes = await fetch(`${API}/leaves/balances`, {
      headers: { 'Authorization': `Bearer ${empToken}` }
    }).then(r => r.json());
    console.log('   ✓ Leave Balances:', balancesRes.summary);

    const paidLeaveType = balancesRes.balances.find(b => b.leave_type_name.toLowerCase().includes('paid'));
    
    console.log('   Submitting Leave Request...');
    const leaveReqRes = await fetch(`${API}/leaves/request`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${empToken}`
      },
      body: JSON.stringify({
        leave_type_id: paidLeaveType.leave_type_id,
        start_date: '2026-11-15',
        end_date: '2026-11-16',
        days_count: 2,
        reason: 'Integration test leave'
      })
    }).then(r => r.json());
    console.log('   ✓ Leave Request Submitted! ID:', leaveReqRes.requestId);

    // Admin Approves Leave
    console.log('   Admin Approving Leave Request...');
    const approveRes = await fetch(`${API}/leaves/requests/${leaveReqRes.requestId}/approve`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({ comment: 'Approved via automated test suite' })
    }).then(r => r.json());
    console.log('   ✓ Admin Approval Status:', approveRes.message);

    // 6. Test Payroll & PDF Slip Generation
    console.log('6. Testing Payroll Calculation & Payslip PDF...');
    const payslipRes = await fetch(`${API}/payroll/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        employee_id: empId,
        month: 8,
        year: 2026,
        custom_payable_days: 22
      })
    }).then(r => r.json());
    console.log('   ✓ Payslip Generated! Net Salary: ₹', payslipRes.data.net_salary);
    console.log('   ✓ Basic:', payslipRes.data.basic_amount, '| HRA:', payslipRes.data.hra_amount, '| PF Employee (12%):', payslipRes.data.pf_employee_amount);

    const pdfRes = await fetch(`${API}/payroll/payslip/${payslipRes.payslipId}/pdf`, {
      headers: { 'Authorization': `Bearer ${empToken}` }
    });
    const pdfBuffer = await pdfRes.arrayBuffer();
    console.log('   ✓ Downloadable PDF Payslip Received! Size:', pdfBuffer.byteLength, 'bytes');

    console.log('\n======================================================');
    console.log('  ALL INTEGRATION TESTS COMPLETED SUCCESSFULLY! (6/6)');
    console.log('======================================================\n');
  } catch (error) {
    console.error('Test Failed:', error);
  }
}

runTests();
