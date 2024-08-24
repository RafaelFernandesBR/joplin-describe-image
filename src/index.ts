import joplin from 'api';
import { ToolbarButtonLocation } from 'api/types';
import { describeImageCommand } from './commands/describeImage';

joplin.plugins.register({
    onStart: async function () {
        await describeImageCommand();
    }
});
