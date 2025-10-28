/**
 * V5 Debugging Dashboard
 * Real-time monitoring of V5 ModelAI parameter extraction and comparisons
 */

import { json } from '@remix-run/node';
import { useLoaderData, useFetcher } from '@remix-run/react';
import { useState, useEffect } from 'react';
import { generateDebugReport, getRecentDebugLogs } from '~/lib/debug/v5-debugging.server.js';

export async function loader({ request }) {
  const url = new URL(request.url);
  const limit = parseInt(url.searchParams.get('limit') || '50');

  try {
    const [logs, report] = await Promise.all([
      getRecentDebugLogs(limit),
      generateDebugReport()
    ]);

    return json({ 
      logs,
      report,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Debug loader error:', error);
    return json({ 
      logs: [], 
      report: { error: error.message },
      timestamp: new Date().toISOString()
    });
  }
}

export default function V5DebugDashboard() {
  const { logs, report, timestamp } = useLoaderData();
  const fetcher = useFetcher();
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [selectedLog, setSelectedLog] = useState(null);

  // Auto-refresh every 5 seconds
  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        fetcher.load('/debug/v5?action=logs&limit=50');
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, fetcher]);

  const refreshData = () => {
    fetcher.load('/debug/v5?action=logs&limit=50');
  };

  const clearLogs = () => {
    if (confirm('Are you sure you want to clear all debug logs?')) {
      fetcher.submit({ action: 'clear' }, { method: 'post', action: '/api/debug-v5' });
    }
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleString();
  };

  const getStepIcon = (step) => {
    switch (step) {
      case 'ai_analysis_start': return '🔬';
      case 'ai_response_received': return '📝';
      case 'json_extraction': return '🔍';
      case 'validation_success': return '✅';
      case 'error': return '❌';
      default: return '📋';
    }
  };

  const getStepColor = (step) => {
    switch (step) {
      case 'ai_analysis_start': return 'text-blue-600';
      case 'ai_response_received': return 'text-green-600';
      case 'json_extraction': return 'text-yellow-600';
      case 'validation_success': return 'text-green-700';
      case 'error': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">V5 Debugging Dashboard</h1>
              <p className="text-gray-600 mt-2">Real-time monitoring of V5 ModelAI parameter extraction and comparisons</p>
              <p className="text-sm text-gray-500 mt-1">Last updated: {formatTimestamp(timestamp)}</p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={refreshData}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Refresh
              </button>
              <button
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  autoRefresh 
                    ? 'bg-green-600 text-white hover:bg-green-700' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {autoRefresh ? 'Auto-refresh ON' : 'Auto-refresh OFF'}
              </button>
              <button
                onClick={clearLogs}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Clear Logs
              </button>
            </div>
          </div>
        </div>

        {/* Statistics */}
        {report && !report.error && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="text-2xl font-bold text-blue-600">{report.totalLogs}</div>
              <div className="text-gray-600">Total Logs</div>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="text-2xl font-bold text-green-600">{report.successfulAnalyses}</div>
              <div className="text-gray-600">Successful</div>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="text-2xl font-bold text-red-600">{report.failedAnalyses}</div>
              <div className="text-gray-600">Failed</div>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="text-2xl font-bold text-purple-600">
                {report.successfulAnalyses > 0 ? 
                  ((report.successfulAnalyses / report.totalLogs) * 100).toFixed(1) : 0}%
              </div>
              <div className="text-gray-600">Success Rate</div>
            </div>
          </div>
        )}

        {/* Logs List */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Recent Debug Logs</h2>
            <p className="text-gray-600 text-sm">Click on a log to see detailed information</p>
          </div>
          
          <div className="divide-y divide-gray-200">
            {logs.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                No debug logs found. Start scanning keys to see debugging information.
              </div>
            ) : (
              logs.map((log) => (
                <div
                  key={log.id}
                  className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => setSelectedLog(selectedLog?.id === log.id ? null : log)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">{getStepIcon(log.step)}</span>
                      <div>
                        <div className={`font-medium ${getStepColor(log.step)}`}>
                          {log.step.replace(/_/g, ' ').toUpperCase()}
                        </div>
                        <div className="text-sm text-gray-500">
                          {log.id} • {formatTimestamp(log.timestamp)}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      {log.success ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Success
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          Error
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {selectedLog?.id === log.id && (
                    <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                      <h3 className="font-medium text-gray-900 mb-2">Debug Details</h3>
                      <div className="space-y-2 text-sm">
                        <div><strong>Image Size:</strong> {log.imageSize} bytes</div>
                        <div><strong>MIME Type:</strong> {log.mimeType}</div>
                        {log.responseLength && (
                          <div><strong>Response Length:</strong> {log.responseLength} characters</div>
                        )}
                        {log.validatedSignature && (
                          <div>
                            <strong>Extracted Parameters:</strong>
                            <pre className="mt-1 p-2 bg-white rounded text-xs overflow-x-auto">
                              {JSON.stringify(log.validatedSignature, null, 2)}
                            </pre>
                          </div>
                        )}
                        {log.error && (
                          <div className="text-red-600">
                            <strong>Error:</strong> {log.error}
                          </div>
                        )}
                        {log.rawResponse && (
                          <div>
                            <strong>Raw AI Response:</strong>
                            <pre className="mt-1 p-2 bg-white rounded text-xs overflow-x-auto max-h-40">
                              {log.rawResponse}
                            </pre>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Parameter Extraction Statistics */}
        {report && report.parameterExtractionStats && (
          <div className="mt-6 bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Parameter Extraction Statistics</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Object.entries(report.parameterExtractionStats).map(([param, stats]) => (
                <div key={param} className="p-4 border border-gray-200 rounded-lg">
                  <div className="font-medium text-gray-900 capitalize">{param.replace(/_/g, ' ')}</div>
                  <div className="text-sm text-gray-600 mt-1">
                    Success Rate: {stats.successRate}%
                  </div>
                  <div className="text-sm text-gray-600">
                    Null Values: {stats.nullValues}/{stats.total}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
