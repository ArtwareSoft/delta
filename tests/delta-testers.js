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
            const cleanCtx = new jb.jbCtx()
            const inputAfterDelta = jb.delta.applyDeltas(initialData,delta)
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
