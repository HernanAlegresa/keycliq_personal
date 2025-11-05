/**
 * Database Inspection Script - Read-Only Analysis
 * 
 * This script performs comprehensive read-only analysis of the KeyCliq database:
 * - Table counts and statistics
 * - Data samples (5-10 rows per table)
 * - Integrity checks (orphans, duplicates, inconsistencies)
 * - Null distribution analysis
 * - Index and constraint analysis
 * 
 * Usage: node scripts/db-inspect.js
 * 
 * IMPORTANT: This script only performs SELECT queries - no DDL/DML operations
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Helper to mask sensitive data
function maskEmail(email) {
  if (!email) return null;
  const [local, domain] = email.split("@");
  if (!local || !domain) return email; // Invalid format, return as-is
  const masked = local.substring(0, 2) + "***@" + domain;
  return masked;
}

function maskPassword(pwd) {
  return pwd ? "***HASHED***" : null;
}

// Helper to truncate JSON for display
function truncateJson(json, maxLength = 200) {
  const str = JSON.stringify(json);
  if (str.length <= maxLength) return str;
  return str.substring(0, maxLength) + "...";
}

// Helper to format date
function formatDate(date) {
  if (!date) return null;
  return new Date(date).toISOString().split("T")[0];
}

async function getTableCounts() {
  console.log("\n📊 TABLE COUNTS\n");
  
  const counts = {
    users: await prisma.user.count(),
    sessions: await prisma.session.count(),
    passwordResetTokens: await prisma.passwordResetToken.count(),
    keys: await prisma.key.count(),
    keySignatures: await prisma.keySignature.count(),
    keyQueries: await prisma.keyQuery.count(),
    keyMatchings: await prisma.keyMatching.count()
  };

  for (const [table, count] of Object.entries(counts)) {
    console.log(`  ${table.padEnd(25)} ${count.toString().padStart(8)} records`);
  }

  return counts;
}

async function getDataSamples() {
  console.log("\n📋 DATA SAMPLES\n");

  // Users (limit 5, mask sensitive data)
  const users = await prisma.user.findMany({
    take: 5,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      email: true,
      role: true,
      createdAt: true,
      updatedAt: true
    }
  });

  console.log("\n👤 USERS (sample):");
  users.forEach(u => {
    console.log(`  ID: ${u.id.substring(0, 12)}...`);
    console.log(`  Email: ${maskEmail(u.email)}`);
    console.log(`  Role: ${u.role}`);
    console.log(`  Created: ${formatDate(u.createdAt)}`);
    console.log("");
  });

  // Keys (limit 10)
  const keys = await prisma.key.findMany({
    take: 10,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      userId: true,
      name: true,
      description: true,
      unit: true,
      door: true,
      sigStatus: true,
      imageUrl: true,
      imagePublicId: true,
      signature: true,
      createdAt: true
    }
  });

  console.log("\n🔑 KEYS (sample):");
  keys.forEach(k => {
    console.log(`  ID: ${k.id.substring(0, 12)}...`);
    console.log(`  User: ${k.userId.substring(0, 12)}...`);
    console.log(`  Name: ${k.name || "(empty)"}`);
    console.log(`  Description: ${k.description || "(null)"}`);
    console.log(`  Unit: ${k.unit || "(null)"}`);
    console.log(`  Door: ${k.door || "(null)"}`);
    console.log(`  Status: ${k.sigStatus}`);
    console.log(`  Has Image: ${k.imageUrl ? "Yes" : "No"}`);
    console.log(`  Has Signature (in Key.signature): ${k.signature ? "Yes" : "No"}`);
    console.log(`  Created: ${formatDate(k.createdAt)}`);
    console.log("");
  });

  // KeySignatures (limit 10)
  const signatures = await prisma.keySignature.findMany({
    take: 10,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      keyId: true,
      keyQueryId: true,
      confidenceScore: true,
      imageUrl: true,
      createdAt: true
    }
  });

  console.log("\n🔐 KEY SIGNATURES (sample):");
  signatures.forEach(s => {
    console.log(`  ID: ${s.id.substring(0, 12)}...`);
    console.log(`  Key ID: ${s.keyId || "(null)"}`);
    console.log(`  Query ID: ${s.keyQueryId || "(null)"}`);
    console.log(`  Confidence: ${s.confidenceScore || "(null)"}`);
    console.log(`  Has Image: ${s.imageUrl ? "Yes" : "No"}`);
    console.log(`  Created: ${formatDate(s.createdAt)}`);
    console.log("");
  });

  // KeyQueries (limit 10)
  const queries = await prisma.keyQuery.findMany({
    take: 10,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      userId: true,
      queryType: true,
      status: true,
      createdAt: true
    }
  });

  console.log("\n🔍 KEY QUERIES (sample):");
  queries.forEach(q => {
    console.log(`  ID: ${q.id.substring(0, 12)}...`);
    console.log(`  User: ${q.userId.substring(0, 12)}...`);
    console.log(`  Type: ${q.queryType}`);
    console.log(`  Status: ${q.status}`);
    console.log(`  Created: ${formatDate(q.createdAt)}`);
    console.log("");
  });

  // KeyMatchings (limit 10)
  const matchings = await prisma.keyMatching.findMany({
    take: 10,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      userId: true,
      keyQueryId: true,
      matchedKeyId: true,
      matchType: true,
      similarity: true,
      confidence: true,
      createdAt: true
    }
  });

  console.log("\n🎯 KEY MATCHINGS (sample):");
  matchings.forEach(m => {
    console.log(`  ID: ${m.id.substring(0, 12)}...`);
    console.log(`  User: ${m.userId.substring(0, 12)}...`);
    console.log(`  Query: ${m.keyQueryId.substring(0, 12)}...`);
    console.log(`  Matched Key: ${m.matchedKeyId || "(null)"}`);
    console.log(`  Type: ${m.matchType}`);
    console.log(`  Similarity: ${(m.similarity * 100).toFixed(1)}%`);
    console.log(`  Confidence: ${(m.confidence * 100).toFixed(1)}%`);
    console.log(`  Created: ${formatDate(m.createdAt)}`);
    console.log("");
  });

  return { users, keys, signatures, queries, matchings };
}

async function analyzeNullDistribution() {
  console.log("\n🔍 NULL DISTRIBUTION ANALYSIS\n");

  // Keys
  const keyStats = {
    total: await prisma.key.count(),
    withDescription: await prisma.key.count({ where: { description: { not: null } } }),
    withUnit: await prisma.key.count({ where: { unit: { not: null } } }),
    withDoor: await prisma.key.count({ where: { door: { not: null } } }),
    withNotes: await prisma.key.count({ where: { notes: { not: null } } }),
    withImageUrl: await prisma.key.count({ where: { imageUrl: { not: null } } }),
    withImagePublicId: await prisma.key.count({ where: { imagePublicId: { not: null } } }),
    withSignature: await prisma.key.count({ where: { signature: { not: null } } })
  };

  console.log("\n🔑 KEYS:");
  console.log(`  Total: ${keyStats.total}`);
  console.log(`  With description: ${keyStats.withDescription} (${((keyStats.withDescription / keyStats.total) * 100).toFixed(1)}%)`);
  console.log(`  With unit: ${keyStats.withUnit} (${((keyStats.withUnit / keyStats.total) * 100).toFixed(1)}%)`);
  console.log(`  With door: ${keyStats.withDoor} (${((keyStats.withDoor / keyStats.total) * 100).toFixed(1)}%)`);
  console.log(`  With notes: ${keyStats.withNotes} (${((keyStats.withNotes / keyStats.total) * 100).toFixed(1)}%)`);
  console.log(`  With imageUrl: ${keyStats.withImageUrl} (${((keyStats.withImageUrl / keyStats.total) * 100).toFixed(1)}%)`);
  console.log(`  With imagePublicId: ${keyStats.withImagePublicId} (${((keyStats.withImagePublicId / keyStats.total) * 100).toFixed(1)}%)`);
  console.log(`  With signature: ${keyStats.withSignature} (${((keyStats.withSignature / keyStats.total) * 100).toFixed(1)}%)`);

  // KeySignatures
  const sigStats = {
    total: await prisma.keySignature.count(),
    withKeyId: await prisma.keySignature.count({ where: { keyId: { not: null } } }),
    withKeyQueryId: await prisma.keySignature.count({ where: { keyQueryId: { not: null } } }),
    withConfidenceScore: await prisma.keySignature.count({ where: { confidenceScore: { not: null } } }),
    withImageUrl: await prisma.keySignature.count({ where: { imageUrl: { not: null } } })
  };

  console.log("\n🔐 KEY SIGNATURES:");
  console.log(`  Total: ${sigStats.total}`);
  console.log(`  With keyId: ${sigStats.withKeyId} (${((sigStats.withKeyId / sigStats.total) * 100).toFixed(1)}%)`);
  console.log(`  With keyQueryId: ${sigStats.withKeyQueryId} (${((sigStats.withKeyQueryId / sigStats.total) * 100).toFixed(1)}%)`);
  console.log(`  With confidenceScore: ${sigStats.withConfidenceScore} (${((sigStats.withConfidenceScore / sigStats.total) * 100).toFixed(1)}%)`);
  console.log(`  With imageUrl: ${sigStats.withImageUrl} (${((sigStats.withImageUrl / sigStats.total) * 100).toFixed(1)}%)`);

  // KeyMatchings
  const matchingStats = {
    total: await prisma.keyMatching.count(),
    withMatchedKeyId: await prisma.keyMatching.count({ where: { matchedKeyId: { not: null } } }),
    withMatchedSignature: await prisma.keyMatching.count({ where: { matchedSignature: { not: null } } }),
    withComparisonResult: await prisma.keyMatching.count({ where: { comparisonResult: { not: null } } })
  };

  console.log("\n🎯 KEY MATCHINGS:");
  console.log(`  Total: ${matchingStats.total}`);
  console.log(`  With matchedKeyId: ${matchingStats.withMatchedKeyId} (${((matchingStats.withMatchedKeyId / matchingStats.total) * 100).toFixed(1)}%)`);
  console.log(`  With matchedSignature: ${matchingStats.withMatchedSignature} (${((matchingStats.withMatchedSignature / matchingStats.total) * 100).toFixed(1)}%)`);
  console.log(`  With comparisonResult: ${matchingStats.withComparisonResult} (${((matchingStats.withComparisonResult / matchingStats.total) * 100).toFixed(1)}%)`);

  return { keyStats, sigStats, matchingStats };
}

async function analyzeIntegrity() {
  console.log("\n🔒 INTEGRITY CHECKS\n");

  // Orphaned KeySignatures (no keyId and no keyQueryId)
  const orphanedSignatures = await prisma.keySignature.count({
    where: {
      keyId: null,
      keyQueryId: null
    }
  });

  console.log(`\n⚠️  Orphaned KeySignatures (no keyId and no keyQueryId): ${orphanedSignatures}`);

  // KeySignatures with both keyId and keyQueryId (shouldn't happen)
  const dualSignatures = await prisma.keySignature.count({
    where: {
      keyId: { not: null },
      keyQueryId: { not: null }
    }
  });

  console.log(`⚠️  KeySignatures with both keyId and keyQueryId: ${dualSignatures}`);

  // Keys without signatures (should have at least one)
  const keysWithoutSigs = await prisma.key.findMany({
    where: {
      signatures: {
        none: {}
      }
    },
    select: {
      id: true,
      name: true,
      sigStatus: true
    },
    take: 10
  });

  console.log(`\n⚠️  Keys without any KeySignature records: ${keysWithoutSigs.length} (showing first 10)`);
  keysWithoutSigs.forEach(k => {
    console.log(`  - ${k.id.substring(0, 12)}... (${k.name}, status: ${k.sigStatus})`);
  });

  // KeyMatchings with matchType but no matchedKeyId when it should have one
  const matchingsWithoutKey = await prisma.keyMatching.count({
    where: {
      matchType: "MATCH_FOUND",
      matchedKeyId: null
    }
  });

  console.log(`\n⚠️  KeyMatchings with MATCH_FOUND but no matchedKeyId: ${matchingsWithoutKey}`);

  // KeyMatchings with matchedKeyId but matchType is NO_MATCH
  const inconsistentMatchings = await prisma.keyMatching.count({
    where: {
      matchType: "NO_MATCH",
      matchedKeyId: { not: null }
    }
  });

  console.log(`⚠️  KeyMatchings with NO_MATCH but have matchedKeyId: ${inconsistentMatchings}`);

  // Duplicate keys (same userId + name)
  // Using Prisma aggregation instead of raw query for better compatibility
  const allKeys = await prisma.key.findMany({
    select: {
      userId: true,
      name: true
    }
  });

  const keyCounts = {};
  allKeys.forEach(k => {
    const key = `${k.userId}:${k.name}`;
    keyCounts[key] = (keyCounts[key] || 0) + 1;
  });

  const duplicateKeys = Object.entries(keyCounts)
    .filter(([_, count]) => count > 1)
    .slice(0, 10);

  console.log(`\n⚠️  Potential duplicate keys (same userId + name): ${duplicateKeys.length}`);
  duplicateKeys.forEach(([key, count]) => {
    const [userId, name] = key.split(":");
    console.log(`  - User: ${userId.substring(0, 12)}..., Name: "${name}", Count: ${count}`);
  });

  return {
    orphanedSignatures,
    dualSignatures,
    keysWithoutSigs: keysWithoutSigs.length,
    matchingsWithoutKey,
    inconsistentMatchings,
    duplicateKeys: duplicateKeys.length
  };
}

async function analyzeStatusDistribution() {
  console.log("\n📈 STATUS DISTRIBUTION\n");

  // Key sigStatus
  const keyStatuses = await prisma.key.groupBy({
    by: ["sigStatus"],
    _count: true
  });

  console.log("\n🔑 Key sigStatus:");
  keyStatuses.forEach(s => {
    console.log(`  ${s.sigStatus || "(null)"}: ${s._count}`);
  });

  // KeyQuery status
  const queryStatuses = await prisma.keyQuery.groupBy({
    by: ["status"],
    _count: true
  });

  console.log("\n🔍 KeyQuery status:");
  queryStatuses.forEach(s => {
    console.log(`  ${s.status || "(null)"}: ${s._count}`);
  });

  // KeyQuery queryType
  const queryTypes = await prisma.keyQuery.groupBy({
    by: ["queryType"],
    _count: true
  });

  console.log("\n🔍 KeyQuery queryType:");
  queryTypes.forEach(t => {
    console.log(`  ${t.queryType || "(null)"}: ${t._count}`);
  });

  // KeyMatching matchType
  const matchTypes = await prisma.keyMatching.groupBy({
    by: ["matchType"],
    _count: true
  });

  console.log("\n🎯 KeyMatching matchType:");
  matchTypes.forEach(m => {
    console.log(`  ${m.matchType || "(null)"}: ${m._count}`);
  });

  return { keyStatuses, queryStatuses, queryTypes, matchTypes };
}

async function analyzeRelationships() {
  console.log("\n🔗 RELATIONSHIP ANALYSIS\n");

  // Users with keys
  const usersWithKeys = await prisma.user.count({
    where: {
      keys: {
        some: {}
      }
    }
  });

  const totalUsers = await prisma.user.count();
  console.log(`Users with keys: ${usersWithKeys} / ${totalUsers} (${((usersWithKeys / totalUsers) * 100).toFixed(1)}%)`);

  // Users with queries
  const usersWithQueries = await prisma.user.count({
    where: {
      keyQueries: {
        some: {}
      }
    }
  });
  console.log(`Users with queries: ${usersWithQueries} / ${totalUsers} (${((usersWithQueries / totalUsers) * 100).toFixed(1)}%)`);

  // Keys with signatures
  const keysWithSigs = await prisma.key.count({
    where: {
      signatures: {
        some: {}
      }
    }
  });

  const totalKeys = await prisma.key.count();
  console.log(`Keys with signatures: ${keysWithSigs} / ${totalKeys} (${((keysWithSigs / totalKeys) * 100).toFixed(1)}%)`);

  // Queries with matchings
  const queriesWithMatchings = await prisma.keyQuery.count({
    where: {
      matchings: {
        some: {}
      }
    }
  });

  const totalQueries = await prisma.keyQuery.count();
  console.log(`Queries with matchings: ${queriesWithMatchings} / ${totalQueries} (${((queriesWithMatchings / totalQueries) * 100).toFixed(1)}%)`);

  return {
    usersWithKeys,
    usersWithQueries,
    keysWithSigs,
    queriesWithMatchings
  };
}

async function main() {
  try {
    console.log("=".repeat(80));
    console.log("🔍 KEYCLIQ DATABASE INSPECTION - READ-ONLY ANALYSIS");
    console.log("=".repeat(80));

    const counts = await getTableCounts();
    await getDataSamples();
    const nullStats = await analyzeNullDistribution();
    const integrity = await analyzeIntegrity();
    const statusDist = await analyzeStatusDistribution();
    const relationships = await analyzeRelationships();

    console.log("\n" + "=".repeat(80));
    console.log("✅ ANALYSIS COMPLETE");
    console.log("=".repeat(80));

    // Return summary for potential JSON export
    return {
      counts,
      nullStats,
      integrity,
      statusDist,
      relationships,
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    console.error("\n❌ ERROR:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { main };

