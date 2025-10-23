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

  const handleBack = () => {
    // Go back to the previous result screen
    if (matchLevel === "MATCH_FOUND") {
      navigate(`/scan/match_yes?keyId=${keyMatching.matchedKeyId}&confidence=${confidence}`);
    } else if (matchLevel === "POSSIBLE_MATCH") {
      navigate(`/scan/possible?keyId=${keyMatching.matchedKeyId}&confidence=${confidence}`);
    } else {
      navigate('/scan');
    }
  };

  const handleScanAnother = () => {
    navigate('/scan');
  };

  const renderParameter = (label, value, isMatch = null) => {
    const getMatchIcon = () => {
      if (isMatch === null) return null;
      if (isMatch) return "✅";
      return "❌";
    };

    const getMatchColor = () => {
      if (isMatch === null) return "text-gray-600";
      if (isMatch) return "text-green-600";
      return "text-red-600";
    };

    return (
      <div className="analysis-parameter">
        <div className="analysis-parameter__header">
          <span className="analysis-parameter__label">{label}</span>
          {getMatchIcon() && (
            <span className={`analysis-parameter__match ${getMatchColor()}`}>
              {getMatchIcon()}
            </span>
          )}
        </div>
        <div className="analysis-parameter__value">
          {value === null ? (
            <span className="text-gray-400 italic">Not detected</span>
          ) : (
            <span className="font-medium">{String(value)}</span>
          )}
        </div>
      </div>
    );
  };

  const renderComparisonDetails = () => {
    if (!comparisonResult) return null;

    return (
      <div className="analysis-section">
        <h3 className="analysis-section__title">Comparison Details</h3>
        <div className="analysis-comparison">
          <div className="analysis-comparison__item">
            <span className="analysis-comparison__label">Similarity Score:</span>
            <span className="analysis-comparison__value">
              {(comparisonResult.similarity * 100).toFixed(1)}%
            </span>
          </div>
          <div className="analysis-comparison__item">
            <span className="analysis-comparison__label">Match Type:</span>
            <span className={`analysis-comparison__value analysis-comparison__value--${matchLevel.toLowerCase()}`}>
              {matchLevel.replace('_', ' ')}
            </span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="scan-analysis">
      {/* Header */}
      <div className="scan-analysis__header">
        <h1 className="scan-analysis__title">Key Analysis</h1>
        <p className="scan-analysis__subtitle">
          Detailed parameter comparison for key matching
        </p>
      </div>

      {/* Key Info */}
      <div className="analysis-section">
        <h3 className="analysis-section__title">Matched Key</h3>
        <div className="analysis-key-info">
          <h4 className="analysis-key-info__name">{keyMatching.matchedKey?.name || 'Unknown Key'}</h4>
          {keyMatching.matchedKey?.location && (
            <p className="analysis-key-info__location">{keyMatching.matchedKey.location}</p>
          )}
          {keyMatching.matchedKey?.unit && (
            <p className="analysis-key-info__unit">Unit: {keyMatching.matchedKey.unit}</p>
          )}
          {keyMatching.matchedKey?.door && (
            <p className="analysis-key-info__door">Door: {keyMatching.matchedKey.door}</p>
          )}
        </div>
      </div>

      {/* Comparison Result */}
      {renderComparisonDetails()}

      {/* Scanned Key Parameters */}
      <div className="analysis-section">
        <h3 className="analysis-section__title">Scanned Key Parameters</h3>
        <div className="analysis-parameters">
          {querySignature && Object.entries(querySignature).map(([param, value]) => {
            if (param === 'confidence_score') return null;
            const isMatch = comparisonResult?.details?.parameterMatches?.[param];
            return (
              <div key={param}>
                {renderParameter(
                  param.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
                  value,
                  isMatch
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Inventory Key Parameters */}
      <div className="analysis-section">
        <h3 className="analysis-section__title">Inventory Key Parameters</h3>
        <div className="analysis-parameters">
          {matchedSignature && Object.entries(matchedSignature).map(([param, value]) => {
            if (param === 'confidence_score') return null;
            const isMatch = comparisonResult?.details?.parameterMatches?.[param];
            return (
              <div key={param}>
                {renderParameter(
                  param.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
                  value,
                  isMatch
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="scan-analysis__actions">
        <Button 
          variant="secondary" 
          size="large" 
          onClick={handleBack}
          className="w-full py-3 rounded-2xl"
        >
          Back to Results
        </Button>
        
        <Button 
          variant="primary" 
          size="large" 
          onClick={handleScanAnother}
          className="w-full py-3 rounded-2xl"
        >
          Scan Another Key
        </Button>
      </div>
    </div>
  );
}
