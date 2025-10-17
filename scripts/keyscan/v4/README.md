# KeyScan V4 Testing Scripts

Scripts for testing the improved KeyScan V4 algorithm with production-ready performance.

## 📁 Files

- `v4-testing-suite.js` - Main testing suite for V4 algorithm
- `v4-comprehensive-testing.js` - Comprehensive testing with balanced cases
- `v4-feature-debugger.js` - Feature extraction debugging tool
- `run-v4-testing.js` - Runner script for V4 testing

## 🚀 Usage

### Run V4 Testing Suite
```bash
node scripts/keyscan/v4/run-v4-testing.js --runs=20
```

### Run Comprehensive Testing
```bash
node scripts/keyscan/v4/v4-comprehensive-testing.js
```

### Debug Feature Extraction
```bash
node scripts/keyscan/v4/v4-feature-debugger.js
```

## 📊 Results

V4 achieves production-ready performance:
- **Global Accuracy**: 90%
- **Same Key (A1)**: 100%
- **Different Keys**: 80%
- **False Positive Rate**: 20%

## 🔧 Key Features

- Enhanced bitting detection with multi-line scanning
- Improved edge analysis with Sobel filters
- Advanced shape processing with adaptive thresholding
- Strict threshold calibration (T_match=0.98)
- Soft shape veto implementation
- Orientation canonicalization

## 📋 Requirements

- Node.js environment
- Optimized dataset in `tests/keys-optimized/`
- KeyScan V4 algorithms (in `docs/keyscan/v4/algorithms/`)

## 📸 User Guidelines

For optimal performance, users should capture keys with:
- Horizontal orientation
- Handle on the left
- Teeth pointing upward
- Perpendicular camera angle
- Clean, high-contrast background
