const StrapiClient = require('./strapi-client.js');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

const strapi = new StrapiClient();

async function downloadImage(url, filepath) {
    const response = await axios({
        url,
        method: 'GET',
        responseType: 'stream'
    });
    return new Promise((resolve, reject) => {
        response.data.pipe(fs.createWriteStream(filepath))
            .on('error', reject)
            .on('close', resolve);
    });
}

async function testCreateArticleWithImages() {
    try {
        const articles = JSON.parse(fs.readFileSync('/Users/peterpc/Documents/Documents/yanghua cable web/yanghua-b2b-website/strapi-cms/data/transformed_articles.json', 'utf8'));
        const articleToCreate = articles[0];

        if (articleToCreate.cover) {
            const imageUrl = articleToCreate.cover.url;
            const imageName = path.basename(imageUrl);
            const imagePath = path.join(__dirname, 'temp', imageName);
            await downloadImage(imageUrl, imagePath);
            const coverImageId = await strapi.upload(imagePath, imageName);
            articleToCreate.cover = coverImageId;
        }

        for (const block of articleToCreate.blocks) {
            if (block.__component === 'shared.media' && block.image.url) {
                const imageUrl = block.image.url;
                const imageName = path.basename(imageUrl);
                const imagePath = path.join(__dirname, 'temp', imageName);
                await downloadImage(imageUrl, imagePath);
                const imageId = await strapi.upload(imagePath, imageName);
                block.image = imageId;
            }
        }

        const createdArticle = await strapi.create('articles', articleToCreate);
        console.log('Article created successfully:', createdArticle.data.data.documentId);

        const newArticleId = createdArticle.data.data.documentId;
        const populatedArticle = await strapi.get('articles', newArticleId, {
            populate: 'deep'
        });

        console.log('Populated Article:', JSON.stringify(populatedArticle.data.data, null, 2));

    } catch (error) {
        console.error('Error during article creation test:', error);
    }
}

testCreateArticleWithImages();