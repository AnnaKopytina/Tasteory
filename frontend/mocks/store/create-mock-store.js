import {groups as initialGroups} from '../fixtures/groups.js';
import {recipes as initialRecipes} from '../fixtures/recipes.js';
import {users as initialUsers} from '../fixtures/users.js';
import {MAIN_FEED_RECIPE_IDS, PROFILE_USER_ID} from '../constants.js';

function deepClone(value) {
    if (typeof structuredClone === 'function') return structuredClone(value);
    return JSON.parse(JSON.stringify(value));
}

function createMockStore() {
    const state = {
        users: deepClone(initialUsers),
        recipes: deepClone(initialRecipes),
        groups: deepClone(initialGroups)
    };

    function findById(collection, id) {
        return collection.find((item) => String(item.id) === String(id)) || null;
    }

    function getProfileUser() {
        return findById(state.users, PROFILE_USER_ID);
    }

    function getUserById(userId) {
        return findById(state.users, userId);
    }

    function getRecipeById(recipeId) {
        return findById(state.recipes, recipeId);
    }

    function getRecipeDetails(recipeId) {
        const recipe = getRecipeById(recipeId) || state.recipes[0] || null;
        return recipe ? deepClone(recipe) : null;
    }

    function getProfileRecipes() {
        return state.recipes.filter((recipe) => recipe.ownerId === PROFILE_USER_ID);
    }

    function getFavoriteRecipes() {
        return state.recipes.filter((recipe) => recipe.isFavorite && recipe.favoriteOwnerId === PROFILE_USER_ID);
    }

    function getMainFeedRecipes() {
        return MAIN_FEED_RECIPE_IDS.map((recipeId) => getRecipeById(recipeId)).filter(Boolean);
    }

    function getGroupById(groupId) {
        if (!groupId) return state.groups[0] || null;
        return findById(state.groups, groupId) || state.groups[0] || null;
    }

    function getGroupRecipes(groupOrId) {
        const group = typeof groupOrId === 'object' && groupOrId ? groupOrId : getGroupById(groupOrId);
        if (!group) return [];
        return (group.recipeIds || []).map((recipeId) => getRecipeById(recipeId)).filter(Boolean);
    }

    function getGroupMembers(groupOrId) {
        const group = typeof groupOrId === 'object' && groupOrId ? groupOrId : getGroupById(groupOrId);
        if (!group) return [];
        const recipeCounts = new Map();
        getGroupRecipes(group).forEach((recipe) => {
            const ownerId = recipe.ownerId || 'unknown';
            recipeCounts.set(ownerId, (recipeCounts.get(ownerId) || 0) + 1);
        });

        return Array.from(new Set(group.memberIds || [])).map((memberId) => {
            const user = getUserById(memberId);
            const isProfileOwner = String(memberId) === String(PROFILE_USER_ID);
            return {
                id: memberId,
                name: user?.name || `Пользователь ${memberId}`,
                username: user?.username || '',
                role: isProfileOwner ? 'Админ' : 'Участник',
                recipeCount: recipeCounts.get(memberId) || 0
            };
        });
    }

    function getMyGroups() {
        return state.groups.map((group) => ({id: group.id, name: group.name}));
    }

    function getProfileStats() {
        return {
            recipesCount: getProfileRecipes().length,
            groupsCount: state.groups.length,
            favoritesCount: getFavoriteRecipes().length
        };
    }

    function createGroup(name, memberIds = []) {
        const normalizedName = String(name || '').trim() || 'Новая группа';
        const normalizedMemberIds = Array.from(new Set([
            PROFILE_USER_ID,
            ...memberIds.map((memberId) => String(memberId).trim()).filter(Boolean)
        ]));
        const group = {id: `group-${Date.now()}`, name: normalizedName, memberIds: normalizedMemberIds, recipeIds: []};
        state.groups.unshift(group);
        return group;
    }

    function removeGroupById(groupId) {
        const index = state.groups.findIndex((group) => String(group.id) === String(groupId));
        if (index === -1) return false;
        state.groups.splice(index, 1);
        return true;
    }

    function setRecipeFavorite(recipeId, isFavorite) {
        const recipe = getRecipeById(recipeId);
        if (!recipe) return null;
        recipe.isFavorite = Boolean(isFavorite);
        recipe.favoriteOwnerId = recipe.isFavorite ? PROFILE_USER_ID : null;
        return recipe;
    }

    function updateUserName(userId, nextName) {
        const user = getUserById(userId);
        const normalizedName = String(nextName || '').trim();
        if (!user || !normalizedName) return null;
        user.name = normalizedName;
        state.recipes.forEach((recipe) => {
            if (String(recipe.ownerId) === String(userId)) recipe.author = normalizedName;
        });
        return user;
    }

    function updateUserAvatar(userId, avatarSrc) {
        const user = getUserById(userId);
        if (!user) return null;
        user.avatarSrc = avatarSrc || '';
        return user;
    }

    return {
        profileUserId: PROFILE_USER_ID,
        users: state.users,
        recipes: state.recipes,
        groups: state.groups,
        deepClone,
        getProfileUser,
        getUserById,
        getRecipeById,
        getRecipeDetails,
        getProfileRecipes,
        getFavoriteRecipes,
        getMainFeedRecipes,
        getGroupById,
        getGroupMembers,
        getGroupRecipes,
        getMyGroups,
        getProfileStats,
        createGroup,
        removeGroupById,
        setRecipeFavorite,
        updateUserName,
        updateUserAvatar
    };
}

export {createMockStore, deepClone};
