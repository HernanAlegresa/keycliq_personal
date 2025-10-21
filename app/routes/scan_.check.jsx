import { json, redirect } from "@remix-run/node";
import { useEffect } from "react";
import { useSubmit } from "@remix-run/react";
import { requireUserId, getSession, commitSession } from "../utils/session.server.js";
import { getUserKeys } from "../lib/keys.server.js";
import { processKeyImageV3, extractFeaturesV3 } from "../lib/keyscan.server.js";

export const handle = { 
  hideFooter: true, 
  title: 'KeyCliq', 
  showBackButton: false  // No back button during processing
};

/**
 * Action server para procesar la imagen con KeyScan V5
 */
export async function action({ request }) {
  const userId = await requireUserId(request);
  const formData = await request.formData();
  const imageDataURL = formData.get('imageDataURL');
  
  // Logging inicio
  const startTotal = Date.now();
  console.log('\n🔬 ===== KEYSCAN V5 - PROCESSING START =====');
  console.log(`­ƒôà Timestamp: ${new Date().toISOString()}`);
  console.log(`­ƒæñ User ID: ${userId}`);
  
  try {
    // 1. Validar que tenemos la imagen
    if (!imageDataURL || !imageDataURL.startsWith('data:')) {
      console.error('ÔØî Error: No image data received');
      return json({ error: 'NO_IMAGE_DATA' }, { status: 400 });
    }
    
    // 2. Obtener inventario del usuario (solo llaves con signature ready)
    const startInventory = Date.now();
    const userKeys = await getUserKeys(userId);
    const inventory = userKeys
      .filter(key => key.sigStatus === 'ready' && key.signature)
      .map(key => ({
        key: {
          id: key.id,
          type: 'Regular', // TODO: Si agregamos tipos de llave, usar key.type
        },
        features: key.signature
      }));
    
    const inventoryTime = Date.now() - startInventory;
    console.log(`­ƒôª Inventory loaded: ${inventory.length} keys with signatures ready`);
    console.log(`ÔÜÖ´©Å  Inventory load time: ${inventoryTime}ms`);
    
    // 3. Procesar imagen con KeyScan V5
    const startExtractMatch = Date.now();
    
    // Caso especial: inventario vac├¡o
    if (inventory.length === 0) {
      console.log('­ƒô¡ Empty inventory - redirecting to /scan/new');
      
      const session = await getSession(request.headers.get('Cookie'));
      session.flash('scanMessage', 'This is your first key! Let\'s add it to your inventory.');
      // NO pasamos extractedSignature - se extraer├í en createKey
      
      const totalTime = Date.now() - startTotal;
      console.log(`ÔÜÖ´©Å  Total time: ${totalTime}ms`);
      console.log('✅ ===== KEYSCAN V5 - EMPTY INVENTORY =====\n');
      
      return redirect('/scan/new', {
        headers: {
          'Set-Cookie': await commitSession(session)
        }
      });
    }
    
    const result = await processKeyImageV3(imageDataURL, inventory);
    const extractMatchTime = Date.now() - startExtractMatch;
    
    console.log(`ÔÜÖ´©Å  Extract + Match time: ${extractMatchTime}ms`);
    console.log(`ÔÜÖ´©Å  Processing time (reported): ${result.processingTime}ms`);
    
    // 6. Procesar resultado
    if (!result.success) {
      console.error(`ÔØî Processing failed: ${result.error}`);
      console.error(`   Message: ${result.message}`);
      
      const session = await getSession(request.headers.get('Cookie'));
      session.flash('scanError', result.message);
      
      return redirect('/scan/error', {
        headers: {
          'Set-Cookie': await commitSession(session)
        }
      });
    }
    
    const totalTime = Date.now() - startTotal;
    
    // 7. Logging detallado seg├║n resultado
    console.log(`\n­ƒôè RESULT:`);
    console.log(`   Decision: ${result.decision}`);
    console.log(`   Confidence: ${result.confidence.toFixed(2)}%`);
    console.log(`   Match: ${result.match}`);
    
    if (result.details) {
      console.log(`\n­ƒôê DETAILS:`);
      console.log(`   Bitting Similarity: ${(result.details.bittingSimilarity * 100).toFixed(2)}%`);
      console.log(`   Edge Similarity: ${(result.details.edgeSimilarity * 100).toFixed(2)}%`);
      console.log(`   Margin: ${(result.details.margin * 100).toFixed(2)}%`);
      
      if (result.details.shapeVeto) {
        console.log(`   Shape Veto: ${result.details.shapeVeto.passed ? 'PASSED Ô£ô' : 'FAILED Ô£ù'}`);
        console.log(`     - Hu Moment: ${result.details.shapeVeto.huMomentDistance?.toFixed(4)} (threshold: ${result.details.shapeVeto.huMomentThreshold})`);
        console.log(`     - Hausdorff: ${result.details.shapeVeto.hausdorffDistance?.toFixed(2)} (threshold: ${result.details.shapeVeto.hausdorffThreshold})`);
      }
      
      if (result.details.keyId) {
        console.log(`   Matched Key ID: ${result.details.keyId}`);
      }
    }
    
    console.log(`\nÔÅ▒´©Å  TIMINGS:`);
    console.log(`   Inventory: ${inventoryTime}ms`);
    console.log(`   Extract+Match: ${extractMatchTime}ms`);
    console.log(`   Total: ${totalTime}ms`);
    console.log(`   Target P95: < 350ms`);
    
    // 8. Redirigir seg├║n decisi├│n
    const session = await getSession(request.headers.get('Cookie'));
    
    if (result.decision === 'MATCH') {
      console.log(`\n✅ ===== KEYSCAN V5 - MATCH FOUND =====\n`);
      return redirect(
        `/scan/match_yes?keyId=${result.details.keyId}&confidence=${result.confidence.toFixed(4)}`,
        {
          headers: {
            'Set-Cookie': await commitSession(session)
          }
        }
      );
    } else if (result.decision === 'POSSIBLE') {
      console.log(`\n⚠️  ===== KEYSCAN V5 - POSSIBLE MATCH =====\n`);
      return redirect(
        `/scan/possible?keyId=${result.details.keyId}&confidence=${result.confidence.toFixed(4)}`,
        {
          headers: {
            'Set-Cookie': await commitSession(session)
          }
        }
      );
    } else {
      // NO_MATCH - redirigir a nueva llave (signature se extraer├í en createKey)
      console.log(`\n❌ ===== KEYSCAN V5 - NO MATCH =====\n`);
      
      return redirect('/scan/new', {
        headers: {
          'Set-Cookie': await commitSession(session)
        }
      });
    }
    
  } catch (error) {
    const totalTime = Date.now() - startTotal;
    console.error(`\n❌ ===== KEYSCAN V5 - ERROR =====`);
    console.error(`Error: ${error.message}`);
    console.error(`Stack: ${error.stack}`);
    console.error(`Total time: ${totalTime}ms\n`);
    
    const session = await getSession(request.headers.get('Cookie'));
    session.flash('scanError', 'An error occurred while processing your key. Please try again.');
    
    return redirect('/scan/error', {
      headers: {
        'Set-Cookie': await commitSession(session)
      }
    });
  }
}

export async function loader({ request }) {
  await requireUserId(request);
  return json({});
}

export default function ScanProcessing() {
  const submit = useSubmit();

  useEffect(() => {
    // Auto-submit form on mount with image data from sessionStorage
    const imageDataURL = sessionStorage.getItem('tempKeyImageDataURL');
    
    if (imageDataURL) {
      const formData = new FormData();
      formData.append('imageDataURL', imageDataURL);
      
      // Submit the form to trigger the action
      submit(formData, { method: 'post' });
    }
  }, [submit]);

  return (
    <div className="scan-processing">
      {/* Main content */}
      <div className="scan-processing__content">
        {/* Title */}
        <h1 className="scan-processing__title">Processing your key</h1>
        
        {/* Loading Spinner */}
        <div className="scan-processing__spinner">
          <div className="scan-processing__spinner-circle">
            <div className="scan-processing__spinner-progress"></div>
          </div>
        </div>
        
        {/* Processing Steps */}
        <div className="scan-processing__steps">
          <p className="scan-processing__step">Extracting contours and properties...</p>
          <p className="scan-processing__step">Checking against your inventory...</p>
          <p className="scan-processing__step">This may take a few seconds.</p>
        </div>
      </div>
    </div>
  );
}
