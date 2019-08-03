(function() {

delta_ops = { 
    splice(delta, val) {
        if (typeof val === 'string')
            return val.slice(0,delta.$splice.from) + delta.$splice.toAdd +val.slice(delta.$splice.from+delta.$splice.itemsToRemove)
        if (Array.isArray(val)) {
            const res = val.slice(0)
            res.splice(delta.$splice.from, delta.$splice.itemsToRemove, delta.$splice.toAdd)
            return res
        }
        const arrayed =  isString ? val.split('') : val
        arrayed.splice(delta.$splice.from, delta.$splice.itemsToRemove, delta.$splice.toAdd)
        return isString ? arrayed.join('') : arrayed
    }, 
    push(delta,val) {
        if (Array.isArray(val)) {
            const res = val.slice(0)
            res.push(delta.$push)
            return res
        }
    },
    add(delta, val) {
        if (typeof val === 'number')
            return val + delta.$add
    },
    linearAcc(delta, val) {
        if (Array.isArray(val))
            return val.map((v,i) => i < delta.$linearAcc.after ? v : applyDelta(v, delta.$linearAcc.delta));
        return jb.objFromEntries(jb.entries(val).map(e=> e[0] < delta.$linearAcc.after ? e : [e[0], applyDelta(e[1], delta.$linearAcc.delta)]))
    }
}


// apply the redux way
function applyDelta(val,delta) {
    if (delta === undefined) return
    if (val === undefined && delta && typeof delta === 'object')
        val = {}
    const op = Object.keys(delta_ops).filter(k => delta['$'+k] )[0];
    if (op)
        return delta_ops[op](delta,val)
    
    if (typeof delta === 'object' && !Array.isArray(delta)) {
        const res = Array.isArray(val) ? val.slice(0) : Object.assign({},val); // clone
        Object.keys(delta).filter(key=> key !== '$orig').forEach(key => res[key] = applyDelta(val[key], delta[key]))
        return res
    }
    return delta; // primitive without op
}

function toDarray(delta) {
    if (delta === null || delta === undefined)
        return asDarray([])
    return delta.$dArray ? delta : asDarray([delta])
}

function asDarray(arr) {
    if (!Array.isArray(arr)) debugger
    arr.$dArray = true
    return arr;
}

function toSingleDelta(deltas) {
    return deltas && deltas.$dArray ? deltas[0] : deltas
}
// function Derive(profile,ctx) {
//     return {
//         delta(...args) {
//             this._deltaObj = this._deltaObj || ctx.setVars({transformationFunc: {profile,ctx}}).run(Object.assign({},profile, {$: `inc.${jb.compName(profile)}` }))
//             jb.log('delta',[...args])
//             return this._deltaObj.delta(...args)
//         }
//     }
// }

const applyDeltas = (input, deltas) => toDarray(deltas).reduce( (res, delta) => res = applyDelta(res, delta) , input)

jb.delta = {
    toDarray,
    toSingleDelta,
    asDarray,
    applyDeltas,
    enrichWithOrig: (obj,orig) => // todo: recursive
        Object.assign({},obj, {$orig: jb.objFromEntries(jb.entries(obj).filter(e=> e[0].indexOf('$') !== 0).map(e=>[e[0],orig[e[0]]])) }),

    deltaWithCache(dInputs,{cache, init, noDeltaTransform} = {}, ctx) {
        this.delta2deltaCache = this.delta2deltaCache || ctx.params.inputToCache(ctx);
        if (init) {
            const ctxWithFullData = ctx.setData(toSingleDelta(dInputs))
            const cacheResult = this.delta2deltaCache.delta(dInputs, {init: true})
            return {
                dOutput: noDeltaTransform(ctxWithFullData), 
                dCache: { main: ctx.params.inputToCache().noDeltaTransform(ctxWithFullData), inner: cacheResult.dCache }
            }
        }
        
        let main = cache.main, inner = cache.inner;
        const dCache = []
        const dOutput = asDarray(toDarray(dInputs).reduce((dOutput,delta) => {
                const res = handleDeltaByType(ctx.setVars({cache: main}), delta)
                const cacheRes = this.delta2deltaCache.delta(dInputs, {cache: inner})
                main = applyDeltas(main, cacheRes.dOutput)
                inner = applyDeltas(inner, cacheRes.dCache)
                dCache.push({main: cacheRes.dOutput, inner: cacheRes.dCache})
                return dOutput.concat(jb.toarray(res))
            }   , []))
        return { dOutput, dCache }

        function handleDeltaByType(ctxWithCache, delta) {
            if (delta.$splice)
                return ctx.params.splice(ctxWithCache.setData(delta))
            return ctx.params.update(ctxWithCache.setData(delta))
        }
    },
    deltaWithoutCache(dInputs,{init, noDeltaTransform} = {}, ctx) {
        if (init) {
            const ctxWithFullData = ctx.setData(toSingleDelta(dInputs))
            return { dOutput: noDeltaTransform(ctxWithFullData) }
        }
        
        const dOutput = asDarray(toDarray(dInputs).reduce((dOutput,delta) => {
            const res = handleDeltaByType(delta)
            return dOutput.concat(res)
        }   , []))
        return { dOutput }

        function handleDeltaByType(delta) {
            if (delta.$splice)
                return ctx.params.splice(ctx.setData(delta))
            return ctx.params.update(ctx.setData(delta))
        }
    },
}

jb.propOfProfile = function(profile,prop) {
    if (profile[prop]) return profile[prop];
    const sugarProp = jb.entries(profile).filter(p=>p[0].indexOf('$') == 0 && p[0].length > 1)
    return sugarProp[0] && sugarProp[0][1]
}

jb.mapValues = function(obj, mapFunc) {
    return jb.objFromEntries(jb.entries(obj).map(e=> [e[0], mapFunc(e[1],e[0])]))
}

jb.compareObjects = function( x, y ) {
    if ( x === y ) return true;
    if ( ! ( x instanceof Object ) || ! ( y instanceof Object ) ) return false;
    if ( x.constructor !== y.constructor ) return false;
    for ( var p in x ) {
      if ( ! x.hasOwnProperty( p ) ) continue;
      if ( ! y.hasOwnProperty( p ) ) return false;
      if ( x[ p ] === y[ p ] ) continue;
      if ( typeof( x[ p ] ) !== "object" ) return false;
      if ( ! jb.compareObjects( x[ p ],  y[ p ] ) ) return false;
    }
  
    for ( p in y ) {
      if ( y.hasOwnProperty( p ) && ! x.hasOwnProperty( p ) ) return false;
    }
    return true;
}

})()