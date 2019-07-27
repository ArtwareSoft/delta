var {Derive, applyDeltas} = jb.delta

jb.component('delta-test', {
	type: 'test',
	params: [
		{ id: 'calculate', dynamic: true },
		{ id: 'initialData' },
		{ id: 'delta', as: 'array' },
		{ id: 'cleanUp', type: 'action', dynamic: true },
		{ id: 'expectedCounters', as: 'single' }
	],
	impl: function(context,calculate,initialData,delta,cleanUp,expectedCounters) {
		if (expectedCounters) {
			if (!jb.frame.wSpy.enabled())
				jb.frame.initwSpy({wSpyParam: 'data-test'})
			jb.frame.wSpy.clear()
        }
        
        // calculate without incremental
        try {
            const deltas = jb.toarray(delta)
            const cleanCtx = new jb.jbCtx()
            const inputAfterDelta = jb.delta.applyDeltas(initialData,deltas)
            const res = calculate(cleanCtx.setData(inputAfterDelta))

            const deltaFunc = Derive(calculate.profile, cleanCtx)
            const initalResult = deltaFunc.delta(initialData, {init: true})
            const firstOutput = applyDeltas({}, initalResult.dOutput)
            const cache = applyDeltas({}, initalResult.dCache)
            const deltaWithOrigin = jb.delta.enrichWithOrig(delta,initialData)
            const resultAfterDelta = deltaFunc.delta(deltaWithOrigin, {cache})
            const resWithDelta = applyDeltas(firstOutput, resultAfterDelta.dOutput)

            const countersErr = countersErrors(expectedCounters);
            const success = jb.compareObjects(resWithDelta,res) && !countersErr;
            cleanUp()
            return { id: context.vars.testID, success, reason: countersErr}
        }
        catch(e) {
            return { id: context.vars.testID, success: false, reason: 'exception ' + e.message}
        }
	}
})

jb.component('delta-map-values', {
    impl: {$: 'delta-test' ,
        calculate :{$mapValues: '-%%-' },
        initialData :{$asIs: { 1: 'a', 2: 'b', 3: 'c'} },
        delta :{$asIs: { 2: 'bbbb' } },
    }
})

jb.component('delta-chain-no-cache', {
    impl: {$: 'delta-test' ,
        calculate :{$chain: [{ $mapValues: '-%%-' }, { $mapValues: '#%%#' }] },
        initialData :{$asIs: { 1: 'a', 2: 'b', 3: 'c'} },
        delta :{$asIs: { 2: 'bbbb' } },
    }
})

jb.component('delta-accumulate-sum', {
    impl: {$: 'delta-test' ,
        calculate :{$: 'accumulate-sum', resultProp: 'sum', toAdd: '%v%' },
        initialData :{$asIs: { 1: { v: 1}, 2: {v: 2}, 3: {v: 3} } },
        delta :{$asIs: { 2: { v: 7 } }},
    }
})

jb.component('delta-chain-with-cache', {
    impl: {$: 'delta-test' ,
        calculate :{$chain: [{ $: 'accumulate-sum', resultProp: 'sum', toAdd: '%v%' }] },
        initialData :{$asIs: { 1: { v: 1}, 2: {v: 2}, 3: {v: 3} } },
        delta :{$asIs: { 2: { v: 7 } }},
    }
})

jb.component('delta-join', {
    impl: {$: 'delta-test' ,
        calculate :{$: 'join', separator: ',' },
        initialData :{$asIs: {0: 'a', 1: 'b', 2: 'c'} },
        delta :{$asIs: { 1: 'bbb'} },
    }
})
