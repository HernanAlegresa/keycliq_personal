# KeyScan V3 Final Tests

## Overview
This directory contains the final test suite for the KeyScan V3 system with hybrid balanced logic.

## Test Files
- `final-test-v3-20-comparisons.js` - Main comprehensive test (20 comparisons)
- `test-hybrid-balanced.js` - Quick validation test (4 critical cases)

## Test Results Summary
- **Total Pass Rate**: 85% (17/20 tests)
- **Same Key Tests**: 90% (9/10 tests) 
- **Different Key Tests**: 80% (8/10 tests)

## Running Tests
```bash
# Run comprehensive test
node scripts/v3-final-tests/final-test-v3-20-comparisons.js

# Run quick validation
node scripts/v3-final-tests/test-hybrid-balanced.js
```

## Test Structure
- **10 Same Key Tests**: Different images of the same key (aligned vs generated)
- **10 Different Key Tests**: Different keys with aligned images only

## Results Location
Test results are saved to `tests/results/` with timestamps for analysis.
