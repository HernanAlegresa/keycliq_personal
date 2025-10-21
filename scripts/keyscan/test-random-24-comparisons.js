#!/usr/bin/env node

/**
 * Test ALEATORIO de 24 comparaciones con V3Fixed
 * Objetivo: 12 same-key-different-image + 12 different-keys (aleatorios cada vez)
 * Para validar robustez del sistema con diferentes combinaciones
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import the fixed system
import { ProductionKeyScanV3Fixed } from '../../app/lib/vision/keyscan/v3/ProductionKeyScanV3Fixed.js';

class V3FixedRandomTester {
    constructor() {
        this.keyScan = new ProductionKeyScanV3Fixed();
        this.results = {
            sameKeyDifferentImage: [], // 12 cases
            differentKey: []          // 12 cases
        };
        this.testId = Date.now(); // Unique test ID for this run
    }

    /**
     * Generar número aleatorio real (no seeded para variedad)
     */
    random() {
        return Math.random();
    }

    /**
     * Cargar todas las llaves disponibles con imágenes generated/aligned
     */
    async loadOptimizedDataset() {
        console.log('📊 Cargando dataset optimizado para test aleatorio...');
        
        const keysPath = path.join(process.cwd(), 'tests', 'keys-optimized');
        const availableKeys = [];
        
        // Load all available keys with generated and aligned images
        const categories = ['regular', 'lockbox'];
        for (const category of categories) {
            const categoryPath = path.join(keysPath, category);
            if (!fs.existsSync(categoryPath)) continue;
            
            const keyFolders = fs.readdirSync(categoryPath, { withFileTypes: true })
                .filter(dirent => dirent.isDirectory())
                .map(dirent => dirent.name);

            for (const keyFolder of keyFolders) {
                const keyPath = path.join(categoryPath, keyFolder);
                const files = fs.readdirSync(keyPath);
                
                const generatedFile = files.find(f => f.startsWith('generated-'));
                const alignedFile = files.find(f => f.startsWith('aligned-'));
                
                if (generatedFile && alignedFile) {
                    availableKeys.push({
                        keyId: `${category}-${keyFolder}`,
                        category,
                        generatedPath: path.join(keyPath, generatedFile),
                        alignedPath: path.join(keyPath, alignedFile)
                    });
                }
            }
        }

        console.log(`📋 ${availableKeys.length} keys disponibles con generated/aligned pairs`);
        
        if (availableKeys.length < 12) {
            throw new Error(`Insuficientes keys disponibles (${availableKeys.length}). Necesitamos al menos 12.`);
        }

        return availableKeys;
    }

    /**
     * Generar casos de test aleatorios pero siguiendo el formato correcto
     */
    generateRandomTestCases(availableKeys) {
        console.log('🎲 Generando casos ALEATORIOS de test...');
        
        // Shuffle keys array for randomization
        const shuffledKeys = [...availableKeys].sort(() => this.random() - 0.5);
        const testCases = {
            sameKeyDifferentImage: [], // 12 cases
            differentKey: []          // 12 cases
        };

        // Generate 12 SAME_KEY_DIFFERENT_IMAGE cases (aleatorios)
        console.log('  🔑 Seleccionando ALEATORIAMENTE 12 casos same-key-different-image...');
        const selectedSameKeys = shuffledKeys.slice(0, Math.min(12, shuffledKeys.length));
        
        for (let i = 0; i < 12; i++) {
            const key = selectedSameKeys[i % selectedSameKeys.length];
            
            // Random selection of which image is query vs inventory
            let queryImage, inventoryImage;
            if (this.random() > 0.5) {
                queryImage = key.generatedPath;    // generated as query
                inventoryImage = key.alignedPath;  // aligned in inventory
            } else {
                queryImage = key.alignedPath;      // aligned as query  
                inventoryImage = key.generatedPath; // generated in inventory
            }
            
            testCases.sameKeyDifferentImage.push({
                comparison: i + 1,
                keyId: key.keyId,
                category: key.category,
                queryImagePath: queryImage,
                inventoryImagePath: inventoryImage,
                caseType: 'SAME_KEY_DIFFERENT_IMAGE',
                expectedStatus: 'MATCH'
            });
        }

        // Generate 12 DIFFERENT_KEY cases (aleatorios)
        console.log('  ❌ Seleccionando ALEATORIAMENTE 12 casos different-key...');
        
        // Ensure we have enough keys for different combinations
        const maxDifferentPairs = Math.floor(shuffledKeys.length / 2);
        const numDifferentTests = Math.min(12, maxDifferentPairs);
        
        for (let i = 0; i < 12; i++) {
            // Pick two different keys ensuring they're different
            let key1Index, key2Index;
            
            do {
                key1Index = Math.floor(this.random() * shuffledKeys.length);
                key2Index = Math.floor(this.random() * shuffledKeys.length);
            } while (key1Index === key2Index || shuffledKeys[key1Index].keyId === shuffledKeys[key2Index].keyId);
            
            const key1 = shuffledKeys[key1Index];
            const key2 = shuffledKeys[key2Index];
            
            // Random selection of which images to use
            const useKey1Generated = this.random() > 0.5;
            const useKey2Generated = this.random() > 0.5;
            
            const queryImage = useKey1Generated ? key1.generatedPath : key1.alignedPath;
            const inventoryImage = useKey2Generated ? key2.generatedPath : key2.alignedPath;
            
            testCases.differentKey.push({
                comparison: i + 13,
                keyId: `${key1.keyId}_vs_${key2.keyId}`,
                category1: key1.category,
                category2: key2.category,
                queryImagePath: queryImage,
                inventoryImagePath: inventoryImage,
                caseType: 'DIFFERENT_KEY',
                expectedStatus: 'NO_MATCH'
            });
        }

        console.log(`  ✅ Generados ${testCases.sameKeyDifferentImage.length} casos same-key-different-image (ALEATORIOS)`);
        console.log(`  ✅ Generados ${testCases.differentKey.length} casos different-key (ALEATORIOS)`);
        console.log(`  📊 Total: ${testCases.sameKeyDifferentImage.length + testCases.differentKey.length} comparaciones aleatorias`);
        console.log(`  🎲 Test ID: ${this.testId} (timestamp: ${new Date().toISOString()})`);

        return testCases;
    }

    /**
     * Ejecutar una comparación individual
     */
    async runComparison(testCase) {
        try {
            const context = testCase.caseType === 'SAME_KEY_DIFFERENT_IMAGE' ? 
                { type: 'sameKey' } : { type: 'differentKey' };

            console.log(`  🔍 [${testCase.comparison}] Testing ${testCase.keyId}: ${testCase.expectedStatus}`);
            
            // Load images
            const queryBuffer = fs.readFileSync(testCase.queryImagePath);
            const inventoryBuffer = fs.readFileSync(testCase.inventoryImagePath);
            
            // Extract features
            const queryFeatures = await this.keyScan.imageProcessor.extractFeatures(queryBuffer);
            const inventoryFeatures = await this.keyScan.imageProcessor.extractFeatures(inventoryBuffer);

            if (!queryFeatures || !inventoryFeatures) {
                console.error(`     ❌ Failed to extract features for ${testCase.keyId}`);
                return null;
            }

            // Create inventory with inventory image features
            const inventory = [{
                key: { id: testCase.keyId.replace('_vs_', '_inventory_'), name: testCase.keyId },
                features: inventoryFeatures
            }];

            // Compare query image against inventory
            const matchResult = await this.keyScan.findMatchInInventory(queryFeatures, inventory, context);

            const actualStatus = matchResult ? matchResult.decision : 'NO_MATCH';
            const isCorrect = actualStatus === testCase.expectedStatus;
            
            const result = {
                comparison: testCase.comparison,
                keyId: testCase.keyId,
                caseType: testCase.caseType,
                expectedStatus: testCase.expectedStatus,
                actualStatus,
                similarity: matchResult?.similarity || 0,
                confidence: matchResult?.confidence || 0,
                margin: matchResult?.margin || 0,
                isCorrect,
                context: context.type,
                // Store paths for debugging
                queryImage: path.basename(testCase.queryImagePath),
                inventoryImage: path.basename(testCase.inventoryImagePath)
            };

            console.log(`     ${isCorrect ? '✅' : '❌'} ${testCase.expectedStatus} -> ${actualStatus} (sim: ${result.similarity.toFixed(3)}, conf: ${result.confidence.toFixed(1)})`);
            
            return result;

        } catch (error) {
            console.error(`     ❌ Error testing case ${testCase.comparison}: ${error.message}`);
            return null;
        }
    }

    /**
     * Ejecutar todos los tests aleatorios
     */
    async runRandomTests() {
        console.log('🎲 Iniciando test ALEATORIO de 24 comparaciones con V3Fixed...\n');
        console.log(`🆔 Test ID: ${this.testId}`);
        console.log(`⏰ Timestamp: ${new Date().toISOString()}\n`);
        
        const availableKeys = await this.loadOptimizedDataset();
        const testCases = this.generateRandomTestCases(availableKeys);
        
        // Execute SAME_KEY_DIFFERENT_IMAGE tests
        console.log(`\n${'='.repeat(70)}`);
        console.log('🔑 EJECUTANDO 12 CASOS SAME_KEY_DIFFERENT_IMAGE (ALEATORIOS)');
        console.log(`${'='.repeat(70)}`);
        
        for (const testCase of testCases.sameKeyDifferentImage) {
            const result = await this.runComparison(testCase);
            if (result) {
                this.results.sameKeyDifferentImage.push(result);
            }
        }

        // Execute DIFFERENT_KEY tests  
        console.log(`\n${'='.repeat(70)}`);
        console.log('❌ EJECUTANDO 12 CASOS DIFFERENT_KEY (ALEATORIOS)');
        console.log(`${'='.repeat(70)}`);
        
        for (const testCase of testCases.differentKey) {
            const result = await this.runComparison(testCase);
            if (result) {
                this.results.differentKey.push(result);
            }
        }

        return this.generateRandomTestReport();
    }

    /**
     * Generar reporte del test aleatorio
     */
    generateRandomTestReport() {
        console.log(`\n${'='.repeat(80)}`);
        console.log(`📊 REPORTE TEST ALEATORIO - V3Fixed (ID: ${this.testId})`);
        console.log(`${'='.repeat(80)}`);
        
        // SAME_KEY_DIFFERENT_IMAGE Analysis
        const sameKeyResults = this.results.sameKeyDifferentImage;
        const sameKeyCorrect = sameKeyResults.filter(r => r.isCorrect).length;
        const sameKeyTotal = sameKeyResults.length;
        const sameKeyAccuracy = sameKeyTotal > 0 ? (sameKeyCorrect / sameKeyTotal * 100) : 0;
        
        // Statistics for same-key-different-image
        const sameKeySimilarities = sameKeyResults.map(r => r.similarity);
        const sameKeyAvgSimilarity = sameKeySimilarities.length > 0 ? 
            (sameKeySimilarities.reduce((sum, s) => sum + s, 0) / sameKeySimilarities.length) : 0;
        
        console.log(`\n🔑 SAME_KEY_DIFFERENT_IMAGE Results (${sameKeyTotal}/12 casos):`);
        console.log(`   ✅ Correctos: ${sameKeyCorrect}/${sameKeyTotal}`);
        console.log(`   📈 Accuracy: ${sameKeyAccuracy.toFixed(1)}%`);
        console.log(`   📊 Similaridad promedio: ${sameKeyAvgSimilarity.toFixed(3)}`);
        console.log(`   🎯 Target ≥80%: ${sameKeyAccuracy >= 80 ? '✅ CUMPLIDO' : '❌ NO CUMPLIDO'}`);
        
        // Show failed cases
        const sameKeyFailed = sameKeyResults.filter(r => !r.isCorrect);
        if (sameKeyFailed.length > 0) {
            console.log(`   ❌ Casos fallidos:`);
            sameKeyFailed.forEach(f => {
                console.log(`      - ${f.keyId}: ${f.queryImage} vs ${f.inventoryImage} → ${f.actualStatus} (sim: ${f.similarity.toFixed(3)})`);
            });
        }

        // DIFFERENT_KEY Analysis
        const differentKeyResults = this.results.differentKey;
        const differentKeyCorrect = differentKeyResults.filter(r => r.isCorrect).length;
        const differentKeyTotal = differentKeyResults.length;
        const differentKeyAccuracy = differentKeyTotal > 0 ? (differentKeyCorrect / differentKeyTotal * 100) : 0;
        
        // Statistics for different-key
        const differentKeySimilarities = differentKeyResults.map(r => r.similarity);
        const differentKeyAvgSimilarity = differentKeySimilarities.length > 0 ? 
            (differentKeySimilarities.reduce((sum, s) => sum + s, 0) / differentKeySimilarities.length) : 0;
        
        console.log(`\n❌ DIFFERENT_KEY Results (${differentKeyTotal}/12 casos):`);
        console.log(`   ✅ Correctos: ${differentKeyCorrect}/${differentKeyTotal}`);
        console.log(`   📈 Accuracy: ${differentKeyAccuracy.toFixed(1)}%`);
        console.log(`   📊 Similaridad promedio: ${differentKeyAvgSimilarity.toFixed(3)}`);
        console.log(`   🎯 Target ≥80%: ${differentKeyAccuracy >= 80 ? '✅ CUMPLIDO' : '❌ NO CUMPLIDO'}`);
        
        // Show failed cases (false positives)
        const differentKeyFailed = differentKeyResults.filter(r => !r.isCorrect);
        if (differentKeyFailed.length > 0) {
            console.log(`   ⚠️  Falsos positivos detectados:`);
            differentKeyFailed.forEach(f => {
                console.log(`      - ${f.keyId}: ${f.queryImage} vs ${f.inventoryImage} → ${f.actualStatus} (sim: ${f.similarity.toFixed(3)})`);
            });
        }

        // GLOBAL Analysis
        const globalCorrect = sameKeyCorrect + differentKeyCorrect;
        const globalTotal = sameKeyTotal + differentKeyTotal;
        const globalAccuracy = globalTotal > 0 ? (globalCorrect / globalTotal * 100) : 0;
        
        console.log(`\n🌍 GLOBAL Results (${globalTotal}/24 comparaciones aleatorias):`);
        console.log(`   ✅ Total correctos: ${globalCorrect}/${globalTotal}`);
        console.log(`   📈 Global accuracy: ${globalAccuracy.toFixed(1)}%`);
        
        // Final evaluation with strict criteria
        console.log(`\n🎯 EVALUACIÓN TEST ALEATORIO:`);
        const sameKeyTargetMet = sameKeyAccuracy >= 80;
        const differentKeyTargetMet = differentKeyAccuracy >= 80;
        const bothTargetsMet = sameKeyTargetMet && differentKeyTargetMet;
        
        console.log(`   🎲 Test ID: ${this.testId}`);
        console.log(`   🔑 Same-key-different-image ≥80%: ${sameKeyTargetMet ? '✅' : '❌'} (${sameKeyAccuracy.toFixed(1)}%)`);
        console.log(`   ❌ Different-key ≥80%: ${differentKeyTargetMet ? '✅' : '❌'} (${differentKeyAccuracy.toFixed(1)}%)`);
        console.log(`   📊 Total casos evaluados: ${globalTotal}/24`);
        
        if (bothTargetsMet) {
            console.log(`\n🎉 ¡TEST ALEATORIO EXITOSO!`);
            console.log(`   ✅ Ambos criterios cumplen ≥80% accuracy`);
            console.log(`   🚀 Sistema robusto con selección aleatoria`);
        } else {
            console.log(`\n⚠️  TEST ALEATORIO CON PROBLEMAS`);
            console.log(`   🔧 Se requiere análisis de casos específicos`);
            if (!sameKeyTargetMet) {
                console.log(`   🔑 Same-key-different-image: ${sameKeyAccuracy.toFixed(1)}% < 80%`);
            }
            if (!differentKeyTargetMet) {
                console.log(`   ❌ Different-key: ${differentKeyAccuracy.toFixed(1)}% < 80%`);
            }
        }
        
        return {
            testId: this.testId,
            timestamp: new Date().toISOString(),
            sameKeyAccuracy,
            differentKeyAccuracy,
            globalAccuracy,
            bothTargetsMet,
            totalTests: globalTotal,
            results: {
                sameKeyDifferentImage: sameKeyResults,
                differentKey: differentKeyResults
            }
        };
    }

    /**
     * Guardar reporte del test aleatorio
     */
    async saveRandomTestReport(reportData) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        
        // Create results directory
        const resultsDir = path.join(process.cwd(), 'tests', 'results', 'random-tests');
        if (!fs.existsSync(resultsDir)) {
            fs.mkdirSync(resultsDir, { recursive: true });
        }

        const reportPath = path.join(resultsDir, `random-test-${this.testId}-${timestamp}.json`);
        
        const fullReport = {
            metadata: {
                timestamp: new Date().toISOString(),
                testId: this.testId,
                system: 'KeyScan V3Fixed',
                testType: 'Random 24 Comparisons (12 same-key-different-image + 12 different-key)',
                randomization: 'True random selection with Math.random()',
                objectives: {
                    sameKeyDifferentImage: '≥80%',
                    differentKey: '≥80%'
                }
            },
            results: {
                sameKeyAccuracy: reportData.sameKeyAccuracy,
                differentKeyAccuracy: reportData.differentKeyAccuracy,
                globalAccuracy: reportData.globalAccuracy,
                totalTests: reportData.totalTests,
                targetAchieved: reportData.bothTargetsMet
            },
            testDetails: reportData.results,
            summary: {
                systemStable: reportData.bothTargetsMet,
                recommendedAction: reportData.bothTargetsMet ? 
                    'SYSTEM_STABLE' : 
                    'REQUIRES_ANALYSIS'
            }
        };
        
        fs.writeFileSync(reportPath, JSON.stringify(fullReport, null, 2));
        console.log(`\n💾 Reporte test aleatorio guardado en: ${reportPath}`);
        
        return reportPath;
    }
}

// Ejecutar el test aleatorio
const tester = new V3FixedRandomTester();
tester.runRandomTests().then(async (reportData) => {
    await tester.saveRandomTestReport(reportData);
    
    // Exit code based on success
    const exitCode = reportData.bothTargetsMet ? 0 : 1;
    console.log(`\n🏁 Test aleatorio completado. Exit code: ${exitCode}`);
    process.exit(exitCode);
    
}).catch(error => {
    console.error('❌ Test aleatorio falló:', error);
    process.exit(1);
});
