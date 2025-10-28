/**
 * V5 Analysis Screen - Detailed parameter extraction and comparison analysis
 */

import { json } from '@remix-run/node';
import { useLoaderData, useNavigate } from '@remix-run/react';
import { useState } from 'react';

export async function loader({ request }) {
  const url = new URL(request.url);
  const analysisData = url.searchParams.get('data');
  
  if (!analysisData) {
    return json({ error: 'No analysis data provided' }, { status: 400 });
  }

  try {
    const data = JSON.parse(decodeURIComponent(analysisData));
    return json({ analysis: data });
  } catch (error) {
    return json({ error: 'Invalid analysis data' }, { status: 400 });
  }
}

export default function V5AnalysisScreen() {
  const { analysis, error } = useLoaderData();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('extraction');

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-sm p-6 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <h1 className="text-xl font-semibold text-gray-900 mb-2">Error</h1>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={() => navigate('/scan')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Back to Scan
            </button>
          </div>
        </div>
      </div>
    );
  }

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleString();
  };

  const getParameterIcon = (param) => {
    const icons = {
      bowmark: '🏷️',
      bowcode: '🏭',
      surface_finish: '✨',
      key_color: '🎨',
      bow_shape: '📐',
      bow_size: '📏',
      peak_count: '🔢',
      groove_count: '🔢',
      blade_profile: '🔧'
    };
    return icons[param] || '📋';
  };

  const getMatchTypeColor = (matchType) => {
    switch (matchType) {
      case 'MATCH_FOUND': return 'text-green-600 bg-green-100';
      case 'POSSIBLE_KEYS': return 'text-yellow-600 bg-yellow-100';
      case 'NO_MATCH': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getSimilarityColor = (similarity) => {
    if (similarity >= 0.95) return 'text-green-600';
    if (similarity >= 0.8) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Key Analysis Details</h1>
              <p className="text-gray-600">Detailed parameter extraction and comparison analysis</p>
            </div>
            <button
              onClick={() => navigate('/scan')}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Back to Scan
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Analysis Summary */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className={`text-2xl font-bold ${getSimilarityColor(analysis.similarity || 0)}`}>
                {((analysis.similarity || 0) * 100).toFixed(1)}%
              </div>
              <div className="text-gray-600">Similarity</div>
            </div>
            <div className="text-center">
              <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getMatchTypeColor(analysis.matchType || 'NO_MATCH')}`}>
                {analysis.matchType || 'NO_MATCH'}
              </div>
              <div className="text-gray-600 mt-1">Result</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {analysis.debugId ? analysis.debugId.split('_')[1] : 'N/A'}
              </div>
              <div className="text-gray-600">Debug ID</div>
            </div>
            <div className="text-center">
              <div className="text-sm font-medium text-gray-900">
                {formatTimestamp(analysis.timestamp || new Date().toISOString())}
              </div>
              <div className="text-gray-600">Timestamp</div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('extraction')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'extraction'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                🔬 Parameter Extraction
              </button>
              <button
                onClick={() => setActiveTab('comparison')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'comparison'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                🔍 Comparison Details
              </button>
              <button
                onClick={() => setActiveTab('raw')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'raw'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                📝 Raw Data
              </button>
            </nav>
          </div>

          <div className="p-6">
            {/* Parameter Extraction Tab */}
            {activeTab === 'extraction' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Extracted Parameters</h3>
                {analysis.querySignature ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium text-gray-700 mb-3">Query Key Parameters</h4>
                      <div className="space-y-2">
                        {Object.entries(analysis.querySignature).map(([param, value]) => (
                          <div key={param} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center space-x-2">
                              <span className="text-lg">{getParameterIcon(param)}</span>
                              <span className="font-medium text-gray-700 capitalize">
                                {param.replace(/_/g, ' ')}
                              </span>
                            </div>
                            <span className={`px-2 py-1 rounded text-sm font-medium ${
                              value === null ? 'bg-gray-200 text-gray-600' : 'bg-blue-100 text-blue-800'
                            }`}>
                              {value === null ? 'Not detected' : String(value)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    {analysis.inventorySignature && (
                      <div>
                        <h4 className="font-medium text-gray-700 mb-3">Inventory Key Parameters</h4>
                        <div className="space-y-2">
                          {Object.entries(analysis.inventorySignature).map(([param, value]) => (
                            <div key={param} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                              <div className="flex items-center space-x-2">
                                <span className="text-lg">{getParameterIcon(param)}</span>
                                <span className="font-medium text-gray-700 capitalize">
                                  {param.replace(/_/g, ' ')}
                                </span>
                              </div>
                              <span className={`px-2 py-1 rounded text-sm font-medium ${
                                value === null ? 'bg-gray-200 text-gray-600' : 'bg-green-100 text-green-800'
                              }`}>
                                {value === null ? 'Not detected' : String(value)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No parameter extraction data available
                  </div>
                )}
              </div>
            )}

            {/* Comparison Details Tab */}
            {activeTab === 'comparison' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Comparison Analysis</h3>
                {analysis.parameterDetails ? (
                  <div className="space-y-4">
                    {Object.entries(analysis.parameterDetails).map(([param, details]) => (
                      <div key={param} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <span className="text-lg">{getParameterIcon(param)}</span>
                            <span className="font-medium text-gray-900 capitalize">
                              {param.replace(/_/g, ' ')}
                            </span>
                            <span className="text-sm text-gray-500">
                              (Weight: {(details.weight * 100).toFixed(0)}%)
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className={`px-2 py-1 rounded text-sm font-medium ${
                              details.match ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {details.reason.replace(/_/g, ' ')}
                            </span>
                            <span className={`font-bold ${getSimilarityColor(details.similarity)}`}>
                              {(details.similarity * 100).toFixed(0)}%
                            </span>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-gray-600">Query:</span>
                            <span className="ml-2 font-medium">
                              {details.value1 === null ? 'Not detected' : String(details.value1)}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-600">Inventory:</span>
                            <span className="ml-2 font-medium">
                              {details.value2 === null ? 'Not detected' : String(details.value2)}
                            </span>
                          </div>
                        </div>
                        <div className="mt-2 text-sm text-gray-600">
                          Contribution to final similarity: {(details.contribution * 100).toFixed(1)}%
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No comparison data available
                  </div>
                )}
              </div>
            )}

            {/* Raw Data Tab */}
            {activeTab === 'raw' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Raw Analysis Data</h3>
                <pre className="bg-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
                  {JSON.stringify(analysis, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
