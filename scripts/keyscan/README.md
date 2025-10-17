# KeyScan Testing Scripts

This directory contains organized testing scripts for KeyScan V3 and V4.

## 📁 Directory Structure

### `multi-tests/`
Contains scripts for running comprehensive multi-test suites (3 tests each):
- `run-v3-multi-tests.js` - V3 multi-test runner
- `run-v4-multi-tests.js` - V4 multi-test runner
- `v3-testing-suite.js` - V3 testing suite implementation
- `v4-testing-suite.js` - V4 testing suite implementation

**Results:** Saved to `tests/results/multi-tests/v3/` and `tests/results/multi-tests/v4/`

### `individual-tests/`
Contains scripts for running single, optimized tests:
- `run-v3-individual.js` - V3 individual test runner
- `run-v4-individual.js` - V4 individual test runner
- `v3-testing-suite-individual.js` - V3 individual testing suite
- `v4-testing-suite-individual.js` - V4 individual testing suite

**Results:** Saved to `tests/results/individual-tests/v3/test-1/` and `tests/results/individual-tests/v4/test-1/`

## 🚀 Usage

### Multi-Test Scripts (3 tests each)
```bash
npm run test:v3-multi    # Run V3 multi-test suite
npm run test:v4-multi    # Run V4 multi-test suite
```

### Individual Test Scripts (1 optimized test each)
```bash
npm run test:v3-individual    # Run V3 individual test
npm run test:v4-individual    # Run V4 individual test
```

## 📊 Test Structure

### Multi-Tests
- **3 tests per version** (test-1, test-2, test-3)
- **20 comparisons per test** (5 same-key-same-image, 5 same-key-different-image, 10 different-keys)
- **Comprehensive analysis** with detailed HTML reports

### Individual Tests
- **1 test per version** (test-1)
- **30 comparisons** (10 same-key-same-image, 10 same-key-different-image, 10 different-keys)
- **Optimized dataset** with mixed original/optimized images
- **Single HTML report** for quick analysis

## 🎯 Recommendations

- **For Development:** Use individual tests for quick validation
- **For Analysis:** Use multi-tests for comprehensive evaluation
- **For Production:** V3 individual test shows best overall performance (73.3% accuracy)

## 📈 Performance Summary

| Version | Multi-Test Accuracy | Individual Test Accuracy | Best Use Case |
|---------|-------------------|-------------------------|---------------|
| V3      | ~71.7%           | 73.3%                   | Production (balanced) |
| V4      | ~80.0%           | 66.7%                   | High precision needed |