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
const applyDeltas = (input, deltas) => toDarray(deltas).reduce( (res, delta) => res = applyDelta(res, delta) , input)
function applyDelta(val,delta) {
    if (delta === undefined) return
    if (val === undefined && delta && typeof delta === 'object')
        val = {}
    const op = Object.keys(delta_ops).filter(k => delta['$'+k] !== undefined)[0];
    if (op)
        return delta_ops[op](delta,val)
    
    if (typeof delta === 'object' && !Array.isArray(delta)) {
        const res = Array.isArray(val) ? val.slice(0) : Object.assign({},val); // clone
        Object.keys(delta).filter(key=> key !== '$orig').forEach(key => res[key] = applyDelta(val[key], delta[key]))
        return cleanUndefined(res)
    }
    return delta; // primitive without op
}
function handleDeltaByType(delta,ctx) {
    if (delta.$splice)
        return ctx.params.splice(ctx.setData(delta))
    return ctx.params.update(ctx.setData(delta))
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
function addToDarray(dArr, toAdd) {
    if (Array.isArray(toAdd))
        return dArr.concat(toAdd.filter(x=>x && !jb.isEmpty(x)))
    return toAdd && !jb.isEmpty(toAdd) ? dArr.concat(toAdd) : dArr
}

const toSingleDelta = deltas => deltas && deltas.$dArray ? deltas[0] : deltas
const cleanUndefined = obj => jb.objFromEntries(jb.entries(obj).filter(e=> e[1] !== undefined))
const mapValuesIgnoreOrig = (obj, mapFunc) =>
    Object.keys(obj).filter(k=>k!='$orig').reduce((acc, key) => ({ ...acc, [key]: mapFunc(obj[key],key) }) , {})

jb.delta = {
    toDarray,
    toSingleDelta,
    asDarray,
    applyDelta,
    applyDeltas,
    mapValuesIgnoreOrig,
    enrichWithOrig: (obj,orig) =>
        jb.isEmpty(obj) ? obj : Object.assign({},obj, {$orig: mapValuesIgnoreOrig(obj,(v,k)=>orig[k])}),

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
                const res = handleDeltaByType(delta,ctx.setVars({cache: main}))
                const cacheRes = this.delta2deltaCache.delta(dInputs, {cache: inner})
                main = applyDeltas(main, cacheRes.dOutput)
                inner = applyDeltas(inner, cacheRes.dCache)
                dCache.push({main: cacheRes.dOutput, inner: cacheRes.dCache})
                return addToDarray(dOutput,res)
            }   , []))
        return { dOutput, dCache }
    },
    deltaWithoutCache(dInputs,{init, noDeltaTransform} = {}, ctx) {
        if (init) {
            const ctxWithFullData = ctx.setData(toSingleDelta(dInputs))
            return { dOutput: noDeltaTransform(ctxWithFullData) }
        }
        
        const dOutput = asDarray(toDarray(dInputs).reduce((dOutput,delta) =>
            addToDarray(dOutput, handleDeltaByType(delta,ctx)), []))
        return { dOutput }
    },
    objectDiff(newObj, orig) {
        if (orig === newObj) return {}
        if (!jb.isObject(orig) || !jb.isObject(newObj)) return newObj
        const deletedValues = Object.keys(orig).reduce((acc, key) =>
            newObj.hasOwnProperty(key) ? acc : { ...acc, [key]: undefined }
        , {})
      
        return Object.keys(newObj).reduce((acc, key) => {
          if (!orig.hasOwnProperty(key)) return { ...acc, [key]: newObj[key] } // return added r key
          const difference = jb.delta.objectDiff(newObj[key], orig[key])
          if (jb.isObject(difference) && jb.isEmpty(difference)) return acc // return no diff
          return { ...acc, [key]: difference } // return updated key
        }, deletedValues)
    },
}

jb.mapValues = function(obj, mapFunc) {
    if (Array.isArray(obj))
        return obj.map((val,i) => mapFunc(val,i))
    return Object.keys(obj).reduce((acc, key) => ({ ...acc, [key]: mapFunc(obj[key],key) }) , {})
}

jb.isEmpty = o => Object.keys(o).length === 0;
jb.isObject = o => o != null && typeof o === 'object';
  
})()