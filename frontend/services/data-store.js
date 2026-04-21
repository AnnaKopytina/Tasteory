import {createMockStore} from './mockData.js';

function ensureMockStore() {
    if (typeof window === 'undefined') {
        return {};
    }

    if (!window.TasteoryMockStore) {
        window.TasteoryMockStore = createMockStore();
    }

    return window.TasteoryMockStore;
}

const getMockStore = () => ensureMockStore();

function getMainFeedRecipes() {
    return getMockStore().getMainFeedRecipes?.() || [];
}

function getFavoriteRecipes() {
    return getMockStore().getFavoriteRecipes?.() || [];
}

function getProfileUser() {
    return getMockStore().getProfileUser?.() || null;
}

function getProfileUserId() {
    return getMockStore().profileUserId || 'user-galina';
}

function getProfileRecipes() {
    return getMockStore().getProfileRecipes?.() || [];
}

function getProfileGroups() {
    return getMockStore().getMyGroups?.() || [];
}

function getRecipeDetails(recipeId) {
    return getMockStore().getRecipeDetails?.(recipeId) || null;
}

function getMyGroups() {
    return getProfileGroups();
}

function getProfileStats() {
    return getMockStore().getProfileStats?.() || { recipesCount: 0, groupsCount: 0, favoritesCount: 0 };
}

function getGroupById(groupId) {
    return getMockStore().getGroupById?.(groupId) || null;
}

function getGroupMembers(groupOrId) {
    return getMockStore().getGroupMembers?.(groupOrId) || [];
}

function getGroupRecipes(groupOrId) {
    return getMockStore().getGroupRecipes?.(groupOrId) || [];
}

function createGroup(name, memberIds = []) {
    return getMockStore().createGroup?.(name, memberIds) || null;
}

function removeGroupById(groupId) {
    return getMockStore().removeGroupById?.(groupId) || false;
}

function setRecipeFavorite(recipeId, isFavorite) {
    return getMockStore().setRecipeFavorite?.(recipeId, isFavorite) || null;
}

function updateUserName(userId, nextName) {
    return getMockStore().updateUserName?.(userId, nextName) || null;
}

function updateUserAvatar(userId, avatarSrc) {
    return getMockStore().updateUserAvatar?.(userId, avatarSrc) || null;
}

export const DataStore = {
    getMainFeedRecipes,
    getFavoriteRecipes,
    getProfileUser,
    getProfileUserId,
    getProfileRecipes,
    getProfileGroups,
    getRecipeDetails,
    getMyGroups,
    getProfileStats,
    getGroupById,
    getGroupMembers,
    getGroupRecipes,
    createGroup,
    removeGroupById,
    setRecipeFavorite,
    updateUserName,
    updateUserAvatar
};

if (typeof window !== 'undefined') {
    ensureMockStore();
    window.TasteoryDataStore = DataStore;
}


