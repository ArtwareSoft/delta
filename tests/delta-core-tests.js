(function () {

const {deltaTest, mapValues, chain, data, join, accumulateSum} = jb.profiles

jb.component('delta-map-values', {
    impl: deltaTest({
        transformation: mapValues('-%%-'),  
        initialData: data({ 1: 'a', 2: 'b', 3: 'c'}),
        delta: data({ 2: 'bbbb' }),
        expectedDeltaOutput: data({ 2: '-bbbb-',  $orig: { 2: '-b-' } })
    })
})

jb.component('delta-map-values', {
    impl: deltaTest({
        transformation: mapValues('-%%-'),
        initialData: data({ 1: 'a', 2: 'b', 3: 'c'}),
        delta: data({ 2: 'bbbb' }),
        expectedDeltaOutput: data({ 2: '-bbbb-',  $orig: { 2: '-b-' } })
    })
})

jb.component('delta-map-values-empty-delta-output', {
    impl: deltaTest({
        transformation: mapValues(({data}) => data > 0 ? 'positive' : 'negative'),
        initialData: data({ 1: 1, 2: -2, 3: 5}),
        delta: data({ 2: -3 }),
        expectedDeltaOutput: data(null)
    })
})

jb.component('delta-chain-no-cache', {
    impl: deltaTest({
        transformation: chain(mapValues('-%%-'), mapValues('#%%#')),
        initialData: data({ 1: 'a', 2: 'b', 3: 'c'}),
        delta: data({ 2: 'bbbb' }),
        expectedDeltaOutput: data({ 2: '#-bbbb-#',  $orig: { 2: '#-b-#' } })
    })
})

jb.component('delta-accumulate-sum', {
    impl: deltaTest({
        transformation: accumulateSum('sum', '%v%'),
        initialData: data([ { v: 1}, {v: 2}, {v: 3} ]),
        delta: data({ 1: { v: 7 }}),
    })
})

jb.component('delta-chain-with-cache', {
    impl: deltaTest({
        transformation: chain(accumulateSum('sum', '%v%')),
        initialData: data({ 1: { v: 1}, 2: {v: 2}, 3: {v: 3} }),
        delta: data({ 2: { v: 7 }}),
    })
})

jb.component('delta-join-change-elem', {
    impl: deltaTest({
        transformation: join(),
        initialData: data(['a','b','c']),
        delta: data({ 1: 'bbb'}),
    })
})

jb.component('delta-join-push', {
    impl: deltaTest({
        transformation: join(),
        initialData: data(['a','b','c']),
        delta: data({ $splice: { from: 3, itemsToRemove: 0, toAdd: ['d']}}),
    })
})

jb.component('delta-join-splice', {
    impl: deltaTest({
        transformation: join(),
        initialData: data(['a','b','c']),
        delta: data({ $splice: { from: 1, itemsToRemove: 1, toAdd: ['d']}}),
    })
})

jb.component('delta-join-splice2', {
    impl: deltaTest({
        transformation: join(),
        initialData: data(['a','b','c']),
        delta: data({ $splice: { from: 1, itemsToRemove: 2, toAdd: ['d']}}),
    })
})

jb.component('delta-join-splice-begin', {
    impl: deltaTest({
        transformation: join(),
        initialData: data(['a','b','c']),
        delta: data({ $splice: { from: 0, itemsToRemove: 1, toAdd: ['d']}}),
    })
})

jb.component('delta-join-splice-begin2', {
    impl: deltaTest({
        transformation: join(),
        initialData: data(['a','b','c']),
        delta: data({ $splice: { from: 0, itemsToRemove: 2, toAdd: ['d']}}),
    })
})

})()