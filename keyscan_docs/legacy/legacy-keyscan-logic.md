# Legacy Key Scan Logic

## Summary
This document explains the initial Key Scan development approach that led to our current MVP solution. The legacy system used Hu moments and 16D signatures, which provided the foundation for the improved V1.2 Hybrid system.

## Initial Development Approach

### Core Algorithm (V1)
The legacy Key Scan system was built using a **simplified 16D signature** approach:

- **8D Contour Features**: Edge density, aspect ratio, centroid position, compactness, solidity, eccentricity, circularity
- **8D Bitting Features**: Horizontal and vertical projections, section densities, symmetry analysis
- **Single Weighted Score**: 60% bitting + 40% contour similarity

### Hu Moments Foundation
The system started with **7D Hu moments** for shape recognition:
- Logarithmic normalization to reduce magnitude
- Shape invariance properties
- Good for basic contour matching

### Matching Algorithm
- **Cosine Similarity** as primary metric
- **Fixed Thresholds**: MATCH≥0.95, POSSIBLE≥0.85, NO_MATCH≥0.75
- **Hybrid Scoring**: Combined multiple distance metrics

## Legacy Performance

### Strengths
- **Same Key Consistency**: 100% accuracy
- **Simple Architecture**: Easy to understand and maintain
- **Fast Processing**: Lightweight algorithms

### Limitations
- **Different Key Discrimination**: Only 47.62% accuracy
- **Inventory Simulation**: 0% accuracy (major limitation)
- **Overall Accuracy**: 53.13% (below target)
- **Generic Features**: Contour features too similar between different keys

## Why Legacy Was Replaced

The legacy system had fundamental limitations:
1. **Insufficient Feature Discrimination**: 16D signature couldn't distinguish similar keys
2. **No Context Awareness**: Same thresholds for all scenarios
3. **Poor Inventory Performance**: Failed to work in real-world scenarios
4. **Limited Preprocessing**: Basic image processing only

## Technical Implementation

### Image Processing
```javascript
// Legacy approach
const huMoments = await extractHuMoments(imageBuffer);
const bittingPattern = await extractBittingPattern(imageBuffer);
const signature = [...huMoments, ...bittingPattern]; // 16D
```

### Matching Logic
```javascript
// Legacy matching
const score = 0.6 * bittingSimilarity + 0.4 * contourSimilarity;
const status = score >= 0.95 ? 'MATCH' : 'NO_MATCH';
```

## Legacy Files Location
- **Code**: `app/lib/vision/legacy/`
- **Testing**: `scripts/legacy/`
- **Status**: Obsolete, kept for reference only

## Next Steps / Improvements

The legacy system was replaced by **V1.2 Hybrid** which addresses all major limitations:
- **20D Signature**: More discriminative features
- **Adaptive Thresholds**: Context-aware matching
- **Better Preprocessing**: Enhanced image processing
- **Improved Performance**: 62.50% overall accuracy vs 53.13%

The legacy system served as an important foundation, but the current MVP solution provides significantly better real-world performance.
