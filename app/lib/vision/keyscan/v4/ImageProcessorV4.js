import sharp from 'sharp';

class ImageProcessorV4 {
    constructor(config = {}) {
        this.config = {
            preprocessing: {
                resize: {
                    width: config.resizeWidth || 512,
                    height: config.resizeHeight || 512,
                    fit: config.resizeFit || 'inside',  // Cambio clave: 'inside' en lugar de 'fill'
                    background: config.resizeBackground || { r: 0, g: 0, b: 0, alpha: 0 }
                },
                sharpen: {
                    sigma: config.sharpenSigma || 1.0,
                    flat: config.sharpenFlat || 1.0,
                    jagged: config.sharpenJagged || 2.0
                },
                normalize: config.normalize !== false,
                grayscale: config.grayscale !== false
            },
            featureExtraction: {
                bitting: {
                    profileResolution: config.bittingResolution || 100,
                    notchDetection: config.notchDetection !== false
                },
                edge: {
                    histogramBins: config.edgeBins || 64
                },
                shape: {
                    momentsCount: config.momentsCount || 7,
                    adaptiveThreshold: config.adaptiveThreshold !== false  // Mejora clave
                }
            }
        };
    }

    /**
     * Procesa imagen con mejoras V4
     */
    async preprocess(imageInput) {
        try {
            let image = sharp(imageInput);
            
            // Resize con 'inside' para mantener proporciones
            image = image.resize(
                this.config.preprocessing.resize.width, 
                this.config.preprocessing.resize.height, 
                { 
                    fit: this.config.preprocessing.resize.fit,
                    background: this.config.preprocessing.resize.background
                }
            );

            // Aplicar mejoras de calidad
            if (this.config.preprocessing.grayscale) {
                image = image.grayscale();
            }
            
            if (this.config.preprocessing.normalize) {
                image = image.normalize();
            }
            
            image = image.sharpen({
                sigma: this.config.preprocessing.sharpen.sigma,
                flat: this.config.preprocessing.sharpen.flat,
                jagged: this.config.preprocessing.sharpen.jagged
            });

            const buffer = await image.toBuffer();
            const metadata = await sharp(buffer).metadata();
            
            return { buffer, metadata };
            
        } catch (error) {
            throw new Error(`Error en preprocessing V4: ${error.message}`);
        }
    }

    /**
     * Extrae features con mejoras V4
     */
    async extractFeatures(imageBuffer) {
        try {
            const { buffer: processedImage, metadata } = await this.preprocess(imageBuffer);
            
            // Extraer features en paralelo para mejor performance
            const [bitting, edge, shape] = await Promise.all([
                this.extractBittingFeatures(processedImage),
                this.extractEdgeFeatures(processedImage),
                this.extractShapeFeatures(processedImage)
            ]);

            return {
                bitting,
                edge,
                shape,
                metadata: {
                    width: metadata.width,
                    height: metadata.height,
                    channels: metadata.channels,
                    density: metadata.density
                }
            };

        } catch (error) {
            throw new Error(`Error en extractFeatures V4: ${error.message}`);
        }
    }

    /**
     * Extrae features de bitting mejorado
     */
    async extractBittingFeatures(imageBuffer) {
        try {
            const image = sharp(imageBuffer);
            const { data, info } = await image.raw().toBuffer({ resolveWithObject: true });
            
            // Detectar perfil de bitting mejorado
            const profile = await this.detectBittingProfile(data, info.width, info.height);
            
            // Detectar notches
            const notches = await this.detectNotches(profile);
            
            // Calcular varianza del perfil
            const variance = this.calculateProfileVariance(profile);
            
            return {
                profile,
                notches,
                variance,
                quality: this.assessBittingQuality(profile, notches, variance)
            };

        } catch (error) {
            console.error('Error en extractBittingFeatures V4:', error);
            return { profile: [], notches: 0, variance: 0, quality: 0 };
        }
    }

