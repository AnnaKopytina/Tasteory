function createHandlers(store) {
    return [{method: 'GET', path: '/users/me', resolver: () => store.getProfileUser()}, {
        method: 'GET',
        path: '/users/me/stats',
        resolver: () => store.getProfileStats()
    }, {method: 'GET', path: '/users/me/recipes', resolver: () => store.getProfileRecipes()}, {
        method: 'GET',
        path: '/users/me/favorites',
        resolver: () => store.getFavoriteRecipes()
    }, {method: 'GET', path: '/users/me/groups', resolver: () => store.getMyGroups()}, {
        method: 'GET',
        path: '/recipes/main',
        resolver: () => store.getMainFeedRecipes()
    }, {method: 'GET', path: '/recipes/:id', resolver: ({params}) => store.getRecipeDetails(params.id)}, {
        method: 'GET',
        path: '/groups/:id',
        resolver: ({params}) => store.getGroupById(params.id)
    }, {
        method: 'GET',
        path: '/groups/:id/members',
        resolver: ({params}) => store.getGroupMembers(params.id)
    }, {method: 'GET', path: '/groups/:id/recipes', resolver: ({params}) => store.getGroupRecipes(params.id)}, {
        method: 'POST', path: '/groups', resolver: ({body}) => store.createGroup(body?.name, body?.memberIds || [])
    }, {
        method: 'PATCH',
        path: '/recipes/:id/favorite',
        resolver: ({params, body}) => store.setRecipeFavorite(params.id, Boolean(body?.isFavorite))
    }];
}

export {createHandlers};
