/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Construye un FormData de manera genérica a partir de un objeto
 * @param params - Objeto con los datos a convertir
 * @param fileFields - Array con los nombres de campos que son archivos
 * @returns FormData construido
 */
export const buildFormData = (params: Record<string, any>, fileFields: string[] = []): FormData => {
  const formData = new FormData();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== null && value !== undefined) {
      // Si es un archivo (File o Blob)
      if (fileFields.includes(key) || value instanceof File || value instanceof Blob) {
        formData.append(key, value);
      }
      // Si es un objeto (pero no File, Date, etc.)
      else if (typeof value === 'object' && !(value instanceof Date) && !(value instanceof File)) {
        formData.append(key, JSON.stringify(value));
      }
      // Si es un valor primitivo
      else {
        formData.append(key, value.toString());
      }
    }
  });

  return formData;
};

/**
 * Parsea campos JSON en un objeto de manera genérica
 * @param body - Objeto con los datos recibidos
 * @param fileFields - Array con los nombres de campos que son archivos (no se parsean)
 * @returns Objeto con campos JSON parseados
 */
export const parseJsonFields = (body: any, fileFields: string[] = []): any => {
  const parsedBody = { ...body };

  Object.keys(parsedBody).forEach(key => {
    const value = parsedBody[key];

    // Si no es un campo de archivo y es un string, intentar parsearlo como JSON
    if (!fileFields.includes(key) && typeof value === 'string') {
      try {
        // Verificar si el string parece ser JSON (empieza con { o [)
        if (
          (value.startsWith('{') && value.endsWith('}')) ||
          (value.startsWith('[') && value.endsWith(']'))
        ) {
          parsedBody[key] = JSON.parse(value);
        }
      } catch (error) {
        // Si no se puede parsear, mantener el valor original
        // Esto permite que strings normales no se vean afectados
        console.warn(`No se pudo parsear el campo ${key} como JSON:`, error);
      }
    }
  });

  return parsedBody;
};

/**
 * Determina si un payload contiene archivos
 * @param params - Objeto con los datos
 * @param fileFields - Array con los nombres de campos que son archivos
 * @returns boolean indicando si hay archivos
 */
export const hasFiles = (params: Record<string, any>, fileFields: string[] = []): boolean => {
  return Object.entries(params).some(([key, value]) => {
    return fileFields.includes(key) || value instanceof File || value instanceof Blob;
  });
};
