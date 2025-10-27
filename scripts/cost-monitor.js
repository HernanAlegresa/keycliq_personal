/**
 * OpenAI Cost Monitor - Real-time cost tracking
 * Monitors API usage during testing to stay within budget
 */

// Cost estimates based on OpenAI pricing (as of 2024)
const COST_ESTIMATES = {
  'gpt-4o': {
    input: 0.0025,  // $2.50 per 1M tokens
    output: 0.01,   // $10.00 per 1M tokens
    image: 0.01     // $10.00 per 1M tokens
  }
};

// Estimated tokens per request
const TOKEN_ESTIMATES = {
  prompt: 500,      // Average prompt tokens
  response: 200,    // Average response tokens
  image: 1000       // Average image tokens
};

/**
 * Calculate estimated cost for a single API call
 */
function calculateSingleCallCost() {
  const model = 'gpt-4o';
  const costs = COST_ESTIMATES[model];
  
  const inputCost = (TOKEN_ESTIMATES.prompt * costs.input) / 1000000;
  const outputCost = (TOKEN_ESTIMATES.response * costs.output) / 1000000;
  const imageCost = (TOKEN_ESTIMATES.image * costs.image) / 1000000;
  
  return inputCost + outputCost + imageCost;
}

/**
 * Calculate total cost for test suite
 */
function calculateTestSuiteCost() {
  const singleCallCost = calculateSingleCallCost();
  
  // V2: 3 tests × 16 API calls per test (1 query + 15 inventory)
  const v2Cost = 3 * 16 * singleCallCost;
  
  // V3: 3 tests × 16 API calls per test
  const v3Cost = 3 * 16 * singleCallCost;
  
  // V4: 3 tests × 16 API calls per test
  const v4Cost = 3 * 16 * singleCallCost;
  
  return {
    singleCall: singleCallCost,
    v2: v2Cost,
    v3: v3Cost,
    v4: v4Cost,
    total: v2Cost + v3Cost + v4Cost,
    breakdown: {
      'V2 (3 tests)': `$${v2Cost.toFixed(4)}`,
      'V3 (3 tests)': `$${v3Cost.toFixed(4)}`,
      'V4 (3 tests)': `$${v4Cost.toFixed(4)}`,
      'Total': `$${(v2Cost + v3Cost + v4Cost).toFixed(4)}`
    }
  };
}

/**
 * Display cost analysis
 */
function displayCostAnalysis() {
  console.log(`\n💰 OPENAI COST ANALYSIS`);
  console.log(`========================`);
  
  const costs = calculateTestSuiteCost();
  
  console.log(`📊 Single API Call Cost: $${costs.singleCall.toFixed(6)}`);
  console.log(`📊 API Calls per Test: 16 (1 query + 15 inventory)`);
  console.log(`📊 Tests per Version: 3`);
  console.log(`📊 Total Versions: 3 (V2, V3, V4)`);
  
  console.log(`\n💸 COST BREAKDOWN:`);
  Object.entries(costs.breakdown).forEach(([key, value]) => {
    console.log(`   ${key}: ${value}`);
  });
  
  console.log(`\n🎯 BUDGET ANALYSIS:`);
  console.log(`   Your Budget: $5.00`);
  console.log(`   Estimated Cost: $${costs.total.toFixed(4)}`);
  console.log(`   Remaining Buffer: $${(5.00 - costs.total).toFixed(4)}`);
  
  if (costs.total <= 5.00) {
    console.log(`   ✅ Within budget!`);
  } else {
    console.log(`   ⚠️ Over budget! Consider reducing tests.`);
  }
  
  console.log(`\n💡 OPTIMIZATION TIPS:`);
  console.log(`   - Each test uses 16 API calls (1 query + 15 inventory)`);
  console.log(`   - Most expensive: Image processing`);
  console.log(`   - Cheapest: Text-only analysis`);
  console.log(`   - Buffer allows for ~${Math.floor((5.00 - costs.total) / costs.singleCall)} additional API calls`);
}

// Run cost analysis
displayCostAnalysis();
