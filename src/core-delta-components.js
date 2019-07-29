var {Derive, deltas2deltas, toSingleDelta, asDarray} = jb.delta

jb.component('inc.delta-with-cache', {
    type: 'incremental',
    params: [
        {id: 'delta2deltas', dynamic: true},
        {id: 'inputToCache', dynamic: true},
        {id: 'vars', type: 'asIs'},
    ],
    impl: (ctx, delta2deltas, inputToCache, vars) => ({
        delta(dInputs,{cache, init} = {}) {
            this.delta2deltaCache = this.delta2deltaCache || Derive(inputToCache.profile, ctx);

            this.ctxWithVars = this.ctxWithVars || jb.entries(vars).reduce((resCtx, varEntry) => resCtx.setVars({[varEntry[0]]: resCtx.run(varEntry[1])}), ctx)
            if (init) {
                const ctxWithFullData = this.ctxWithVars.setData(toSingleDelta(dInputs))
                const cacheResult = this.delta2deltaCache.delta(dInputs, {init})
                return {
                    dOutput: ctxWithFullData.run(ctx.vars.transformationFunc.profile), 
                    dCache: { main: inputToCache(ctxWithFullData), inner: cacheResult.dCache }
                }
            }
            const ctxWithCache = this.ctxWithVars.setVars({cache: cache.main })
            const cacheRes = this.delta2deltaCache.delta(dInputs, {cache: cache.inner})
            return { dOutput: deltas2deltas(dInputs, delta2deltas, ctxWithCache), dCache: { main: cacheRes.dOutput, inner: cacheRes.dCache } }
        }
    })
})

jb.component('inc.delta-without-cache', {
    type: 'incremental',
    params: [
        {id: 'delta2deltas', dynamic: true},
    ],
    impl: (ctx, delta2deltas) => ({
        delta(dInputs, {init} = {}) {
            if (init) {
                const ctxWithFullData = ctx.setData(toSingleDelta(dInputs))
                return {
                    dOutput: ctxWithFullData.run(ctx.vars.transformationFunc.profile)
                }
            }
            return { dOutput: deltas2deltas(dInputs, delta2deltas, ctx) }
        }
    })
})

jb.component('chain', {
	type: 'data',
	params: [
		{ id: 'items', type: "data[]", ignore: true, essential: true, composite: true },
	],
	impl: ctx => {
        const profiles = jb.toarray(ctx.profile.items || ctx.profile.$chain);
        const innerPath = (ctx.profile.items && ctx.profile.items.sugar) ? '' : ctx.profile.$chain ? '$chain~' : 'items~';
        return profiles.reduce((data, profile, i) => 
            jb.run( new jb.jbCtx(ctx, { data, profile, path: innerPath+i }), ctx.parentParam), ctx.data)
    }
})

jb.component('inc.chain', {
    derivationOf: 'chain',
    type: 'incremental',
    impl: ctx => ({
        init (transformationFunc) {
            this.profile = transformationFunc.profile
            profiles = jb.toarray(this.profile.items || this.profile.$chain);
            innerPath = (this.profile.items && this.profile.items.sugar) ? '' : this.profile.$chain ? '$chain~' : 'items~';
            this.dNodes = profiles.map((profile,i) => Derive(profile, new jb.jbCtx(ctx, { profile, path: innerPath+i }), ctx.parentParam))
        },
        delta(dInputs,{cache, init} = {}) {
            if (!this.profile)
                this.init(ctx.vars.transformationFunc)
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

jb.component('mapValues', {
    params: [
        {id: 'map', dynamic: true}
    ],
    impl: (ctx,map) => Array.isArray(ctx.data)
        ? ctx.data.map(item=>map(ctx.setData(item)))
        : jb.mapValues(ctx.data, item => map(ctx.setData(item)))
    // todo: if (map.compileLocal) jb.mapValues(ctx.data, data => map.compiledLocal({data}))
})

jb.component('inc.mapValues', {
    derivationOf: 'mapValues',
    type: 'incremental',
    impl: { $: 'inc.delta-without-cache', 
        delta2deltas: (ctx,{transformationFunc}) => {
            const mapProfile = transformationFunc.profile.$mapValues || transformationFunc.profile.map
            return jb.objFromEntries(jb.entries(ctx.data).map(e=>e[0] == '$orig' ? e : [e[0], ctx.setData(e[1]).run(mapProfile) ]))
        }
    }
})


jb.component('accumulate-sum', {
    params: [
        { id: 'resultProp', as: 'string', essential: true},
        { id: 'startValue', as: 'number', defaultValue: 0 },
        { id: 'toAdd', dynamic: 'true', description: 'can use vars: item'}
    ],
    impl: (ctx, prop, startValue, toAdd) => {
        let acc = startValue
        if (Array.isArray(ctx.data))
            return ctx.data.map(item=> Object.assign({},item,{[prop]: acc = acc + toAdd(ctx.setData(item))}))
        return jb.mapValues(ctx.data, item => Object.assign({},item, {[prop]: acc = acc + toAdd(ctx.setData(item))}))
    }
})

jb.component('inc.accumulate-sum', {
    derivationOf: 'accumulate-sum',
    type: 'incremental',
    impl :{$: 'inc.delta-without-cache',
        delta2deltas: (ctx, {transformationFunc}) => {
            const delta = ctx.data
            return asDarray([delta, ...Object.keys(ctx.data).filter(x=>x!='$orig').map(key => {
                const diff =  toAddOfKey(delta,key) - toAddOfKey(delta.$orig,key)
                return {
                    $linearAcc: {
                        after: key,
                        delta: { [transformationFunc.profile.resultProp]: {$add: diff } }
                }}
            })])

            function toAddOfKey(deltaObj, key) {
                return (deltaObj && deltaObj[key] && transformationFunc.ctx.setData(deltaObj[key]).run(transformationFunc.profile.toAdd)) || 0
            }
        }
    },
})

jb.component('join', {
    params: [
        {id: 'separator', as: 'string'}
    ],
    impl: ({data},separator) => (Array.isArray(data) ? data :  jb.entries(data).map(e=>e[1])).join(separator)
})

jb.component('inc.join', {
    derivationOf: 'join',
    type: 'incremental',
    impl :{$: 'inc.delta-with-cache',
        supportKeyChange: false, 
        supportOrderChange: false, 
        $vars: {
           separator: ({},{transformationFunc}) => transformationFunc.profile.separator
        },
        inputToCache :{$chain: [ 
                { $mapValues: ({data}) => ({length: data.length}) }, 
                { $: 'accumulate-sum', resultProp: 'posOfNext', toAdd: ({data}, {separator}) => data.length + separator.length }
        ]},
        delta2deltas: ({data},{cache, separator}) =>
                Object.keys(data).filter(x=>x!='$orig').sort().reverse().map(id=> {
                    if (data.$orig[id] === undefined && Object.keys(cache).length == id) { // new elem (push)
                        return { $splice: {from: cache[id-1].posOfNext, itemsToRemove: 0, toAdd: separator + data[id] } }
                    }
                    if (data[id] === undefined) { // removed
                        return { $splice: {from: cache[id-1].posOfNext, itemsToRemove: cache[id].length + separator.length, toAdd: '' } }
                    }
                    return { $splice: {from: cache[id-1] ? cache[id-1].posOfNext : 0, itemsToRemove: cache[id].length, toAdd: data[id] } }
                })
    },
})
