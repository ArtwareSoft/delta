jb.component('delta-map-values', {
    impl: {$: 'delta-test' ,
        transformation :{$mapValues: '-%%-' },
        initialData :{$asIs: { 1: 'a', 2: 'b', 3: 'c'} },
        delta :{$asIs: { 2: 'bbbb' } },
        expectedDeltaOutput: {$asIs: { 2: '-bbbb-',  $orig: { 2: '-b-' } }}
    }
})

jb.component('delta-map-values-empty-delta-output', {
    impl: {$: 'delta-test' ,
        transformation :{$mapValues: ({data}) => data > 0 ? 'positive' : 'negative' },
        initialData :{$asIs: { 1: 1, 2: -2, 3: 5} },
        delta :{$asIs: { 2: -3 } },
        expectedDeltaOutput: {$asIs: null}
    }
})

jb.component('delta-chain-no-cache', {
    impl: {$: 'delta-test' ,
        transformation :{$chain: [{ $mapValues: '-%%-' }, { $mapValues: '#%%#' }] },
        initialData :{$asIs: { 1: 'a', 2: 'b', 3: 'c'} },
        delta :{$asIs: { 2: 'bbbb' } },
        expectedDeltaOutput: {$asIs: { 2: '#-bbbb-#',  $orig: { 2: '#-b-#' } }}
    }
})

jb.component('delta-accumulate-sum', {
    impl: {$: 'delta-test' ,
        transformation :{$: 'accumulate-sum', resultProp: 'sum', toAdd: '%v%' },
        initialData :{$asIs: [ { v: 1}, {v: 2}, {v: 3} ] },
        delta :{$asIs: { 1: { v: 7 } }},
    }
})

jb.component('delta-chain-with-cache', {
    impl: {$: 'delta-test' ,
        transformation :{$chain: [{ $: 'accumulate-sum', resultProp: 'sum', toAdd: '%v%' }] },
        initialData :{$asIs: { 1: { v: 1}, 2: {v: 2}, 3: {v: 3} } },
        delta :{$asIs: { 2: { v: 7 } }},
    }
})

jb.component('delta-join-change-elem', {
    impl: {$: 'delta-test' ,
        transformation :{$: 'join', separator: ',' },
        initialData :{$asIs: ['a','b','c'] },
        delta :{$asIs: { 1: 'bbb'} },
    }
})

jb.component('delta-join-push', {
    impl: {$: 'delta-test' ,
        transformation :{$: 'join', separator: ',' },
        initialData :{$asIs: ['a','b','c'] },
        delta :{$asIs: { $splice: { from: 3, itemsToRemove: 0, toAdd: ['d']} }},
    }
})

jb.component('delta-join-splice', {
    impl: {$: 'delta-test' ,
        transformation :{$: 'join', separator: ',' },
        initialData :{$asIs: ['a','b','c'] },
        delta :{$asIs: { $splice: { from: 1, itemsToRemove: 1, toAdd: ['d']}} },
    }
})

jb.component('delta-join-splice2', {
    impl: {$: 'delta-test' ,
        transformation :{$: 'join', separator: ',' },
        initialData :{$asIs: ['a','b','c'] },
        delta :{$asIs: { $splice: { from: 1, itemsToRemove: 2, toAdd: ['d']}} },
    }
})

jb.component('delta-join-splice-begin', {
    impl: {$: 'delta-test' ,
        transformation :{$: 'join', separator: ',' },
        initialData :{$asIs: ['a','b','c'] },
        delta :{$asIs: { $splice: { from: 0, itemsToRemove: 1, toAdd: ['d']}} },
    }
})

jb.component('delta-join-splice-begin2', {
    impl: {$: 'delta-test' ,
        transformation :{$: 'join', separator: ',' },
        initialData :{$asIs: ['a','b','c'] },
        delta :{$asIs: { $splice: { from: 0, itemsToRemove: 2, toAdd: ['d']}} },
    }
})


