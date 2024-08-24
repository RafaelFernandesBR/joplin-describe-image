import joplin from 'api';
import { getResourcePath } from './resourceService';
import { processImage } from './uploadService';
import { sanitizeMarkdown } from '../utils/markdownUtils';
import * as fs from 'fs';

export async function processImagesInSelectedNote() {
    const note = await joplin.workspace.selectedNote();

    if (note) {
        let content = note.body;
        const imageRegex = /!\[.*?\]\(:\/([a-zA-Z0-9-]+)\)/g;
        let matches;
        let updated = false;

        while ((matches = imageRegex.exec(content)) !== null) {
            const resourceId = matches[1];
            const imagePath = await getResourcePath(resourceId);

            if (imagePath) {
                const base64Image = convertImageToBase64(imagePath);
                const recognitionText = await processImage(base64Image);

                if (recognitionText) {
                    const sanitizedText = sanitizeMarkdown(recognitionText);
                    const newImageTag = `![${sanitizedText}](:/${resourceId})`;
                    content = content.replace(matches[0], newImageTag);
                    updated = true;
                }
            }
        }

        if (updated) {
            await joplin.data.put(['notes', note.id], null, { body: content });
        }
    }
}

function convertImageToBase64(imagePath: string): string {
    const imageBuffer = fs.readFileSync(imagePath);
    return imageBuffer.toString('base64');
}
