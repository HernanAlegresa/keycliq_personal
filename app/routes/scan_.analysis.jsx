/**
 * Scan Analysis Route - Handles analysis data from scan results
 */

import { json, redirect } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react';
import { requireUserId } from '../utils/session.server.js';
import { prisma } from '../utils/db.server.js';
import V5AnalysisScreen from './analysis.v5.jsx';

export async function loader({ request }) {
  const userId = await requireUserId(request);
  const url = new URL(request.url);
  const keyMatchingId = url.searchParams.get('keyMatchingId');
  const keyId = url.searchParams.get('keyId');
  const confidence = url.searchParams.get('confidence');

  let analysisData = null;

  if (keyMatchingId) {
    // Get analysis data from KeyMatching record
    const matching = await prisma.keyMatching.findFirst({
      where: {
        id: keyMatchingId,
        userId
      }
    });

    if (matching && matching.result) {
      analysisData = {
        ...matching.result,
        timestamp: matching.createdAt.toISOString(),
        debugId: matching.result.debugId || `debug_${matching.id}`,
        matchType: matching.matchType,
        similarity: matching.result.similarity || 0
      };
    }
  } else if (keyId && confidence) {
    // Get analysis data from latest KeyMatching for this key
    const matching = await prisma.keyMatching.findFirst({
      where: {
        userId,
        matchedKeyId: keyId
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    if (matching && matching.result) {
      analysisData = {
        ...matching.result,
        timestamp: matching.createdAt.toISOString(),
        debugId: matching.result.debugId || `debug_${matching.id}`,
        matchType: matching.matchType,
        similarity: matching.result.similarity || parseFloat(confidence)
      };
    }
  }

  if (!analysisData) {
    return redirect('/scan');
  }

  // Encode analysis data for the analysis screen
  const encodedData = encodeURIComponent(JSON.stringify(analysisData));
  
  return redirect(`/analysis/v5?data=${encodedData}`);
}

export default function ScanAnalysis() {
  // This component should never render as we redirect to /analysis/v5
  return null;
}