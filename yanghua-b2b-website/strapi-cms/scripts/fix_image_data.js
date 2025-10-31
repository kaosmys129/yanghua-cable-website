const fs = require('fs');
const path = require('path');

const sourceDataPath = path.resolve(__dirname, '../data/strapi_articles_data.json');
const targetDataPath = path.resolve(__dirname, '../data/transformed_articles.json');

try {
    console.log('🔄 Reading source and target data files...');
    // Reading large files can be memory intensive, but for a one-off script, this is acceptable.
    const sourceData = JSON.parse(fs.readFileSync(sourceDataPath, 'utf-8'));
    const targetData = JSON.parse(fs.readFileSync(targetDataPath, 'utf-8'));

    // Assuming we are always working with the first article
    const sourceArticle = sourceData.data[0];
    const targetArticle = targetData[0];

    console.log(`📄 Source article: "${sourceArticle.title}"`);
    console.log(`📄 Target article: "${targetArticle.title}"`);

    // Helper function to copy only the necessary image data, excluding system-generated fields.
    const copyImageData = (sourceFile) => {
        if (!sourceFile || !sourceFile.url) {
            return null;
        }
        
        // Destructure to exclude Strapi-generated fields
        const {
            id,
            documentId,
            provider,
            provider_metadata,
            createdAt,
            updatedAt,
            publishedAt,
            ...essentialData
        } = sourceFile;
        
        // Also remove formats that might contain full URLs and can be regenerated
        if (essentialData.formats) {
            delete essentialData.formats;
        }
        
        return essentialData;
    };

    // 1. Process the Cover Image
    console.log('🖼️  Processing cover image...');
    if (sourceArticle.cover) {
        targetArticle.cover = copyImageData(sourceArticle.cover);
        if (targetArticle.cover) {
            console.log('✅ Cover image data copied.');
        } else {
            console.log('⚠️ Source cover image found but has no URL, skipping.');
        }
    } else {
        targetArticle.cover = null;
        console.log('ℹ️ No source cover image found.');
    }

    // 2. Process Media Blocks
    console.log('🖼️  Processing media blocks...');
    let mediaBlockSourceIndex = 0;
    const sourceMediaBlocks = sourceArticle.blocks.filter(b => b.__component === 'shared.media');

    targetArticle.blocks.forEach((block, index) => {
        if (block.__component === 'shared.media') {
            // Find the corresponding media block in the source data
            if (mediaBlockSourceIndex < sourceMediaBlocks.length) {
                const sourceMediaBlock = sourceMediaBlocks[mediaBlockSourceIndex];
                if (sourceMediaBlock.file) {
                    block.file = copyImageData(sourceMediaBlock.file);
                    console.log(`✅ Copied data for media block #${mediaBlockSourceIndex + 1}.`);
                } else {
                    block.file = null;
                    console.log(`ℹ️ Source media block #${mediaBlockSourceIndex + 1} has no file data.`);
                }
                mediaBlockSourceIndex++;
            } else {
                 console.log(`⚠️ Warning: Target article has more media blocks than the source. Index: ${index}`);
            }
        }
    });

    console.log(`📊 Processed ${mediaBlockSourceIndex} media blocks in total.`);

    // 3. Write the updated data back to the target file
    fs.writeFileSync(targetDataPath, JSON.stringify(targetData, null, 2), 'utf-8');
    console.log('💾 Successfully updated "transformed_articles.json" with restored image data.');

} catch (error) {
    console.error('❌ An error occurred during the data fixing process:', error);
    process.exit(1);
}