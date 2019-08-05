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

jb.component('delta-filter-false2true', {
    impl: {$: 'delta-test' ,
        transformation :{$filter: '%done%' },
        initialData: '%$tasks%',
        delta :{$asIs: { gym: {done: true} }},
    }
})

jb.component('delta-filter-true2false', {
    impl: {$: 'delta-test' ,
        transformation :{$filter: '%done%' },
        initialData: '%$tasks%',
        delta :{$asIs: { tennis: {done: false} }},
    }
})

jb.component('delta-filter-keep-true', {
    impl: {$: 'delta-test' ,
        transformation :{$filter: '%done%' },
        initialData: '%$tasks%',
        delta :{$asIs: { tennis: {done: true} }},
    }
})

jb.component('delta-filter-keep-false', {
    impl: {$: 'delta-test' ,
        transformation :{$filter: '%done%' },
        initialData: '%$tasks%',
        delta :{$asIs: { gym: {done: false} }},
    }
})

jb.component('delta-count-no-change', {
    impl: {$: 'delta-test' ,
        transformation :{$: 'count' },
        initialData: {$asIs: [0,1,2]},
        delta :{$asIs: { 1: 77 }},
    }
})

jb.component('delta-count-add', {
    impl: {$: 'delta-test' ,
        transformation :{$: 'count' },
        initialData: {$asIs: [0,1,2]},
        delta :{$asIs: { 3: 77 }},
    }
})

jb.component('delta-count-remove', {
    impl: {$: 'delta-test' ,
        transformation :{$: 'count' },
        initialData: {$asIs: [0,1,2]},
        delta :{$asIs: { 1: undefined }},
    }
})

jb.component('delta-filter-count-pipline-add', {
    impl: {$: 'delta-test' ,
        transformation :{$chain: [ {$filter: ({data}) => data < 2 }, {$: 'count' }]},
        initialData: {$asIs: [0,1,2]},
        delta :{$asIs: { 2: 0 }},
    }
})

jb.component('delta-filter-count-pipline-remove', {
    impl: {$: 'delta-test' ,
        transformation :{$chain: [ {$filter: ({data}) => data < 2 }, {$: 'count' }]},
        initialData: {$asIs: [0,1,2]},
        delta :{$asIs: { 1: 5 }},
    }
})

jb.component('delta-filter-count-pipline-no-change', {
    impl: {$: 'delta-test' ,
        transformation :{$chain: [ {$filter: ({data}) => data < 2 }, {$: 'count' }]},
        initialData: {$asIs: [0,1,2]},
        delta :{$asIs: { 0: 1 }},
    }
})