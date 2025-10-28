/**
 * V5 Debugging API Endpoint
 * Provides real-time debugging information for V5 ModelAI
 */

import { json } from '@remix-run/node';
import { generateDebugReport, getRecentDebugLogs, clearDebugLogs } from '~/lib/debug/v5-debugging.server.js';

export async function loader({ request }) {
  const url = new URL(request.url);
  const action = url.searchParams.get('action');
  const limit = parseInt(url.searchParams.get('limit') || '20');

  try {
    switch (action) {
      case 'logs':
        const logs = await getRecentDebugLogs(limit);
        return json({ 
          success: true, 
          logs,
          count: logs.length 
        });

      case 'report':
        const report = await generateDebugReport();
        return json({ 
          success: true, 
          report 
        });

      case 'clear':
        await clearDebugLogs();
        return json({ 
          success: true, 
          message: 'Debug logs cleared' 
        });

      default:
        return json({ 
          success: false, 
          error: 'Invalid action. Use: logs, report, or clear' 
        });
    }
  } catch (error) {
    console.error('Debug API Error:', error);
    return json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}

export async function action({ request }) {
  const formData = await request.formData();
  const action = formData.get('action');

  try {
    switch (action) {
      case 'clear':
        await clearDebugLogs();
        return json({ 
          success: true, 
          message: 'Debug logs cleared' 
        });

      default:
        return json({ 
          success: false, 
          error: 'Invalid action' 
        });
    }
  } catch (error) {
    console.error('Debug API Action Error:', error);
    return json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}
