(function () {

const {deltaTest, mapValues, chain, data, join, accumulateSum, select, filter, count} = jb.profiles

jb.const('tasks', {
    'gym': { done: false},
    'tennis': { done: true},
    'work': { done: false},
})

jb.component('delta-select-outside', {
    impl: deltaTest({
        transformation: select('work/done'),
        initialData: '%$tasks%',
        delta: data({ gym: {done: true} }),
    })
})

jb.component('delta-select-inside', {
    impl: deltaTest({
        transformation: select('gym/done'),
        initialData: '%$tasks%',
        delta: data({ gym: {done: true} }),
    })
})

jb.component('delta-select-any', {
    impl: deltaTest({
        transformation: select('*/done'),
        initialData: '%$tasks%',
        delta: data({ gym: {done: true} }),
    })
})

jb.component('delta-filter-false2true', {
    impl: deltaTest({
        transformation: filter('%done%'),
        initialData: '%$tasks%',
        delta: data({ gym: {done: true} }),
    })
})

jb.component('delta-filter-true2false', {
    impl: deltaTest({
        transformation: filter('%done%'),
        initialData: '%$tasks%',
        delta: data({ tennis: {done: false} }),
    })
})

jb.component('delta-filter-keep-true', {
    impl: deltaTest({
        transformation: filter('%done%'),
        initialData: '%$tasks%',
        delta: data({ tennis: {done: true} }),
    })
})

jb.component('delta-filter-keep-false', {
    impl: deltaTest({
        transformation: filter('%done%'),
        initialData: '%$tasks%',
        delta: data({ gym: {done: false} }),
    })
})

jb.component('delta-count-no-change', {
    impl: deltaTest({
        transformation: count(),
        initialData: data([0,1,2]),
        delta: data({ 1: 77 }),
    })
})

jb.component('delta-count-add', {
    impl: deltaTest({
        transformation: count(),
        initialData: data([0,1,2]),
        delta: data({ 3: 77 }),
    })
})

jb.component('delta-count-remove', {
    impl: deltaTest({
        transformation: count(),
        initialData: data([0,1,2]),
        delta: data({ 1: undefined }),
    })
})

jb.component('delta-filter-count-pipline-add', {
    impl: deltaTest({
        transformation: chain(filter(({data}) => data < 2), count()),
        initialData: data([0,1,2]),
        delta: data({ 2: 0 }),
    })
})

jb.component('delta-filter-count-pipline-remove', {
    impl: deltaTest({
        transformation: chain(filter(({data}) => data < 2), count()),
        initialData: data([0,1,2]),
        delta: data({ 1: 5 }),
    })
})

jb.component('delta-filter-count-pipline-no-change', {
    impl: deltaTest({
        transformation: chain(filter(({data}) => data < 2), count()),
        initialData: data([0,1,2]),
        delta: data({ 0: 1 }),
    })
})

})()