    /**
     * Extrae features de bordes mejorado
     */
    async extractEdgeFeatures(imageBuffer) {
        try {
            const image = sharp(imageBuffer);
            
            // Aplicar múltiples filtros de bordes para mejor detección
            const { data: sobelData, info } = await image
                .greyscale()
                .convolve({
                    width: 3,
                    height: 3,
                    kernel: [-1, 0, 1, -2, 0, 2, -1, 0, 1] // Sobel horizontal
                })
                .raw()
                .toBuffer({ resolveWithObject: true });

            const { data: sobelYData } = await sharp(imageBuffer)
                .greyscale()
                .convolve({
                    width: 3,
                    height: 3,
                    kernel: [-1, -2, -1, 0, 0, 0, 1, 2, 1] // Sobel vertical
                })
                .raw()
                .toBuffer({ resolveWithObject: true });

            // Combinar bordes horizontal y vertical
            const combinedEdges = this.combineEdgeMaps(sobelData, sobelYData, info.width, info.height);

            // Crear histograma de bordes mejorado
            const histogram = this.createEnhancedEdgeHistogram(combinedEdges);
            
            return {
                histogram,
                strength: this.calculateEnhancedEdgeStrength(combinedEdges),
                direction: this.calculateEdgeDirection(combinedEdges, info.width, info.height)
            };

        } catch (error) {
            console.error('Error en extractEdgeFeatures V4:', error);
            return { histogram: [], strength: 0, direction: 0 };
        }
    }

    /**
     * Extrae features de shape con canonicalización
     */
    async extractShapeFeatures(imageBuffer) {
        try {
            const image = sharp(imageBuffer);
            const { data, info } = await image
                .greyscale()
                .toBuffer({ resolveWithObject: true });

            // Aplicar threshold adaptativo
            const thresholded = await this.applyAdaptiveThreshold(data, info.width, info.height);
            
            // Encontrar contorno
            const contour = this.findContour(thresholded, info.width, info.height);
            
            // Calcular momentos de Hu
            const moments = this.calculateHuMoments(contour);
            
            // Detectar orientación principal
            const orientation = this.detectMainOrientation(contour);
            
            return {
                contour,
                moments,
                orientation,
                area: this.calculateContourArea(contour),
                perimeter: this.calculateContourPerimeter(contour)
            };

        } catch (error) {
            console.error('Error en extractShapeFeatures V4:', error);
            return { contour: [], moments: [], orientation: 0, area: 0, perimeter: 0 };
        }
    }

    /**
     * Detecta perfil de bitting mejorado con mejor discriminación
     */
    async detectBittingProfile(data, width, height) {
        try {
            const profile = [];
            const centerY = Math.floor(height / 2);
            const scanWidth = Math.floor(width * 0.9); // Usar 90% del ancho
            const startX = Math.floor(width * 0.05);

            // Múltiples líneas de escaneo para mejor detección
            const scanLines = [
                centerY - Math.floor(height * 0.1),
                centerY,
                centerY + Math.floor(height * 0.1)
            ];

            // Escanear múltiples líneas
            for (let x = startX; x < startX + scanWidth; x++) {
                let totalDepth = 0;
                let validScans = 0;
                
                for (const scanY of scanLines) {
                    if (scanY >= 0 && scanY < height) {
                        let maxIntensity = 0;
                        let minIntensity = 255;
                        
                        // Escanear banda horizontal para detectar bitting
                        const bandWidth = Math.floor(width * 0.02);
                        const startScanX = Math.max(0, x - bandWidth);
                        const endScanX = Math.min(width, x + bandWidth);
                        
                        for (let scanX = startScanX; scanX < endScanX; scanX++) {
                            const pixelIndex = scanY * width + scanX;
                            if (pixelIndex < data.length) {
                                const intensity = data[pixelIndex];
                                maxIntensity = Math.max(maxIntensity, intensity);
                                minIntensity = Math.min(minIntensity, intensity);
                            }
                        }
                        
                        const depth = maxIntensity - minIntensity;
                        if (depth > 10) { // Solo considerar diferencias significativas
                            totalDepth += depth;
                            validScans++;
                        }
                    }
                }
                
                // Calcular profundidad promedio
                const avgDepth = validScans > 0 ? totalDepth / validScans : 0;
                profile.push(avgDepth / 255); // Normalizar
            }

            // Aplicar filtro de realce para mejorar discriminación
            const enhancedProfile = this.enhanceBittingProfile(profile);
            return enhancedProfile;

        } catch (error) {
            console.error('Error en detectBittingProfile:', error);
            return [];
        }
    }

