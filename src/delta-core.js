(function() {

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

delta_ops = { 
    splice: (delta, val) => {
        if (typeof val === 'string')
            return val.slice(0,delta.$splice.from) + delta.$splice.toAdd +val.slice(delta.$splice.from+delta.$splice.itemsToRemove)
        const arrayed =  isString ? val.split('') : val
        arrayed.splice(delta.$splice.from, delta.$splice.itemsToRemove, delta.$splice.toAdd)
        return isString ? arrayed.join('') : arrayed
    }, 
    add: (delta, val) => {
        if (typeof val === 'number')
            return val + delta.$add
    },
    linearAcc: (delta, val) => {
        if (Array.isArray(val))
            return val.map((v,i) => i < delta.$linearAcc.after ? v : applyDelta(v, delta.$linearAcc.delta));
        return jb.objFromEntries(jb.entries(val).map(e=> e[0] < delta.$linearAcc.after ? e : [e[0], applyDelta(e[1], delta.$linearAcc.delta)]))
    }
}

// function isArray(obj) {
//     const keys = Object.keys(obj)
//     const sortedNums = keys.map(k=>Number(k)).filter(x=>!isNaN(x)).sort()
//     return sortedNums[0] === 0 && sortedNums[keys.length-1] === keys.length-1
// }

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
    // if (typeof delta === 'object') {
    //     const toMerge = jb.entries(delta).filter(e=>e[0] !== '$orig').map(e=>[e[0], applyDelta(val[e[0]], delta[e[0]])])
    //     return Object.assign({}, val, jb.objFromEntries(toMerge))
    // }
    return delta; // primitive without op
}

function deltas2deltas(dInputs,deltaToDelta, ctx) {
    // TODO: merge and sort deltas
    return asDarray(toDarray(dInputs).reduce((dOutput,delta) => [...dOutput, ...jb.toarray(deltaToDelta(ctx.setData(delta)))], []))
}

function toDarray(delta) {
    if (delta === null || delta === undefined)
        return []
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

jb.delta = {
    Derive: (profile,ctx) => ({
        delta(...args) {
            this._deltaObj = this._deltaObj || ctx.setVars({transformationFunc: {profile,ctx}}).run(Object.assign({},profile, {$: `inc.${jb.compName(profile)}` }))
            return this._deltaObj.delta(...args)
        },
    }),
    toDarray,
    toSingleDelta,
    asDarray,
    deltas2deltas,
    applyDeltas: (input, deltas) => toDarray(deltas).reduce( (res, delta) => res = applyDelta(res, delta) , input),
    enrichWithOrig: (obj,orig) => // todo: recursive
        Object.assign({},obj, {$orig: jb.objFromEntries(jb.entries(obj).filter(e=> e[0].indexOf('$') !== 0).map(e=>[e[0],orig[e[0]]])) })
}

})()