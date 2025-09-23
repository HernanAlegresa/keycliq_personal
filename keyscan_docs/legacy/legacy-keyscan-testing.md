# Legacy Key Scan Testing

## Summary
This document explains the testing methodology used during the initial Key Scan development. The legacy testing approach helped identify limitations and guided the development of the current MVP solution.

## Legacy Testing Framework

### Test Scenarios
The legacy system was tested using three main scenarios:

1. **Same Key Consistency (7 tests)**
   - **Purpose**: Verify that different photos of the same key match
   - **Method**: Compare angle_00 vs angle_01 of each key
   - **Result**: 100% accuracy (excellent)

2. **Different Key Discrimination (21 tests)**
   - **Purpose**: Verify that different keys do NOT match
   - **Method**: Compare all combinations of different keys
   - **Result**: 47.62% accuracy (poor)

3. **Inventory Simulation (4 tests)**
   - **Purpose**: Simulate real-world usage
   - **Method**: User with 3 keys in inventory, scans 4 new keys
   - **Result**: 0% accuracy (failed completely)

### Legacy QA Scripts
- **`test-v1-simple.js`**: Basic 16D signature testing
- **`test-optimized.js`**: Hu moments with normalization
- **`test-combined-signature.js`**: 39D signature (7D Hu + 32D Bitting)
- **`test-adaptive-thresholds.js`**: Multiple threshold configurations

### Dataset Validation
- **`validate-dataset.js`**: Structure validation
- **7 keys, 14 images**: Initial dataset
- **Metadata tracking**: Key descriptions and photo quality

## Legacy Performance Results

### Overall Results
- **Same Key Consistency**: 100% (7/7) ✅
- **Different Key Discrimination**: 47.62% (10/21) ❌
- **Inventory Simulation**: 0% (0/4) ❌
- **Overall Accuracy**: 53.13% ❌

### Score Distribution
- **Mean Score**: 0.889
- **Score Range**: 0.645 - 0.998
- **High Similarity**: 51% of scores in 0.9-1.0 range
- **Poor Discrimination**: Many different keys scored >0.95

## Legacy Testing Limitations

### Dataset Issues
- **Small Dataset**: Only 7 keys for testing
- **Similar Keys**: Some keys practically identical (key_002 vs key_003: 0.998)
- **Limited Diversity**: Only "regular keys" type
- **Angle Limitation**: Only 2 angles per key

### Algorithm Problems
- **Feature Overlap**: Contour features too generic
- **Threshold Sensitivity**: Poor balance between precision and recall
- **No Context Awareness**: Same thresholds for all scenarios
- **Insufficient Discrimination**: 16D signature not detailed enough

## Legacy Test Results Analysis

### Problematic Cases
```
key_002 vs key_003: 0.998 (MATCH) ❌ - Practically identical
key_002 vs key_005: 0.998 (MATCH) ❌ - Very similar
key_003 vs key_005: 0.998 (MATCH) ❌ - Almost identical
```

### Successful Discriminations
```
key_004 vs key_007: 0.645 (NO_MATCH) ✅ - Good discrimination
key_004 vs key_006: 0.668 (NO_MATCH) ✅ - Effective discrimination
```

## Why Legacy Testing Failed

### Fundamental Issues
1. **Insufficient Feature Set**: 16D signature couldn't capture key differences
2. **Poor Threshold Calibration**: No context-specific thresholds
3. **Limited Preprocessing**: Basic image processing only
4. **Dataset Limitations**: Too small and similar keys

### Testing Methodology Problems
- **No Adaptive Thresholds**: Same thresholds for all scenarios
- **No Context Awareness**: Inventory simulation failed completely
- **No Confidence Scoring**: Binary MATCH/NO_MATCH only
- **No Delta-Margin Analysis**: No confidence measurement

## Legacy Files Location
- **Testing Scripts**: `scripts/legacy/`
- **Status**: Obsolete, kept for reference only
- **Current Testing**: `scripts/keyscan/keyscan-qa.js`

## Next Steps / Improvements

The legacy testing approach was replaced by **V1.2 Hybrid testing** which addresses all major limitations:
- **20D Signature**: More discriminative features
- **Adaptive Thresholds**: Context-aware testing
- **Better Preprocessing**: Enhanced image processing
- **Improved Performance**: 62.50% overall accuracy vs 53.13%

The legacy testing was crucial for identifying limitations and guiding the development of the current MVP solution.
