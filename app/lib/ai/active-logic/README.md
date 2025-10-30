# Active KeyScan Logic - V6 Hybrid Balanced

## 📋 Overview

This directory contains the **active production logic** for KeyScan V6 "Hybrid Balanced". This logic has been validated with 10 comprehensive tests and achieved 100% accuracy on the test dataset.

## 🎯 Current Version

- **Version**: V6 "Hybrid Balanced"
- **Status**: ✅ Production Ready
- **Validation**: 10/10 tests passed
- **Technology**: GPT-4o multimodal AI

## 🔧 Components

### `multimodal-keyscan.server.js`

Contains the complete V6 implementation:

- **AI Analysis**: `analyzeKeyWithHybridBalancedAI()`
- **Signature Comparison**: `compareHybridBalancedKeySignatures()`
- **Schema**: Hybrid Balanced parameters with validation
- **Prompt**: Optimized for GPT-4o extraction

## 📊 Parameters & Weights

V6 uses **7 parameters** with the following weights:

| Parameter | Weight | Description |
|-----------|--------|-------------|
| `unique_mark` | 30% | Distinctive marks (tape, stain, paint) |
| `key_color` | 25% | Primary color (silver, brass, etc.) |
| `bow_shape` | 20% | Shape normalization (hexagonal → rectangular) |
| `number_of_cuts` | 15% | Cuts with ±1 tolerance |
| `has_bow_text` | 5% | Text/code visibility |
| `blade_profile` | 3% | Blade profile type |
| `groove_count` | 2% | Parallel grooves count |

## 🧠 Decision Logic

**V6 Threshold**: Only `similarity === 1.0` generates `MATCH_FOUND`

- `similarity === 1.0` → **MATCH_FOUND**
- `similarity < 1.0` → **NO_MATCH**
- Multiple perfect matches → **POSSIBLE_KEYS**

## 📥 Usage

### Import in your code:

```javascript
import { 
  analyzeKeyWithHybridBalancedAI, 
  compareHybridBalancedKeySignatures 
} from "~/lib/ai/active-logic/multimodal-keyscan.server";
```

### Example Usage:

```javascript
// Analyze a key image
const analysisResult = await analyzeKeyWithHybridBalancedAI(imageBuffer, 'image/jpeg');
const signature = analysisResult.signature;

// Compare two signatures
const comparison = compareHybridBalancedKeySignatures(querySignature, inventorySignature);
// Returns: { similarity, matchType, details }
```

## 🔄 Migration & Legacy

### Current Status
- **Active**: V6 Hybrid Balanced (this directory)
- **Legacy**: V5 stored in `app/lib/ai/v5/` (not deleted, for reference)
- **Previous**: Older versions in `app/lib/ai/v2/`, `v3/`, `v4/`

### Rollback Plan

If you need to revert to V5:

1. Update imports in `app/lib/keyscan.server.js` and `app/routes/scan_.check.jsx`
2. Change from `active-logic/multimodal-keyscan.server.js` to `v5/multimodal-keyscan-v5.server.js`
3. Note: V5 uses different parameters and thresholds

## 🧪 Testing

Test suite located in `tests-v6/10-final-tests/`:

- **IN Tests**: Query keys that exist in inventory
- **OUT Tests**: Query keys not in inventory
- **Expected**: 100% accuracy with V6 logic

## 📝 Notes

- All signatures are cached in `KeySignature` table
- Cache prevents redundant API calls
- Signature format is JSON validated by Zod schema
- Temperature: 0.1 for consistent results

## 🔗 Related Files

- **Wrapper**: `app/lib/keyscan.server.js` → `processKeyImageV6()`
- **Route**: `app/routes/scan_.check.jsx` → calls V6 logic
- **Database**: `KeySignature` model stores all signatures
- **Schema**: `prisma/schema.prisma`

---

**Last Updated**: 2025
**Maintained By**: KeyCliq Team

