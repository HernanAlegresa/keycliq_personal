/**
 * API endpoint for AI-powered key analysis
 * POST /api/analyze-key
 */

import { json } from "@remix-run/node";
import { analyzeKeyWithV5AI } from "~/lib/ai/v5/multimodal-keyscan-v5.server";
import { prisma as db } from "~/utils/db.server";
import { requireUserId } from "~/utils/session.server";

export async function action({ request }) {
  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    // Get user ID from session
    const userId = await requireUserId(request);
    
    // Parse form data
    const formData = await request.formData();
    const imageFile = formData.get("image");
    
    if (!imageFile || typeof imageFile === "string") {
      return json({ error: "No image file provided" }, { status: 400 });
    }
    
    // Convert File to Buffer
    const arrayBuffer = await imageFile.arrayBuffer();
    const imageBuffer = Buffer.from(arrayBuffer);
    
    console.log(`🔍 Analyzing key image for user ${userId}`);
    
    // Analyze image with V5 ModelAI
    const analysisResult = await analyzeKeyWithV5AI(
      imageBuffer, 
      imageFile.type || 'image/jpeg'
    );
    
    if (!analysisResult.success) {
      return json({ 
        error: "AI analysis failed", 
        details: analysisResult.error 
      }, { status: 500 });
    }
    
    // Create key query record
    const keyQuery = await db.keyQuery.create({
      data: {
        userId,
        queryType: "identification",
        status: "completed",
        result: {
          analysisType: "ai_multimodal",
          confidence: analysisResult.signature.confidence_score || 0.95,
          timestamp: new Date().toISOString()
        }
      }
    });
    
    // Create key signature record
    const keySignature = await db.keySignature.create({
      data: {
        keyQueryId: keyQuery.id,
        signature: analysisResult.signature,
        imageUrl: null, // Will be set when image is uploaded to Cloudinary
        confidenceScore: analysisResult.signature.confidence_score || 0.95
      }
    });
    
    console.log(`✅ Key analysis completed - Query: ${keyQuery.id}, Signature: ${keySignature.id}`);
    
    return json({
      success: true,
      queryId: keyQuery.id,
      signatureId: keySignature.id,
      signature: analysisResult.signature,
      confidence: analysisResult.signature.confidence_score || 0.95
    });
    
  } catch (error) {
    console.error("❌ Key analysis API error:", error);
    return json({ 
      error: "Internal server error", 
      details: error.message 
    }, { status: 500 });
  }
}

export async function loader({ request }) {
  return json({ error: "Method not allowed" }, { status: 405 });
}

