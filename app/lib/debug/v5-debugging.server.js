/**
 * V5 Debugging System - Comprehensive logging and analysis tools
 */

import fs from 'fs/promises';
import path from 'path';

const DEBUG_DIR = path.join(process.cwd(), 'debug', 'v5');
const DEBUG_LOGS_FILE = path.join(DEBUG_DIR, 'debug-logs.json');

// Ensure debug directory exists
async function ensureDebugDir() {
  try {
    await fs.mkdir(DEBUG_DIR, { recursive: true });
  } catch (error) {
    console.error('Error creating debug directory:', error);
  }
}

/**
 * Save debug log to file
 */
export async function saveDebugLog(debugLog) {
  try {
    await ensureDebugDir();
    
    // Load existing logs
    let logs = [];
    try {
      const existingData = await fs.readFile(DEBUG_LOGS_FILE, 'utf8');
      logs = JSON.parse(existingData);
    } catch (error) {
      // File doesn't exist yet, start with empty array
    }
    
    // Add new log
    logs.push(debugLog);
    
    // Keep only last 100 logs to prevent file from growing too large
    if (logs.length > 100) {
      logs = logs.slice(-100);
    }
    
    // Save back to file
    await fs.writeFile(DEBUG_LOGS_FILE, JSON.stringify(logs, null, 2));
    
    console.log(`💾 Debug log saved: ${debugLog.id}`);
  } catch (error) {
    console.error('Error saving debug log:', error);
  }
}

/**
 * Save detailed comparison analysis
 */
export async function saveComparisonAnalysis(analysis) {
  try {
    await ensureDebugDir();
    
    const filename = `comparison_${analysis.id}.json`;
    const filepath = path.join(DEBUG_DIR, filename);
    
    await fs.writeFile(filepath, JSON.stringify(analysis, null, 2));
    
    console.log(`📊 Comparison analysis saved: ${filename}`);
  } catch (error) {
    console.error('Error saving comparison analysis:', error);
  }
}

/**
 * Generate comprehensive debug report
 */
export async function generateDebugReport() {
  try {
    await ensureDebugDir();
    
    // Load all debug logs
    let logs = [];
    try {
      const existingData = await fs.readFile(DEBUG_LOGS_FILE, 'utf8');
      logs = JSON.parse(existingData);
    } catch (error) {
      return { error: 'No debug logs found' };
    }
    
    // Generate statistics
    const stats = {
      totalLogs: logs.length,
      successfulAnalyses: logs.filter(log => log.success).length,
      failedAnalyses: logs.filter(log => !log.success).length,
      recentLogs: logs.slice(-10),
      parameterExtractionStats: {},
      errorStats: {}
    };
    
    // Analyze parameter extraction success rates
    const successfulLogs = logs.filter(log => log.success && log.validatedSignature);
    successfulLogs.forEach(log => {
      Object.keys(log.validatedSignature).forEach(param => {
        if (!stats.parameterExtractionStats[param]) {
          stats.parameterExtractionStats[param] = { total: 0, nullValues: 0 };
        }
        stats.parameterExtractionStats[param].total++;
        if (log.validatedSignature[param] === null) {
          stats.parameterExtractionStats[param].nullValues++;
        }
      });
    });
    
    // Calculate success rates
    Object.keys(stats.parameterExtractionStats).forEach(param => {
      const stat = stats.parameterExtractionStats[param];
      stat.successRate = ((stat.total - stat.nullValues) / stat.total * 100).toFixed(1);
    });
    
    // Analyze errors
    const failedLogs = logs.filter(log => !log.success);
    failedLogs.forEach(log => {
      const error = log.error || 'Unknown error';
      stats.errorStats[error] = (stats.errorStats[error] || 0) + 1;
    });
    
    // Save report
    const reportPath = path.join(DEBUG_DIR, 'debug-report.json');
    await fs.writeFile(reportPath, JSON.stringify(stats, null, 2));
    
    console.log('📈 Debug report generated:', reportPath);
    return stats;
  } catch (error) {
    console.error('Error generating debug report:', error);
    return { error: error.message };
  }
}

/**
 * Get recent debug logs
 */
export async function getRecentDebugLogs(limit = 20) {
  try {
    const existingData = await fs.readFile(DEBUG_LOGS_FILE, 'utf8');
    const logs = JSON.parse(existingData);
    return logs.slice(-limit);
  } catch (error) {
    return [];
  }
}

/**
 * Clear debug logs
 */
export async function clearDebugLogs() {
  try {
    await fs.unlink(DEBUG_LOGS_FILE);
    console.log('🗑️ Debug logs cleared');
  } catch (error) {
    console.log('No debug logs to clear');
  }
}
