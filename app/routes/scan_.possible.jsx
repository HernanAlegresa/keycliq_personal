import { json, redirect } from "@remix-run/node";
import { useLoaderData, useNavigate } from "@remix-run/react";
import { useState } from "react";
import { requireUserId } from "../utils/session.server.js";
import { getKeyById } from "../lib/keys.server.js";
import { Button } from "../components/ui/Button.jsx";
import { prisma } from "../utils/db.server.js";
import { buildOptimizedCloudinaryUrl } from "../utils/imageUtils.js";

export const handle = { 
  hideFooter: true, 
  title: 'KeyCliq', 
  showBackButton: false  // No back button on possible match
};

export async function loader({ request }) {
  const userId = await requireUserId(request);
  const url = new URL(request.url);
  const keyId = url.searchParams.get('keyId');
  const confidence = url.searchParams.get('confidence');
  const candidates = url.searchParams.get('candidates');

  // V6 POSSIBLE_KEYS: Manejar múltiples candidatos con similarity === 1.0
  if (candidates) {
    try {
      const candidatesData = JSON.parse(decodeURIComponent(candidates));
      const candidateKeys = [];
      
      // Obtener datos de cada candidato
      for (const candidate of candidatesData) {
        const key = await getKeyById(candidate.keyId, userId);
        if (key) {
          candidateKeys.push({
            ...key,
            similarity: candidate.similarity,
            matchType: candidate.matchType
          });
        }
      }
      
      if (candidateKeys.length === 0) {
        return redirect('/scan');
      }

      return json({ 
        candidates: candidateKeys,
        isMultipleCandidates: true,
        confidence: parseFloat(confidence) || 0
      });
    } catch (error) {
      console.error('Error parsing candidates:', error);
      return redirect('/scan');
    }
  }

  // Legacy POSSIBLE_MATCH: Manejar un solo candidato (backward compatibility with V4)
  if (!keyId) {
    return redirect('/scan');
  }

  const key = await getKeyById(keyId, userId);
  
  if (!key) {
    return redirect('/scan');
  }

  // Get the latest KeyMatching for this user and key
  const latestMatching = await prisma.keyMatching.findFirst({
    where: {
      userId,
      matchedKeyId: keyId,
      matchType: 'POSSIBLE_MATCH'
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  return json({ 
    key,
    confidence: parseFloat(confidence) || 0,
    keyMatchingId: latestMatching?.id || null,
    isMultipleCandidates: false
  });
}

export default function ScanPossibleMatch() {
  const { key, confidence, keyMatchingId, candidates, isMultipleCandidates } = useLoaderData();
  const navigate = useNavigate();
  const [selectedKeyId, setSelectedKeyId] = useState(null);

  const handleConfirmMatch = () => {
    if (isMultipleCandidates && selectedKeyId) {
      // V6: Usuario confirma la llave seleccionada
      navigate(`/keys/${selectedKeyId}?from=/scan/possible&confirmed=true`);
    } else if (!isMultipleCandidates && key) {
      // Legacy: Usuario confirma la única llave
      navigate(`/keys/${key.id}?from=/scan/possible&confirmed=true`);
    }
  };

  const handleTryAgain = () => {
    // El usuario dice que no es ninguna llave, volver a scan
    navigate('/scan');
  };

  const handleAddAsNew = () => {
    // El usuario quiere agregar como nueva llave
    navigate('/scan/new');
  };

  const handleViewAnalysis = () => {
    if (isMultipleCandidates && selectedKeyId) {
      // V6: Ver análisis de la llave seleccionada
      navigate(`/scan/analysis?keyId=${selectedKeyId}&confidence=${confidence}`);
    } else if (!isMultipleCandidates && keyMatchingId) {
      // Legacy: Ver análisis con keyMatchingId
      navigate(`/scan/analysis?keyMatchingId=${keyMatchingId}`);
    } else if (!isMultipleCandidates && key) {
      // Legacy: Ver análisis con keyId
      navigate(`/scan/analysis?keyId=${key.id}&confidence=${confidence}`);
    }
  };

  const handleKeySelect = (keyId) => {
    setSelectedKeyId(keyId);
  };

  const confidencePercent = (confidence * 100).toFixed(1);

  // V6 POSSIBLE_KEYS: Múltiples candidatos
  if (isMultipleCandidates && candidates) {
    return (
      <div className="scan-match-found">
        <div className="scan-match-found__content">
          {/* V6 Header */}
          <div className="scan-match-found__header">
            <h1 className="scan-match-found__title">Possible Keys – Best Matches</h1>
            <div className="scan-match-found__success-icon" style={{ backgroundColor: '#f59e0b' }}>
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>

          {/* V6 Message */}
          <div className="scan-match-found__message" style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            <p style={{ fontSize: '0.95rem', color: '#4b5563', lineHeight: '1.5' }}>
              We found the best matches according to the key you scanned from your inventory.
            </p>
            <p style={{ fontSize: '0.85rem', color: '#6b7280', lineHeight: '1.4', marginTop: '0.5rem' }}>
              Select the correct key from the list below.
            </p>
          </div>

          {/* V6 Candidates List */}
          <div className="possible-keys__list" style={{ marginBottom: '2rem' }}>
            {candidates.map((candidate) => (
              <div
                key={candidate.id}
                className={`possible-keys__item ${selectedKeyId === candidate.id ? 'possible-keys__item--selected' : ''}`}
                onClick={() => handleKeySelect(candidate.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '1rem',
                  marginBottom: '0.75rem',
                  backgroundColor: selectedKeyId === candidate.id ? '#f0f9ff' : '#ffffff',
                  border: selectedKeyId === candidate.id ? '2px solid #3b82f6' : '1px solid #e5e7eb',
                  borderRadius: '0.75rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                {/* Key Image */}
                <div className="possible-keys__item-image key-image-frame" style={{ marginRight: '1rem', flexShrink: 0, width: '72px', height: '72px' }}>
                  <img 
                    src={candidate.imageUrl
                      ? buildOptimizedCloudinaryUrl(candidate.imageUrl, {
                          width: 420,
                          height: 280,
                          crop: "fill",
                        })
                      : "/api/placeholder/200x150"}
                    alt={candidate.name}
                    className="possible-keys__item-img key-image-frame__img key-image-frame__img--contain"
                    loading="lazy"
                    decoding="async"
                  />
                </div>
                
                {/* Key Details */}
                <div className="possible-keys__item-content" style={{ flex: 1 }}>
                  <h3 style={{ 
                    fontSize: '1rem', 
                    fontWeight: '600', 
                    color: '#111827', 
                    margin: '0 0 0.25rem 0' 
                  }}>
                    {candidate.name}
                  </h3>
                  <p style={{ 
                    fontSize: '0.875rem', 
                    color: '#6b7280', 
                    margin: '0 0 0.25rem 0' 
                  }}>
                    {candidate.description || "Sin descripción"}
                  </p>
                  {candidate.unit && (
                    <p style={{ fontSize: '0.75rem', color: '#9ca3af', margin: '0' }}>
                      Unit: {candidate.unit}
                    </p>
                  )}
                  {candidate.door && (
                    <p style={{ fontSize: '0.75rem', color: '#9ca3af', margin: '0' }}>
                      Door: {candidate.door}
                    </p>
                  )}
                </div>

                {/* Selection Indicator */}
                <div className="possible-keys__item-indicator" style={{ flexShrink: 0 }}>
                  {selectedKeyId === candidate.id ? (
                    <div style={{
                      width: '20px',
                      height: '20px',
                      backgroundColor: '#3b82f6',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <svg width="12" height="12" fill="white" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  ) : (
                    <div style={{
                      width: '20px',
                      height: '20px',
                      border: '2px solid #d1d5db',
                      borderRadius: '50%'
                    }} />
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* V6 Action Buttons */}
          <div className="scan-match-found__actions">
            <Button 
              variant="primary" 
              size="large" 
              onClick={handleConfirmMatch}
              disabled={!selectedKeyId}
              className="w-full py-3 rounded-2xl"
            >
              Yes, Is This Key
            </Button>
            
            <Button 
              variant="secondary" 
              size="large" 
              onClick={handleAddAsNew}
              className="w-full py-3 rounded-2xl"
            >
              No, Save as New Key
            </Button>
            
            <Button 
              variant="secondary" 
              size="large" 
              onClick={handleViewAnalysis}
              disabled={!selectedKeyId}
              className="w-full py-3 rounded-2xl"
            >
              View Analysis
            </Button>
            
            <Button 
              variant="secondary" 
              size="large" 
              onClick={handleTryAgain}
              className="w-full py-3 rounded-2xl"
            >
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // V4/V6 POSSIBLE_MATCH: Un solo candidato (backward compatibility)
  return (
    <div className="scan-match-found">
      <div className="scan-match-found__content">
        {/* V4/V6 Header */}
        <div className="scan-match-found__header">
          <h1 className="scan-match-found__title">Possible Match</h1>
          <div className="scan-match-found__success-icon" style={{ backgroundColor: '#f59e0b' }}>
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>

        {/* V4/V6 Message */}
        <div className="scan-match-found__message" style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <p style={{ fontSize: '0.95rem', color: '#4b5563', lineHeight: '1.5' }}>
            We found a key that might match. 
            Is this the key you scanned?
          </p>
        </div>

        {/* V4/V6 Key Card */}
        <div className="scan-match-found__key-card">
          <div className="scan-match-found__key-image key-image-frame">
            <img 
              src={key.imageUrl
                ? buildOptimizedCloudinaryUrl(key.imageUrl, {
                    width: 480,
                    height: 320,
                    crop: "fill",
                  })
                : "/api/placeholder/200x150"}
              alt={key.name}
              className="scan-match-found__key-img key-image-frame__img key-image-frame__img--contain"
              loading="lazy"
              decoding="async"
            />
          </div>
          
          <div className="scan-match-found__key-details">
            <h2 className="scan-match-found__key-name">{key.name}</h2>
            {key.description && (
              <p className="scan-match-found__key-address">{key.description}</p>
            )}
            {key.unit && (
              <p className="scan-match-found__key-address">Unit: {key.unit}</p>
            )}
            {key.door && (
              <p className="scan-match-found__key-address">Door: {key.door}</p>
            )}
            
            <div className="scan-match-found__match-badge" style={{ backgroundColor: '#fef3c7' }}>
              <div className="scan-match-found__match-dot" style={{ backgroundColor: '#f59e0b' }}></div>
              <span className="scan-match-found__match-text" style={{ color: '#92400e' }}>
                Possible match
              </span>
            </div>
          </div>
        </div>

        {/* V4/V6 Action Buttons */}
        <div className="scan-match-found__actions">
          <Button 
            variant="primary" 
            size="large" 
            onClick={handleConfirmMatch}
            className="w-full py-3 rounded-2xl"
          >
            Yes, It's This Key
          </Button>
          
          <Button 
            variant="secondary" 
            size="large" 
            onClick={handleAddAsNew}
            className="w-full py-3 rounded-2xl"
          >
            No, Save as New Key
          </Button>
          
          <Button 
            variant="secondary" 
            size="large" 
            onClick={handleViewAnalysis}
            className="w-full py-3 rounded-2xl"
          >
            View Analysis
          </Button>
          
          <Button 
            variant="secondary" 
            size="large" 
            onClick={handleTryAgain}
            className="w-full py-3 rounded-2xl"
          >
            Try Again
          </Button>
        </div>
      </div>
    </div>
  );
}


