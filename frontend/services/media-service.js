import { ApiService } from "./api.js";

export class MediaService {
    static async upload(file) {
        const formData = new FormData();
        formData.append('file', file);

        return ApiService.post('/api/media/upload', formData);
    }
}