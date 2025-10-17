# KeyScan V3 Testing Scripts

Scripts for testing the current KeyScan V3 logic running in staging.

## 📁 Files

- `v3-comparative-test.js` - Comprehensive comparative testing between original and optimized datasets
- `v3-dataset-optimizer.js` - Tool for creating optimized dataset with standardized orientations

## 🚀 Usage

### Run Comparative Testing
```bash
node scripts/keyscan/v3/v3-comparative-test.js
```

### Create Optimized Dataset
```bash
node scripts/keyscan/v3/v3-dataset-optimizer.js
```

## 📊 Results

Test results show significant performance issues with V3:
- **Global Accuracy**: 0.5%
- **Same Key (A1)**: 0%
- **False Positive Rate**: 98.5%

**Recommendation**: V3 is not ready for production. Use V4 instead.

## 📋 Requirements

- Node.js environment
- Original dataset in `tests/keys/`
- KeyScan V3 algorithm from staging
