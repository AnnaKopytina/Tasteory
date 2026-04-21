import {PROFILE_USER_ID} from '../constants.js';

function createGenericIngredients(title) {
    return [
        {
            name: 'Ингредиенты', isOpen: true, items: [
                {name: title, count: 1, measure: 'порц.'},
                {name: 'Оливковое масло', count: 1, measure: 'ст. л.'},
                {name: 'Соль', count: 0.5, measure: 'ч. л.'}
            ]
        },
        {
            name: 'Подача', isOpen: false, items: [
                {name: 'Свежая зелень', count: 1, measure: 'пучок'},
                {name: 'Перец по вкусу', count: 0.25, measure: 'ч. л.'}
            ]
        }
    ];
}

function createGenericSteps(title, author) {
    return [
        {
            number: 1,
            text: `Подготовьте ингредиенты для блюда и разогрейте рабочее место для готовки.`,
            media: null,
            note: null
        },
        {
            number: 2,
            text: `Соберите основную часть блюда и аккуратно соедините все компоненты. Автор рецепта — ${author}.`,
            media: null,
            note: null
        },
        {
            number: 3,
            text: 'Перед подачей дайте блюду немного отдохнуть и при необходимости добавьте финальные специи.',
            media: null,
            note: null
        }
    ];
}

function createRecipe(config) {
    const image = config.image;
    const baseServings = config.baseServings ?? 2;
    return {
        id: config.id,
        title: config.title,
        image,
        mainImage: config.mainImage ?? image,
        author: config.author,
        type: config.type ?? 'lunch',
        time: config.time ?? 20,
        servings: config.servings ?? 4,
        savingsCount: config.savingsCount,
        ownerId: config.ownerId ?? null,
        groupId: config.groupId ?? null,
        favoriteOwnerId: config.favoriteOwnerId ?? null,
        isFavorite: Boolean(config.isFavorite),
        peopleCount: config.peopleCount ?? 4,
        baseServings,
        currentServings: config.currentServings ?? baseServings,
        ingredientsGroups: config.ingredientsGroups ?? createGenericIngredients(config.title),
        steps: config.steps ?? createGenericSteps(config.title, config.author)
    };
}

