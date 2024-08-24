export function sanitizeMarkdown(text: string): string {
    const markdownPatterns = [
        /[*_~`]/g,                  // Remove caracteres de formatação
        /\[([^\]]+)\]\([^\)]+\)/g,  // Remove links [text](url)
        /!\[.*?\]\(.*?\)/g,         // Remove imagens ![alt](url)
        /\n\s*[-*+]\s+/g,           // Remove listas com marcadores
        /\n\s*\d+\.\s+/g,           // Remove listas numeradas
        /(\r\n|\r|\n)/g,            // Remove quebras de linha
    ];

    return markdownPatterns.reduce((acc, pattern) => acc.replace(pattern, ' '), text)
        .trim()
        .replace(/\s+/g, ' ');
}
