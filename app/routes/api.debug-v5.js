/**
 * V5 Debugging API Endpoint
 * Provides real-time debugging information for V5 ModelAI
 * NOTE: This endpoint is deprecated and non-functional (V5 debug functions removed)
 */

import { json } from '@remix-run/node';
// NOTE: V5 debugging functions have been removed - this endpoint is deprecated
// import { generateDebugReport, getRecentDebugLogs, clearDebugLogs } from '~/lib/debug/v5-debugging.server.js';

export async function loader({ request }) {
  // V5 debugging endpoint is deprecated - V5 debug functions have been removed
  return json({ 
    success: false, 
    error: 'V5 debugging endpoint is deprecated. V6 does not use this endpoint.' 
  }, { status: 410 }); // 410 Gone - resource no longer available
}

export async function action({ request }) {
  // V5 debugging endpoint is deprecated - V5 debug functions have been removed
  return json({ 
    success: false, 
    error: 'V5 debugging endpoint is deprecated. V6 does not use this endpoint.' 
  }, { status: 410 }); // 410 Gone - resource no longer available
}
