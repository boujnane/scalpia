/**
 * Script pour normaliser les images Artset
 * - Supprime les marges blanches/transparentes (trim)
 * - Optionnel: redimensionne à une taille cible
 *
 * Usage: npx ts-node scripts/process-artset-images.ts
 */

import sharp from "sharp";
import * as fs from "fs";
import * as path from "path";

const ARTSET_DIR = path.join(process.cwd(), "public/Artset");
const OUTPUT_DIR = path.join(process.cwd(), "public/Artset-processed");

// Taille cible (optionnel) - mettre null pour garder la taille après trim
const TARGET_SIZE = null; // ou { width: 600, height: 600 }

async function processImage(inputPath: string, outputPath: string) {
  const filename = path.basename(inputPath);

  try {
    // Charger l'image
    let image = sharp(inputPath);
    const metadata = await image.metadata();

    console.log(`\n📷 ${filename}`);
    console.log(`   Original: ${metadata.width}x${metadata.height}`);

    // Trim les marges (supprime les bordures uniformes)
    image = image.trim({
      background: { r: 255, g: 255, b: 255, alpha: 0 }, // blanc ou transparent
      threshold: 10, // tolérance de couleur
    });

    // Obtenir les nouvelles dimensions après trim
    const trimmedBuffer = await image.toBuffer();
    const trimmedMeta = await sharp(trimmedBuffer).metadata();

    console.log(`   Trimmed:  ${trimmedMeta.width}x${trimmedMeta.height}`);

    // Redimensionner si TARGET_SIZE est défini
    if (TARGET_SIZE) {
      image = sharp(trimmedBuffer).resize(TARGET_SIZE.width, TARGET_SIZE.height, {
        fit: "contain",
        background: { r: 255, g: 255, b: 255, alpha: 0 },
      });
      console.log(`   Resized:  ${TARGET_SIZE.width}x${TARGET_SIZE.height}`);
    } else {
      image = sharp(trimmedBuffer);
    }

    // Sauvegarder en PNG optimisé
    await image
      .png({ quality: 90, compressionLevel: 9 })
      .toFile(outputPath);

    const outputStats = fs.statSync(outputPath);
    const inputStats = fs.statSync(inputPath);
    const savings = ((1 - outputStats.size / inputStats.size) * 100).toFixed(1);

    console.log(`   Size: ${(inputStats.size / 1024).toFixed(0)}KB → ${(outputStats.size / 1024).toFixed(0)}KB (${savings}% saved)`);

  } catch (error) {
    console.error(`   ❌ Erreur: ${error}`);
  }
}

async function main() {
  // Créer le dossier output s'il n'existe pas
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  // Lister les images PNG
  const files = fs.readdirSync(ARTSET_DIR).filter(f => f.toLowerCase().endsWith(".png"));

  console.log(`🖼️  Traitement de ${files.length} images dans ${ARTSET_DIR}`);
  console.log(`📁 Output: ${OUTPUT_DIR}`);

  for (const file of files) {
    const inputPath = path.join(ARTSET_DIR, file);
    const outputPath = path.join(OUTPUT_DIR, file);
    await processImage(inputPath, outputPath);
  }

  console.log("\n✅ Terminé!");
  console.log(`\n💡 Pour remplacer les originaux:\n   rm -rf public/Artset && mv public/Artset-processed public/Artset`);
}

main().catch(console.error);