    /**
     * Aplica threshold adaptativo
     */
    async applyAdaptiveThreshold(data, width, height) {
        try {
            // Calcular histograma local
            const histogram = new Array(256).fill(0);
            
            for (let i = 0; i < data.length; i++) {
                histogram[data[i]]++;
            }
            
            // Encontrar umbral usando método de Otsu mejorado
            const threshold = this.calculateOtsuThreshold(histogram, data.length);
            
            // Aplicar threshold
            const thresholded = new Uint8Array(data.length);
            for (let i = 0; i < data.length; i++) {
                thresholded[i] = data[i] > threshold ? 255 : 0;
            }
            
            return thresholded;

        } catch (error) {
            console.error('Error en applyAdaptiveThreshold:', error);
            return data;
        }
    }

    /**
     * Calcula threshold de Otsu
     */
    calculateOtsuThreshold(histogram, totalPixels) {
        let sum = 0;
        for (let i = 0; i < 256; i++) {
            sum += i * histogram[i];
        }
        
        let sumB = 0;
        let wB = 0;
        let wF = 0;
        let varMax = 0;
        let threshold = 0;
        
        for (let t = 0; t < 256; t++) {
            wB += histogram[t];
            if (wB === 0) continue;
            
            wF = totalPixels - wB;
            if (wF === 0) break;
            
            sumB += t * histogram[t];
            
            const mB = sumB / wB;
            const mF = (sum - sumB) / wF;
            
            const varBetween = wB * wF * (mB - mF) * (mB - mF);
            
            if (varBetween > varMax) {
                varMax = varBetween;
                threshold = t;
            }
        }
        
        return threshold;
    }

    /**
     * Detecta notches en el perfil mejorado
     */
    async detectNotches(profile) {
        if (profile.length < 5) return 0;
        
        let notches = 0;
        
        // Calcular umbral dinámico basado en la varianza del perfil
        const mean = profile.reduce((sum, val) => sum + val, 0) / profile.length;
        const variance = profile.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / profile.length;
        const dynamicThreshold = Math.sqrt(variance) * 0.5; // Umbral dinámico
        
        // Suavizar perfil para mejor detección
        const smoothedProfile = this.smoothProfile(profile);
        
        // Detectar picos locales
        for (let i = 2; i < smoothedProfile.length - 2; i++) {
            const prev2 = smoothedProfile[i - 2];
            const prev1 = smoothedProfile[i - 1];
            const curr = smoothedProfile[i];
            const next1 = smoothedProfile[i + 1];
            const next2 = smoothedProfile[i + 2];
            
            // Detectar pico local con condiciones más estrictas
            const isPeak = curr > prev1 && curr > next1 && 
                          curr > prev2 + dynamicThreshold && 
                          curr > next2 + dynamicThreshold &&
                          curr > mean + dynamicThreshold;
            
            if (isPeak) {
                notches++;
                i += 2; // Saltar algunos píxeles para evitar detección múltiple
            }
        }
        
        return notches;
    }

    /**
     * Calcula varianza del perfil
     */
    calculateProfileVariance(profile) {
        if (profile.length === 0) return 0;
        
        const mean = profile.reduce((sum, val) => sum + val, 0) / profile.length;
        const variance = profile.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / profile.length;
        
        return variance;
    }

    /**
     * Crea histograma de bordes
     */
    createEdgeHistogram(data, width, height) {
        const histogram = new Array(this.config.featureExtraction.edge.histogramBins).fill(0);
        const binSize = 256 / this.config.featureExtraction.edge.histogramBins;
        
        for (let i = 0; i < data.length; i++) {
            const bin = Math.floor(data[i] / binSize);
            if (bin < histogram.length) {
                histogram[bin]++;
            }
        }
        
        // Normalizar histograma
        const total = data.length;
        return histogram.map(val => val / total);
    }

    /**
     * Encuentra contorno de la forma
     */
    findContour(data, width, height) {
        // Implementación simplificada de detección de contornos
        const contour = [];
        const visited = new Array(width * height).fill(false);
        
        // Buscar primer pixel de borde
        let startX = -1, startY = -1;
        for (let y = 0; y < height && startX === -1; y++) {
            for (let x = 0; x < width && startX === -1; x++) {
                if (data[y * width + x] === 255) {
                    startX = x;
                    startY = y;
                }
            }
        }
        
        if (startX === -1) return contour;
        
        // Seguir contorno usando algoritmo de seguimiento de bordes simplificado
        const directions = [
            [-1, -1], [-1, 0], [-1, 1],
            [0, -1],           [0, 1],
            [1, -1],  [1, 0],  [1, 1]
        ];
        
        let currentX = startX;
        let currentY = startY;
        let direction = 0;
        
        do {
            contour.push({ x: currentX, y: currentY });
            visited[currentY * width + currentX] = true;
            
            let found = false;
            for (let i = 0; i < 8 && !found; i++) {
                const nextDirection = (direction + i) % 8;
                const nextX = currentX + directions[nextDirection][0];
                const nextY = currentY + directions[nextDirection][1];
                
                if (nextX >= 0 && nextX < width && nextY >= 0 && nextY < height &&
                    !visited[nextY * width + nextX] && data[nextY * width + nextX] === 255) {
                    currentX = nextX;
                    currentY = nextY;
                    direction = nextDirection;
                    found = true;
                }
            }
            
            if (!found) break;
            
        } while (currentX !== startX || currentY !== startY || contour.length < 10);
        
        return contour;
    }

