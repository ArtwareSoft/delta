jb.component('with-delta-support', {
    type: 'with-delta-support',
    params: [
        {id: 'noDeltaTransform', dynamic: true},
        {id: 'update', dynamic: true},
        {id: 'splice', dynamic: true},
        {id: 'inputToCache', dynamic: true},
    ],
    impl: (ctx,noDeltaTransform) => ({
        noDeltaTransform: ctx2 => noDeltaTransform(ctx2),
        delta: (dInputs,options = {}) => {
            const delta = ctx.params.inputToCache.profile
            ? jb.delta.deltaWithCache(dInputs, Object.assign({noDeltaTransform},options), ctx)
            : jb.delta.deltaWithoutCache(dInputs, Object.assign({noDeltaTransform},options), ctx)
            jb.log('deltaRes', [ctx.componentContext && ctx.componentContext.callerPath, options.init, delta, dInputs,options, ctx])
            return delta
        }
    })
})

jb.component('mapValues', {
    type: 'with-delta-support',
    params: [
        {id: 'map', dynamic: true}
    ],
    impl: {$: 'with-delta-support',
        noDeltaTransform: (ctx,{},{map}) => Array.isArray(ctx.data)
            ? ctx.data.map(item=>map(ctx.setData(item)))
            : jb.mapValues(ctx.data, item => map(ctx.setData(item))),

        update: (ctx,{},{map}) => {
            const calcultedEntries = jb.entries(ctx.data).filter(e=>e[0] != '$orig')
                .map(e=>({ prop: e[0], 
                    orig: map(ctx.setData(ctx.data.$orig[e[0]])), 
                    newVal: map(ctx.setData(e[1])) }))
                .filter(e=>e.newVal != e.orig)
            
            const newOrigEntry = jb.objFromEntries(calcultedEntries.map(({prop,orig}) =>[prop, orig]))
            return calcultedEntries.length ? jb.objFromEntries(calcultedEntries.map(({prop,newVal}) =>[prop, newVal])
                .concat([['$orig', newOrigEntry]])) : []
        },
        splice: (ctx,{},{map}) => {
            const delta = ctx.data
            return Object.assign({}, delta.$splice, { toAdd: delta.$splice.toAdd.map(v=> map(ctx.setData(v))) })
        }
    }
})

jb.component('chain', {
	type: 'data',
	params: [
		{ id: 'items', type: "data[]", ignore: true, mandatory: true, composite: true },
    ],
    impl: ctx => ({
        noDeltaTransform: ({data}) => {
            const profiles = jb.toarray(ctx.profile.items || ctx.profile.$chain);
            const innerPath = (ctx.profile.items && ctx.profile.items.sugar) ? '' : ctx.profile.$chain ? '$chain~' : 'items~';
            return profiles.reduce((data, profile, i) => 
                jb.run(new jb.jbCtx(ctx, { data, profile, path: innerPath+i }), ctx.parentParam).noDeltaTransform(ctx.setData(data)) , data)
        },
        delta(dInputs,{cache, init} = {}) {
            if (!this.dNodes) {
                const profiles = jb.toarray(ctx.profile.items || ctx.profile.$chain);
                const innerPath = (ctx.profile.items && ctx.profile.items.sugar) ? '' : ctx.profile.$chain ? '$chain~' : 'items~';
                this.dNodes = profiles.map((profile,i) => new jb.jbCtx(ctx, { profile, path: innerPath+i }).run(profile, ctx.parentParam) )
            }
            const dCache = {}
            const dOutput = this.dNodes.reduce((dOutput, dNode, i) => {
                const nodeOutput = dNode.delta(dOutput, {init, cache: cache && cache[i]})
                if (nodeOutput.dCache)
                    dCache[i] = nodeOutput.dCache
                return nodeOutput.dOutput
            }, dInputs)
            return {dOutput, dCache}
      }
    })
})

jb.component('filter', {
    type: 'with-delta-support',
    params: [
        {id: 'exp', dynamic: true}
    ],
    impl: {$: 'with-delta-support',
        noDeltaTransform: (ctx,{},{exp}) => Array.isArray(ctx.data)
            ? ctx.data.filter(item=>exp(ctx.setData(item)))
            : jb.objFromEntries(jb.entries(ctx.data).filter(e=>exp(ctx.setData(e[1])))),

        update: (ctx,{},{exp}) => {
            const calcultedEntries = jb.entries(ctx.data).filter(e=>e[0] != '$orig')
                .map(e=>({ prop: e[0], 
                    orig: !!exp(ctx.setData(ctx.data.$orig[e[0]])), 
                    newVal: !!exp(ctx.setData(e[1])) }))
                .filter(e=>e.newVal != e.orig)
            
            const newOrigEntry = jb.objFromEntries(calcultedEntries.map(({prop,orig}) =>[prop, orig ? ctx.data.$orig[prop] : undefined]))
            return calcultedEntries.length ? jb.objFromEntries(calcultedEntries.map(({prop, newVal}) =>[prop, newVal ? ctx.data[prop] : undefined])
                .concat([['$orig', newOrigEntry]])) : []
        },
        splice: (ctx,{},{exp}) => {
            const delta = ctx.data
            const toAdd = delta.$splice.toAdd.map(v=> exp(ctx.setData(v)) ? v : undefined ).filter(x=>x !== undefined)
            return Object.assign({}, delta.$splice, {toAdd})
        }
    }
})
