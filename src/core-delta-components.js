(function() {

const {Derive, deltaWithCache} = jb.delta

jb.component('inc.delta-with-cache', {
    type: 'incremental',
    params: [
        {id: 'init', dynamic: true},
        {id: 'update', dynamic: true},
        {id: 'splice', dynamic: true},
        {id: 'inputToCache', dynamic: true},
    ],
    impl: ctx => jb.delta.deltaWithCache(ctx,ctx.vars)
})

jb.component('inc.delta-without-cache', {
    type: 'incremental',
    params: [
        {id: 'update', dynamic: true},
        {id: 'splice', dynamic: true},
    ],
    impl: ctx => jb.delta.deltaWithoutCache(ctx,ctx.vars)
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
        update: (ctx,{transformationFunc}) => {
            const mapProfile = jb.propOfProfile(transformationFunc.profile,'map')
//            return jb.objFromEntries(jb.entries(ctx.data).map(e=>e[0] == '$orig' ? e : [e[0], ctx.setData(e[1]).run(mapProfile) ]))

            const calcultedEntries = jb.entries(ctx.data).filter(e=>e[0] != '$orig')
                .map(e=>({ prop: e[0], orig: ctx.setData(ctx.data.$orig[e[0]]).run(mapProfile), newVal: ctx.setData(e[1]).run(mapProfile)}))
                .filter(e=>e.newVal != e.orig)
            
            const newOrigEntry = jb.objFromEntries(calcultedEntries.map(({prop,orig}) =>[prop, orig]))
            return jb.objFromEntries(calcultedEntries.map(({prop,newVal}) =>[prop, newVal])
                .concat([['$orig', newOrigEntry]]))
        },
        splice: (ctx,{transformationFunc}) => {
            const delta = ctx.data
            const mapProfile = jb.propOfProfile(transformationFunc.profile,'map')
            return Object.assign({}, delta.$splice, { toAdd: delta.$splice.toAdd.map(v=>ctx.setData(v).run(mapProfile)) })
        },
    }
})

jb.component('filter', {
    params: [
        {id: 'exp', dynamic: true}
    ],
    impl: (ctx,exp) => Array.isArray(ctx.data)
        ? ctx.data.filter(item=>exp(ctx.setData(item)))
        : jb.objFromEntries(jb.entries(ctx.data).filter(e=>exp(ctx.setData(e[1]))))
})

jb.component('inc.filter', {
    derivationOf: 'filter',
    type: 'incremental',
    impl: { $: 'inc.delta-without-cache', 
        update: (ctx,{transformationFunc}) => {
            const expProfile = jb.propOfProfile(transformationFunc.profile,'exp')
            return jb.objFromEntries(jb.entries(ctx.data).map(e=>e[0] == '$orig' ? e : [e[0], ctx.setData(e[1]).run(expProfile) ]))
        },
        splice: (ctx,{transformationFunc}) => {
            const delta = ctx.data
            const expProfile = jb.propOfProfile(transformationFunc.profile,'exp')
            return Object.assign({}, delta.$splice, { toAdd: delta.$splice.toAdd.map(v=>ctx.setData(v).run(expProfile)) })
        },
    }
})

})()