    /**
     * Calcula momentos de Hu
     */
    calculateHuMoments(contour) {
        if (contour.length === 0) return [];
        
        // Calcular momentos centrales
        let m00 = 0, m10 = 0, m01 = 0;
        
        for (const point of contour) {
            m00 += 1;
            m10 += point.x;
            m01 += point.y;
        }
        
        const cx = m10 / m00;
        const cy = m01 / m00;
        
        // Calcular momentos centralizados
        let mu20 = 0, mu02 = 0, mu11 = 0, mu30 = 0, mu03 = 0, mu12 = 0, mu21 = 0;
        
        for (const point of contour) {
            const dx = point.x - cx;
            const dy = point.y - cy;
            
            mu20 += dx * dx;
            mu02 += dy * dy;
            mu11 += dx * dy;
            mu30 += dx * dx * dx;
            mu03 += dy * dy * dy;
            mu12 += dx * dy * dy;
            mu21 += dx * dx * dy;
        }
        
        // Normalizar momentos
        const gamma = 2.0;
        const mu20_n = mu20 / Math.pow(m00, gamma);
        const mu02_n = mu02 / Math.pow(m00, gamma);
        const mu11_n = mu11 / Math.pow(m00, gamma);
        const mu30_n = mu30 / Math.pow(m00, gamma + 0.5);
        const mu03_n = mu03 / Math.pow(m00, gamma + 0.5);
        const mu12_n = mu12 / Math.pow(m00, gamma + 0.5);
        const mu21_n = mu21 / Math.pow(m00, gamma + 0.5);
        
        // Calcular momentos de Hu
        const hu1 = mu20_n + mu02_n;
        const hu2 = Math.pow(mu20_n - mu02_n, 2) + 4 * mu11_n * mu11_n;
        const hu3 = Math.pow(mu30_n - 3 * mu12_n, 2) + Math.pow(3 * mu21_n - mu03_n, 2);
        const hu4 = Math.pow(mu30_n + mu12_n, 2) + Math.pow(mu21_n + mu03_n, 2);
        
        return [hu1, hu2, hu3, hu4, 0, 0, 0]; // Solo primeros 4 momentos para simplicidad
    }

    /**
     * Detecta orientación principal
     */
    detectMainOrientation(contour) {
        if (contour.length < 2) return 0;
        
        // Calcular eje principal usando análisis de componentes principales simplificado
        let sumX = 0, sumY = 0;
        for (const point of contour) {
            sumX += point.x;
            sumY += point.y;
        }
        
        const cx = sumX / contour.length;
        const cy = sumY / contour.length;
        
        let sumXX = 0, sumYY = 0, sumXY = 0;
        for (const point of contour) {
            const dx = point.x - cx;
            const dy = point.y - cy;
            sumXX += dx * dx;
            sumYY += dy * dy;
            sumXY += dx * dy;
        }
        
        // Calcular ángulo del eje principal
        const angle = 0.5 * Math.atan2(2 * sumXY, sumXX - sumYY);
        return angle * 180 / Math.PI; // Convertir a grados
    }

    /**
     * Realza perfil de bitting para mejor discriminación
     */
    enhanceBittingProfile(profile) {
        if (profile.length < 3) return profile;
        
        // 1. Normalizar perfil
        const maxVal = Math.max(...profile);
        const minVal = Math.min(...profile);
        const range = maxVal - minVal;
        
        if (range === 0) return profile; // Evitar división por cero
        
        const normalized = profile.map(val => (val - minVal) / range);
        
        // 2. Aplicar realce exponencial para destacar diferencias
        const enhanced = normalized.map(val => Math.pow(val, 0.7));
        
        // 3. Suavizar ligeramente
        return this.smoothProfile(enhanced);
    }

