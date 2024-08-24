import axios from 'axios';

const uploadUrl = "https://visionbot.ru/apiv2/in.php";
const resultUrl = "https://visionbot.ru/apiv2/res.php";

export async function processImage(base64Image: string): Promise<string | null> {
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

async function getRecognitionResult(requestId: string): Promise<any> {
    const maxRetries = 90 / 5;

    for (let i = 0; i < maxRetries; i++) {
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

    throw new Error("Tempo limite excedido");
}
