/**
 * Generates the standardized Dayflow Employee Login ID
 * Format: [OI][First 2 letters of first name + first 2 letters of last name][Year of Joining][Serial number]
 * Example: OIJODO20260001
 * 
 * @param {Object} db - Database connection
 * @param {string} companyCode - Company code prefix (e.g. 'OI')
 * @param {string} firstName - Employee first name
 * @param {string} lastName - Employee last name
 * @param {string|number} joiningYear - Year of joining (e.g. 2026)
 * @returns {Promise<string>} Generated Login ID
 */
async function generateLoginId(db, companyCode = 'OI', firstName = '', lastName = '', joiningYear = null) {
  const code = (companyCode || 'OI').toUpperCase().slice(0, 2);
  
  // Clean names
  const f2 = (firstName.trim().replace(/[^a-zA-Z]/g, '') + 'XX').slice(0, 2).toUpperCase();
  const l2 = (lastName.trim().replace(/[^a-zA-Z]/g, '') + 'XX').slice(0, 2).toUpperCase();
  
  const year = joiningYear ? String(joiningYear).slice(0, 4) : String(new Date().getFullYear());
  
  // Count how many users already exist in that year for that company
  const pattern = `${code}%${year}%`;
  const row = await db.prepare(`
    SELECT COUNT(*) as count FROM users 
    WHERE login_id LIKE ?
  `).get(pattern);

  const nextSerial = (row ? row.count : 0) + 1;
  const serialStr = String(nextSerial).padStart(4, '0');

  return `${code}${f2}${l2}${year}${serialStr}`;
}

/**
 * Generates a secure temporary password
 * @param {number} length 
 * @returns {string}
 */
function generateTempPassword(length = 8) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

module.exports = {
  generateLoginId,
  generateTempPassword
};
