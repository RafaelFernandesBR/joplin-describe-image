import joplin from 'api';
import { ToolbarButtonLocation } from 'api/types';
import { processImagesInSelectedNote } from '../services/imageProcessingService';

export async function describeImageCommand() {
    await joplin.commands.register({
        name: 'describe-image',
        label: 'Descrever imagens',
        execute: async () => {
            await processImagesInSelectedNote();
        }
    });

    await joplin.views.toolbarButtons.create('describe-image', 'describe-image', ToolbarButtonLocation.NoteToolbar);
}
