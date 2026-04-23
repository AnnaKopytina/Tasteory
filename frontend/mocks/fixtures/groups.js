import {PROFILE_USER_ID} from '../constants.js';

export const groups = [
    {
        id: 'family',
        name: 'Семья',
        memberIds: [PROFILE_USER_ID, 'user-svetlana', 'user-petr', 'user-natalia'],
        recipeIds: ['profile-pasta-galina', 'profile-salad-galina', 'family-zucchini-svetlana', 'family-cutlets-petr', 'family-pie-natalia']
    }
];