    /**
     * Suaviza perfil de bitting
     */
    smoothProfile(profile) {
        if (profile.length < 3) return profile;
        
        const smoothed = [...profile];
        const kernel = [0.25, 0.5, 0.25]; // Kernel de suavizado
        
        for (let i = 1; i < profile.length - 1; i++) {
            let smoothedValue = 0;
            for (let j = 0; j < kernel.length; j++) {
                smoothedValue += profile[i - 1 + j] * kernel[j];
            }
            smoothed[i] = smoothedValue;
        }
        
        return smoothed;
    }

    /**
     * Combina mapas de bordes horizontal y vertical
     */
    combineEdgeMaps(sobelXData, sobelYData, width, height) {
        const combined = new Uint8Array(sobelXData.length);
        
        for (let i = 0; i < sobelXData.length; i++) {
            const gx = sobelXData[i];
            const gy = sobelYData[i];
            // Magnitud del gradiente
            const magnitude = Math.sqrt(gx * gx + gy * gy);
            combined[i] = Math.min(255, Math.round(magnitude));
        }
        
        return combined;
    }

    /**
     * Crea histograma de bordes mejorado
     */
    createEnhancedEdgeHistogram(data) {
        const histogram = new Array(this.config.featureExtraction.edge.histogramBins).fill(0);
        const binSize = 256 / this.config.featureExtraction.edge.histogramBins;
        
        // Contar píxeles con bordes significativos
        let significantEdges = 0;
        
        for (let i = 0; i < data.length; i++) {
            if (data[i] > 30) { // Solo contar bordes significativos
                const bin = Math.floor(data[i] / binSize);
                if (bin < histogram.length) {
                    histogram[bin]++;
                    significantEdges++;
                }
            }
        }
        
        // Normalizar por número de píxeles significativos
        if (significantEdges > 0) {
            return histogram.map(val => val / significantEdges);
        }
        
        return histogram.map(() => 0);
    }

    /**
     * Calcula fuerza de bordes mejorada
     */
    calculateEnhancedEdgeStrength(data) {
        let totalStrength = 0;
        let significantPixels = 0;
        
        for (let i = 0; i < data.length; i++) {
            if (data[i] > 30) { // Solo considerar bordes significativos
                totalStrength += data[i];
                significantPixels++;
            }
        }
        
        return significantPixels > 0 ? totalStrength / significantPixels / 255 : 0;
    }

    /**
     * Calcula fuerza de bordes
     */
    calculateEdgeStrength(histogram) {
        let strength = 0;
        for (let i = 0; i < histogram.length; i++) {
            strength += i * histogram[i];
        }
        return strength / histogram.length;
    }

    /**
     * Calcula dirección de bordes
     */
    calculateEdgeDirection(data, width, height) {
        // Implementación simplificada
        return 0; // Por simplicidad, retornar 0
    }

    /**
     * Calcula área del contorno
     */
    calculateContourArea(contour) {
        if (contour.length < 3) return 0;
        
        let area = 0;
        for (let i = 0; i < contour.length; i++) {
            const j = (i + 1) % contour.length;
            area += contour[i].x * contour[j].y;
            area -= contour[j].x * contour[i].y;
        }
        return Math.abs(area) / 2;
    }

    /**
     * Calcula perímetro del contorno
     */
    calculateContourPerimeter(contour) {
        if (contour.length < 2) return 0;
        
        let perimeter = 0;
        for (let i = 0; i < contour.length; i++) {
            const j = (i + 1) % contour.length;
            const dx = contour[j].x - contour[i].x;
            const dy = contour[j].y - contour[i].y;
            perimeter += Math.sqrt(dx * dx + dy * dy);
        }
        return perimeter;
    }

    /**
     * Evalúa calidad de bitting
     */
    assessBittingQuality(profile, notches, variance) {
        if (profile.length === 0) return 0;
        
        // Factor de completitud
        const completeness = Math.min(1, profile.length / 100);
        
        // Factor de definición (basado en varianza)
        const definition = Math.min(1, variance * 10);
        
        // Factor de estructura (basado en notches)
        const structure = Math.min(1, notches / 10);
        
        return (completeness + definition + structure) / 3;
    }
}

export default ImageProcessorV4;
