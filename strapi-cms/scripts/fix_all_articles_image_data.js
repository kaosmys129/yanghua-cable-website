const fs = require('fs');
const path = require('path');

const sourceDataPath = path.resolve(__dirname, '../data/strapi_articles_data.json');
const targetDataPath = path.resolve(__dirname, '../data/transformed_articles.json');

try {
    console.log('🔄 Reading source and target data files...');
    const sourceData = JSON.parse(fs.readFileSync(sourceDataPath, 'utf-8'));
    const targetData = JSON.parse(fs.readFileSync(targetDataPath, 'utf-8'));

    // Create a map of source articles by title for efficient lookup
    const sourceArticlesMap = new Map(sourceData.data.map(article => [article.title, article]));
    console.log(`🗺️ Created a map of ${sourceArticlesMap.size} source articles.`);

    // Helper function to copy only the necessary image data
    const copyImageData = (sourceFile) => {
        if (!sourceFile || !sourceFile.url) {
            return null;
        }
        const { id, documentId, provider, provider_metadata, createdAt, updatedAt, publishedAt, ...essentialData } = sourceFile;
        if (essentialData.formats) {
            delete essentialData.formats;
        }
        return essentialData;
    };

    let articlesProcessed = 0;
    let articlesNotFound = 0;

    // Iterate over each article in the target data
    targetData.forEach((targetArticle, index) => {
        console.log(`
Processing article ${index + 1}/${targetData.length}: "${targetArticle.title}"`);
        const sourceArticle = sourceArticlesMap.get(targetArticle.title);

        if (sourceArticle) {
            articlesProcessed++;
            // 1. Process the Cover Image
            if (sourceArticle.cover) {
                targetArticle.cover = copyImageData(sourceArticle.cover);
                if (targetArticle.cover) {
                    console.log('  ✅ Cover image data copied.');
                } else {
                    console.log('  ⚠️ Source cover image found but has no URL, skipping.');
                }
            } else {
                targetArticle.cover = null;
                console.log('  ℹ️ No source cover image found.');
            }

            // 2. Process Media Blocks
            let mediaBlockSourceIndex = 0;
            const sourceMediaBlocks = sourceArticle.blocks.filter(b => b.__component === 'shared.media');

            if (targetArticle.blocks && Array.isArray(targetArticle.blocks)) {
                targetArticle.blocks.forEach((block) => {
                    if (block.__component === 'shared.media') {
                        if (mediaBlockSourceIndex < sourceMediaBlocks.length) {
                            const sourceMediaBlock = sourceMediaBlocks[mediaBlockSourceIndex];
                            if (sourceMediaBlock.file) {
                                block.file = copyImageData(sourceMediaBlock.file);
                                console.log(`  ✅ Copied data for media block #${mediaBlockSourceIndex + 1}.`);
                            } else {
                                block.file = null;
                                console.log(`  ℹ️ Source media block #${mediaBlockSourceIndex + 1} has no file data.`);
                            }
                            mediaBlockSourceIndex++;
                        } else {
                            console.log(`  ⚠️ Warning: Target article has more media blocks than the source.`);
                        }
                    }
                });
            }
            console.log(`  📊 Processed ${mediaBlockSourceIndex} media blocks for this article.`);
        } else {
            articlesNotFound++;
            console.log(`  ❌ Article not found in source data. Skipping.`);
        }
    });

    // 3. Write the updated data back to the target file
    fs.writeFileSync(targetDataPath, JSON.stringify(targetData, null, 2), 'utf-8');
    
    console.log('\n\n--- Processing Summary ---');
    console.log(`💾 Successfully updated "${path.basename(targetDataPath)}" with restored image data.`);
    console.log(`- Total articles in target file: ${targetData.length}`);
    console.log(`- Articles processed: ${articlesProcessed}`);
    console.log(`- Articles not found in source: ${articlesNotFound}`);
    console.log('--------------------------');

} catch (error) {
    console.error('❌ An error occurred during the data fixing process:', error);
    process.exit(1);
}