export const recipes = [
    createRecipe({
        id: 'profile-pasta-galina',
        title: 'Паста с томатным соусом',
        author: 'Василькова Галина',
        image: 'https://img.povar.ru/main-micro/00/00/6c/83/spagetti_chetire_pomidora-825929.jpg',
        mainImage: 'https://images.unsplash.com/photo-1523153662651-7d2da4c3e0e5?q=80&w=2070&auto=format&fit=crop',
        type: 'dinner',
        time: 25,
        servings: 4,
        ownerId: 'user-galina',
        groupId: 'family',
        peopleCount: 4
    }),
    createRecipe({
        id: 'profile-salad-galina', title: 'Полезный салат со свежими овощами', author: 'Василькова Галина',
        image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=900&auto=format&fit=crop',
        mainImage: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=2070&auto=format&fit=crop',
        type: 'lunch', time: 20, servings: 2, ownerId: 'user-galina', groupId: 'family', peopleCount: 2,
        baseServings: 2, currentServings: 2,
        ingredientsGroups: [
            {
                name: 'Соус', isOpen: true, items: [
                    {name: 'Оливковое масло', count: 3, measure: 'ст. л.'},
                    {name: 'Белый винный уксус', count: 1, measure: 'ст. л.'},
                    {name: 'Соль', count: 1, measure: 'ч. л.'},
                    {name: 'Орегано', count: 1, measure: 'ч. л.'},
                    {name: 'Черный молотый перец', count: 0.5, measure: 'ч. л.'}
                ]
            },
            {
                name: 'Салат', isOpen: true, items: [
                    {name: 'Сыр фета', count: 150, measure: 'г.'},
                    {name: 'Помидоры черри', count: 200, measure: 'г.'},
                    {name: 'Огурцы', count: 200, measure: 'г.'},
                    {name: 'Салат айсберг', count: 100, measure: 'г.'}
                ]
            }
        ],
        steps: [
            {
                number: 1,
                text: 'Несколько веточек петрушки вымойте и мелко нарежьте. В миску выложите греческий йогурт. Добавьте к нему сок половины лимона и дижонскую горчицу. Посолите и поперчите заправку, добавьте нарезанную петрушку. Смешайте ингредиенты венчиком до получения однородной консистенции соуса.',
                media: null,
                note: null
            },
            {
                number: 2,
                text: 'Огурцы нарежьте полукружьями. Помидоры черри разрежьте пополам. Листья салата порвите руками на небольшие кусочки.',
                media: {
                    type: 'photo',
                    url: 'https://avatars.mds.yandex.net/i?id=2836767a3a21a42bc418181ea028ae429d22d828-9859359-images-thumbs&n=13'
                },
                note: null
            },
            {
                number: 3,
                text: '',
                media: {type: 'photo', url: 'https://images.unsplash.com/photo-1559181567-c3190ca9959b?q=80&w=1000'},
                note: 'Для более нежного вкуса можно использовать сыр сиртаки, но тогда солите меньше.'
            }
        ]
    }),
    createRecipe({
        id: 'family-zucchini-svetlana',
        title: 'Запечённые кабачки с сыром',
        author: 'Василькова Светлана',
        image: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?q=80&w=900&auto=format&fit=crop',
        type: 'lunch',
        time: 35,
        servings: 3,
        ownerId: 'user-svetlana',
        groupId: 'family',
        peopleCount: 3
    }),
    createRecipe({
        id: 'family-cutlets-petr',
        title: 'Куриные тефтели в сливочном соусе',
        author: 'Васильков Петр',
        image: 'https://images.unsplash.com/photo-1547592180-85f173990554?q=80&w=900&auto=format&fit=crop',
        type: 'dinner',
        time: 40,
        servings: 4,
        ownerId: 'user-petr',
        groupId: 'family',
        peopleCount: 4
    }),
    createRecipe({
        id: 'family-pie-natalia',
        title: 'Яблочный пирог на кефире',
        author: 'Ромашкова Наталья',
        image: 'https://images.unsplash.com/photo-1562007908-17c67e878c88?q=80&w=900&auto=format&fit=crop',
        type: 'breakfast',
        time: 45,
        servings: 6,
        ownerId: 'user-natalia',
        groupId: 'family',
        peopleCount: 6
    }),
    createRecipe({
        id: 'favorite-pumpkin-soup',
        title: 'Крем суп из тыквы',
        author: 'Кузнецова Мария',
        image: 'https://images.unsplash.com/photo-1547592180-85f173990554?q=80&w=900&auto=format&fit=crop',
        type: 'lunch',
        time: 30,
        servings: 4,
        isFavorite: true,
        favoriteOwnerId: PROFILE_USER_ID,
        peopleCount: 4
    }),
    createRecipe({
        id: 'main-buckwheat-avocado-bowl',
        title: 'Боул с гречкой и авокадо',
        author: 'Иванова Анна',
        image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=900&auto=format&fit=crop',
        type: 'breakfast',
        time: 18,
        servings: 2,
        peopleCount: 2
    }),
    createRecipe({
        id: 'main-baked-cod-vegetables',
        title: 'Треска с запечёнными овощами',
        author: 'Смирнов Олег',
        image: 'https://images.unsplash.com/photo-1485921325833-cf8e71b48c27?q=80&w=900&auto=format&fit=crop',
        type: 'dinner',
        time: 35,
        servings: 3,
        peopleCount: 3
    }),
    createRecipe({
        id: 'main-banana-pancakes',
        title: 'Банановые панкейки',
        author: 'Лебедева Оксана',
        image: 'https://images.unsplash.com/photo-1528207776546-365bb710ee93?q=80&w=900&auto=format&fit=crop',
        type: 'breakfast',
        time: 22,
        servings: 4,
        peopleCount: 4
    }),
    createRecipe({
        id: 'main-mushroom-soup',
        title: 'Суп-пюре из шампиньонов',
        author: 'Орлов Денис',
        image: 'https://images.unsplash.com/photo-1495521821757-a1efb6729352?q=80&w=900&auto=format&fit=crop',
        type: 'lunch',
        time: 28,
        servings: 4,
        peopleCount: 4
    })
];
