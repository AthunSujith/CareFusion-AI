import { API_BASE_URL, ENDPOINTS } from '../config';

interface ApiResponse<T = any> {
    status: string;
    data: T;
    message?: string;
}

export const api = {
    health: async (): Promise<boolean> => {
        try {
            const response = await fetch(`${API_BASE_URL}${ENDPOINTS.HEALTH}`);
            return response.ok;
        } catch (error) {
            console.error('Health check failed:', error);
            return false;
        }
    },

    uploadFile: async (
        patientId: string,
        folderType: string,
        file: File
    ): Promise<ApiResponse> => {
        const formData = new FormData();
        formData.append('patientId', patientId);
        formData.append('folderType', folderType);
        formData.append('file', file);

        const response = await fetch(`${API_BASE_URL}${ENDPOINTS.UPLOAD}`, {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Upload failed: ${response.status} ${errorText}`);
        }

        return response.json();
    },

    runAI: async (
        module: 'symptom' | 'image' | 'dna' | 'temporal' | 'chat',
        inputData: string,
        isText: boolean = false,
        history?: string,
        patientId?: string
    ): Promise<ApiResponse> => {
        const response = await fetch(`${API_BASE_URL}${ENDPOINTS.AI}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                module,
                input_data: inputData,
                is_text: isText,
                history,
                patientId,
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`AI processing failed: ${response.status} ${errorText}`);
        }

        return response.json();
    }
};
