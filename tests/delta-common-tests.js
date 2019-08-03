jb.const('tasks', {
    'gym': { done: false},
    'tennis': { done: true},
    'work': { done: false},
})

jb.component('delta-select-outside', {
    impl: {$: 'delta-test' ,
        transformation :{$select: 'work/done' },
        initialData: '%$tasks%',
        delta :{$asIs: { gym: {done: true} }},
    }
})

jb.component('delta-select-inside', {
    impl: {$: 'delta-test' ,
        transformation :{$select: 'gym/done' },
        initialData: '%$tasks%',
        delta :{$asIs: { gym: {done: true} }},
    }
})

jb.component('delta-select-any', {
    impl: {$: 'delta-test' ,
        transformation :{$select: '*/done' },
        initialData: '%$tasks%',
        delta :{$asIs: { gym: {done: true} }},
    }
})

// jb.component('delta-filter', {
//     impl: {$: 'delta-test' ,
//         transformation :{$filter: '%done%' },
//         initialData: '%$tasks%',
//         delta :{$asIs: { gym: {done: true} }},
//     }
// })
