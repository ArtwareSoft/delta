(function() {
const {applyDeltas, toDarray} = jb.delta

jb.component('delta-test', {
	type: 'test',
	params: [
		{ id: 'transformation', type: 'with-delta-support' },
		{ id: 'initialData' },
		{ id: 'delta' },
		{ id: 'expectedDeltaOutput' },
		{ id: 'expectedCounters', as: 'single' },
		{ id: 'cleanUp', type: 'action', dynamic: true },
	],
	impl: function(ctx,transformation,initialData,delta,expectedDeltaOutput,expectedCounters,cleanUp) {
		if (expectedCounters) {
			if (!jb.frame.wSpy.enabled())
				jb.frame.initwSpy({wSpyParam: 'data-test,delta'})
			jb.frame.wSpy.clear()
        }
        
        try {
            const cleanCtx = new jb.jbCtx()

            // calculate without incremental transformation
            const inputAfterDelta = jb.delta.applyDeltas(initialData,delta)
            const res = transformation.noDeltaTransform(ctx.setData(inputAfterDelta))

            // calculate with incremental transformation
            const initalResult = transformation.delta(initialData, {init: true})
            const firstOutput = applyDeltas({}, initalResult.dOutput)
            const cache = applyDeltas({}, initalResult.dCache)
            const deltaWithOrigin = jb.delta.enrichWithOrig(delta,initialData)
            const resultAfterDelta = transformation.delta(deltaWithOrigin, {cache})
            const resWithDelta = applyDeltas(firstOutput, resultAfterDelta.dOutput)

            const countersErr = countersErrors(expectedCounters);
            const deltaOutputErr = compareDeltaOutput(resultAfterDelta.dOutput);
            const success = jb.compareObjects(resWithDelta,res) && !countersErr && !deltaOutputErr;
            cleanUp()
            return { id: ctx.vars.testID, success, reason: countersErr + deltaOutputErr}

            function compareDeltaOutput(dOutput) {
                if (!ctx.profile.expectedDeltaOutput || jb.compareObjects(dOutput,toDarray(expectedDeltaOutput))) 
                    return ''
                return 'delta output ' + jb.prettyPrint({actual: dOutput, expected: expectedDeltaOutput}, null,2)
            }
        }
        catch(e) {
            return { id: ctx.vars.testID, success: false, reason: 'exception ' + e.message}
        }
	}
})

})()