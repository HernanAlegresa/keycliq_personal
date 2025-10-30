# KeyCliq V6 - Test Suite

## 🎯 Overview

This directory contains the complete V6 test suite for KeyCliq, featuring real GPT-4o extractions and validated comparisons using the V6 logic.

## 📁 Structure

```
tests-v6/
├── 10-final-tests/          # 10 validated tests
│   ├── in/                  # 4 IN tests (query in inventory)
│   │   ├── test-1/          # lockbox-02
│   │   ├── test-2/          # lockbox-14
│   │   ├── test-3/          # regular-13
│   │   └── test-4/          # regular-02
│   └── out/                 # 5 OUT tests (query not in inventory)
│       ├── test-1/          # lockbox-04
│       ├── test-2/          # regular-09
│       ├── test-3/          # lockbox-06
│       ├── test-4/          # regular-12
│       └── test-5/          # lockbox-08
├── cache/                   # GPT-4o extraction cache
│   └── signatures/          # Cached signatures by image
└── scripts/                 # Generation scripts
    ├── master-runner.js     # Run complete process
    ├── cache-manager.js     # Extract signatures with GPT-4o
    ├── test-generator.js    # Generate tests from cache
    └── cleanup.js           # Clean up development files
```

## 🚀 Quick Start

### Generate All Tests
```bash
cd tests-v6/scripts
node master-runner.js
```

### Individual Steps
```bash
# Step 1: Extract all signatures with GPT-4o
node cache-manager.js

# Step 2: Generate 10 tests from cache
node test-generator.js

# Step 3: Clean up development files
node cleanup.js
```

## 🧪 Test Types

### IN Tests (Query in Inventory)
- **Test 1**: `lockbox-02` (aligned) vs inventory with `lockbox-02` (generated)
- **Test 2**: `lockbox-14` (aligned) vs inventory with `lockbox-14` (generated)
- **Test 3**: `regular-13` (aligned) vs inventory with `regular-13` (generated)
- **Test 4**: `regular-02` (aligned) vs inventory with `regular-02` (generated)

### OUT Tests (Query not in Inventory)
- **Test 1**: `lockbox-04` vs inventory without `lockbox-04`
- **Test 2**: `regular-09` vs inventory without `regular-09`
- **Test 3**: `lockbox-06` vs inventory without `lockbox-06`
- **Test 4**: `regular-12` vs inventory without `regular-12`
- **Test 5**: `lockbox-08` vs inventory without `lockbox-08`

## 📊 Test Results

Each test generates:
- `report.html` - Visual report with images and comparisons
- `results.json` - Complete test data and results
- `manifest.json` - Test configuration and metadata

## 🔧 V6 Logic Features

- **Real GPT-4o extractions** from actual key images
- **V6 comparison logic** with proper thresholds
- **Binary number_of_cuts** comparison (±1 tolerance)
- **bow_shape normalization** (hexagonal → rectangular)
- **confidence_score** as informational only
- **1.0 similarity threshold** for MATCH_FOUND

## 💡 Optimization

- **Cache system**: Extract once, use many times
- **Real data**: All tests use actual dataset images
- **Efficient**: Minimal API calls through intelligent caching
- **Clean**: Development files removed after generation

## 🎯 Production Ready

These tests demonstrate the V6 logic working with real user-like images, ready for integration into the staging environment.

## 📝 Notes

- All extractions use the V6 Hybrid Balanced AI model
- Tests are reproducible with fixed seeds
- HTML reports are self-contained with embedded images
- Cache can be reused for additional test variations

