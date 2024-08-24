import joplin from 'api';

export async function getResourcePath(resourceId: string): Promise<string | null> {
    try {
        const resource = await joplin.data.get(['resources', resourceId], { fields: ['file_extension'] });
        const filePath = `${resourceId}.${resource.file_extension}`;
        const localPath = await joplin.data.resourcePath(resourceId);
        return localPath || filePath;
    } catch (error) {
        console.error("Erro ao obter o caminho do recurso: " + error.message);
        return null;
    }
}
