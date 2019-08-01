jb.const('tasks', {
    'gym': { done: false},
    'tennis': { done: true},
    'work': { done: false},
})

jb.component('delta-select-outside', {
    impl: {$: 'delta-test' ,
        calculate :{$select: 'work/done' },
        initialData: '%$tasks%',
        delta :{$asIs: { gym: {done: true} }},
    }
})

jb.component('delta-select-inside', {
    impl: {$: 'delta-test' ,
        calculate :{$select: 'gym/done' },
        initialData: '%$tasks%',
        delta :{$asIs: { gym: {done: true} }},
    }
})

jb.component('delta-select-*', {
    impl: {$: 'delta-test' ,
        calculate :{$select: '*/done' },
        initialData: '%$tasks%',
        delta :{$asIs: { gym: {done: true} }},
    }
})

// jb.component('delta-filter', {
//     impl: {$: 'delta-test' ,
//         calculate :{$filter: '%done%' },
//         initialData: '%$tasks%',
//         delta :{$asIs: { gym: {done: true} }},
//     }
// })
