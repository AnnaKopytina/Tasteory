import { ApiService } from "./api.js";

export class NoteService {
    static async getForStep(stepId, groupId = null) {
        let url = `/api/notes/step/${stepId}`;
        if (groupId) {
            url += `?groupId=${groupId}`;
        }
        return ApiService.get(url);
    }

    static async save(stepId, text, isPrivate, groupId = null) {
        return ApiService.put('/api/notes', {
            stepId,
            text,
            isPrivate,
            groupId: isPrivate ? null : groupId
        });
    }

    static async delete(stepId, isPrivate, groupId = null) {
        let url = `/api/notes/step/${stepId}?isPrivate=${isPrivate}`;
        if (groupId) {
            url += `&groupId=${groupId}`;
        }
        return ApiService.delete(url);
    }
}