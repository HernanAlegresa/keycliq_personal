import { json, redirect } from "@remix-run/node";
import { useLoaderData, useNavigate } from "@remix-run/react";
import { requireUserId } from "../utils/session.server.js";
import { getKeyById } from "../lib/keys.server.js";
import { prisma } from "../utils/db.server.js";
import { Button } from "../components/ui/Button.jsx";
import "../styles/analysis.css";

export const handle = { 
  hideFooter: true, 
  title: 'KeyCliq - Analysis', 
  showBackButton: true
};

export async function loader({ request }) {
  const userId = await requireUserId(request);
  const url = new URL(request.url);
  const keyId = url.searchParams.get('keyId');
  const confidence = url.searchParams.get('confidence');
  const keyMatchingId = url.searchParams.get('keyMatchingId');

  // If we have keyMatchingId, use it directly
  if (keyMatchingId) {
    const keyMatching = await prisma.keyMatching.findUnique({
      where: { id: keyMatchingId },
      include: {
        keyQuery: true,
        matchedKey: true,
      },
    });

    if (!keyMatching) {
      return redirect('/scan');
    }

    const querySignature = keyMatching.querySignature;
    const matchedSignature = keyMatching.matchedSignature;
    const comparisonResult = keyMatching.comparisonResult;

    return json({ 
      keyMatching,
      querySignature,
      matchedSignature,
      comparisonResult,
      confidence: keyMatching.confidence
    });
  }

  if (!keyId) {
    return redirect('/scan');
  }

  const key = await getKeyById(keyId, userId);
  
  if (!key) {
    return redirect('/scan');
  }

  // Get the latest KeySignature for this key
  const keySignature = await prisma.keySignature.findFirst({
    where: { keyId: key.id },
    orderBy: { createdAt: 'desc' }
  });

  // Get the latest KeyQuery (the scanned key)
  const keyQuery = await prisma.keyQuery.findFirst({
    where: { userId },
    orderBy: { createdAt: 'desc' }
  });

  return json({ 
    key,
    confidence: parseFloat(confidence) || 0,
    keySignature: keySignature?.signature || null,
    keyQuery: keyQuery?.signature || null,
    comparisonResult: keyQuery?.comparisonResult || null
  });
}

export default function ScanAnalysis() {
  const { keyMatching, querySignature, matchedSignature, comparisonResult, confidence } = useLoaderData();
  const navigate = useNavigate();

  const confidencePercent = (confidence * 100).toFixed(1);
  const matchLevel = confidence >= 0.92 ? "MATCH_FOUND" : confidence >= 0.80 ? "POSSIBLE_MATCH" : "NO_MATCH";

  // Navigation is handled by the header back button


  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-6">
        <h1 className="text-2xl font-bold text-gray-900">Key Analysis</h1>
        <p className="text-gray-600 mt-1">Detailed comparison results</p>
      </div>

      <div className="max-w-4xl mx-auto p-4 space-y-6">
        {/* Summary Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Match Result</h2>
              <p className="text-gray-600">Analysis completed successfully</p>
            </div>
            <div className="text-right">
              <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                matchLevel === 'MATCH_FOUND' ? 'bg-green-100 text-green-800' :
                matchLevel === 'POSSIBLE_MATCH' ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }`}>
                {matchLevel === 'MATCH_FOUND' ? '✅ Match Found' :
                 matchLevel === 'POSSIBLE_MATCH' ? '⚠️ Possible Match' :
                 '❌ No Match'}
              </div>
              <div className="text-2xl font-bold text-gray-900 mt-1">{confidencePercent}%</div>
            </div>
          </div>
        </div>

        {/* Matched Key Info */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Matched Key</h3>
          <div className="space-y-2">
            <div>
              <span className="text-sm font-medium text-gray-500">Name:</span>
              <span className="ml-2 text-gray-900">{keyMatching.matchedKey?.name || 'Unknown Key'}</span>
            </div>
            {keyMatching.matchedKey?.location && (
              <div>
                <span className="text-sm font-medium text-gray-500">Location:</span>
                <span className="ml-2 text-gray-900">{keyMatching.matchedKey.location}</span>
              </div>
            )}
            {keyMatching.matchedKey?.unit && (
              <div>
                <span className="text-sm font-medium text-gray-500">Unit:</span>
                <span className="ml-2 text-gray-900">{keyMatching.matchedKey.unit}</span>
              </div>
            )}
            {keyMatching.matchedKey?.door && (
              <div>
                <span className="text-sm font-medium text-gray-500">Door:</span>
                <span className="ml-2 text-gray-900">{keyMatching.matchedKey.door}</span>
              </div>
            )}
          </div>
        </div>

        {/* Comparison Details */}
        {comparisonResult && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Comparison Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-sm font-medium text-gray-500">Similarity Score:</span>
                <div className="text-2xl font-bold text-gray-900">
                  {(comparisonResult.similarity * 100).toFixed(1)}%
                </div>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500">Match Type:</span>
                <div className={`text-lg font-semibold ${
                  matchLevel === 'MATCH_FOUND' ? 'text-green-600' :
                  matchLevel === 'POSSIBLE_MATCH' ? 'text-yellow-600' :
                  'text-red-600'
                }`}>
                  {matchLevel.replace('_', ' ')}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Parameters Comparison */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Parameter Comparison</h3>
          
          <div className="space-y-4">
            {querySignature && matchedSignature && Object.keys(querySignature).map((param) => {
              if (param === 'confidence_score') return null;
              
              const queryValue = querySignature[param];
              const matchedValue = matchedSignature[param];
              const isMatch = queryValue === matchedValue;
              const isMatchNull = queryValue === null && matchedValue === null;
              
              return (
                <div key={param} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900 capitalize">
                      {param.replace(/_/g, ' ')}
                    </h4>
                    <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                      isMatch || isMatchNull ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {isMatch || isMatchNull ? '✅ Match' : '❌ Different'}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm font-medium text-gray-500 mb-1">Scanned Key</div>
                      <div className="text-gray-900">
                        {queryValue === null ? (
                          <span className="text-gray-400 italic">Not detected</span>
                        ) : (
                          <span className="font-medium">{String(queryValue)}</span>
                        )}
                      </div>
                    </div>
                    
                    <div>
                      <div className="text-sm font-medium text-gray-500 mb-1">Inventory Key</div>
                      <div className="text-gray-900">
                        {matchedValue === null ? (
                          <span className="text-gray-400 italic">Not detected</span>
                        ) : (
                          <span className="font-medium">{String(matchedValue)}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
