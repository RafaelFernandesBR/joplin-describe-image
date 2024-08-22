import joplin from 'api';
import { ToolbarButtonLocation } from 'api/types';
import axios from 'axios';
import * as fs from 'fs';

const uploadUrl = "https://visionbot.ru/apiv2/in.php";
const resultUrl = "https://visionbot.ru/apiv2/res.php";


joplin.plugins.register({
    onStart: async function () {
        // Registra o comando que será associado ao botão
        await joplin.commands.register({
            name: 'describe-image',
            label: 'Descrever imagens',
            execute: async () => {
                await processImagesInSelectedNote();
            }
        });

        // Cria o botão na barra de ferramentas
        await joplin.views.toolbarButtons.create('describe-image', 'describe-image', ToolbarButtonLocation.NoteToolbar);
    }
});

// Função para processar as imagens na nota selecionada
async function processImagesInSelectedNote() {
    const note = await joplin.workspace.selectedNote();

    if (note) {
        let content = note.body;
        const imageRegex = /!\[.*?\]\(:\/([a-zA-Z0-9-]+)\)/g;
        let matches;
        let updated = false;

        while ((matches = imageRegex.exec(content)) !== null) {
            const resourceId = matches[1];

            // Obtém o caminho do arquivo de imagem local
            const imagePath = await getResourcePath(resourceId);

            if (imagePath) {
                // Converte a imagem para Base64
                const base64Image = convertImageToBase64(imagePath);

                // Processa a imagem e obtém o texto reconhecido
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

// Função para obter o caminho do recurso de imagem
async function getResourcePath(resourceId: string): Promise<string | null> {
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

// Função para converter a imagem em Base64
function convertImageToBase64(imagePath: string): string {
    const imageBuffer = fs.readFileSync(imagePath);
    return imageBuffer.toString('base64');
}

// Função para processar a imagem através da API
async function processImage(base64Image: string): Promise<string | null> {
    try {
        const requestId = await uploadImage(base64Image, 'pt', true);
        if (requestId) {
            const result = await getRecognitionResult(requestId);
            return result.text;
        }
    } catch (error) {
        console.error("Erro ao processar imagem: " + error.message);
    }
    return null;
}

// Função para fazer upload da imagem em Base64
async function uploadImage(base64Image: string, language: string, beMyAI: boolean): Promise<string> {
    let bm = beMyAI ? '1' : '0';
    const response = await axios.post(uploadUrl, new URLSearchParams({
        body: base64Image,
        lang: language,
        target: 'nothing',
        bm: bm
    }), {
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8'
        }
    });

    const responseJson = response.data;
    if (responseJson.status === 'ok') {
        return responseJson.id;
    } else {
        throw new Error("Erro ao fazer upload da imagem: " + responseJson.status);
    }
}

// Função para obter o resultado do reconhecimento de imagem com loop de verificação
async function getRecognitionResult(requestId: string): Promise<any> {
    while (true) {
        const response = await axios.post(resultUrl, new URLSearchParams({ id: requestId }));
        const result = response.data;

        if (result.status === 'ok') {
            return result;
        } else if (result.status === 'notready') {
            await new Promise(resolve => setTimeout(resolve, 5000)); // Espera 5 segundos
        } else {
            throw new Error("Erro ao obter o resultado: " + result.status);
        }
    }
}

// Função para remover ou escapar caracteres Markdown
function sanitizeMarkdown(text: string): string {
    // Remove ou substitui caracteres Markdown comuns
    const markdownPatterns = [
        /[*_~`]/g,                  // Remove caracteres de formatação
        /\[([^\]]+)\]\([^\)]+\)/g,  // Remove links [text](url)
        /!\[.*?\]\(.*?\)/g,         // Remove imagens ![alt](url)
        /\n\s*[-*+]\s+/g,           // Remove listas com marcadores
        /\n\s*\d+\.\s+/g,           // Remove listas numeradas
        /(\r\n|\r|\n)/g,            // Remove quebras de linha
    ];

    return markdownPatterns.reduce((acc, pattern) => acc.replace(pattern, ' '), text)
        .trim() // Remove espaços em branco extras no início e no final
        .replace(/\s+/g, ' '); // Substitui múltiplos espaços por um único espaço
}
