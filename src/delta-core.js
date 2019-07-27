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
    linearAcc: (delta, val) =>
        jb.objFromEntries(jb.entries(val).map(e=> e[0] < delta.$linearAcc.after ? e : [e[0], applyDelta(e[1], delta.$linearAcc.delta)]))
}

// apply the redux way
function applyDelta(val,delta) {
    if (delta === undefined) return
    if (val === undefined && delta && typeof delta === 'object')
        val = {}
    const op = Object.keys(delta_ops).filter(k => delta['$'+k] )[0];
    if (op)
        return delta_ops[op](delta,val)
    
    if (typeof delta === 'object') {
        const toMerge = jb.entries(delta).filter(e=>e[0] !== '$orig').map(e=>[e[0], applyDelta(val[e[0]], delta[e[0]])])
        return Object.assign({}, val, jb.objFromEntries(toMerge))
    }
    return delta; // primitive without op
}

function processDeltas(dInputs,deltaToDelta, ctx) {
    // TODO: merge and sort deltas
    return jb.toarray(dInputs).reduce((dOutput,delta) => [...dOutput, ...jb.toarray(deltaToDelta(ctx.setData(delta)))], [])
}

jb.delta = {
    Derive: (profile,ctx) => ({
        delta(...args) {
            this._deltaObj = this._deltaObj || ctx.setVars({transformationFunc: {profile,ctx}}).run(Object.assign({},profile, {$: `inc.${jb.compName(profile)}` }))
            return this._deltaObj.delta(...args)
        },
    }),
    processDeltas,
    applyDeltas: (input, deltas) => jb.toarray(deltas).reduce( (res, delta) => res = applyDelta(res, delta) , input),
    enrichWithOrig: (obj,orig) => // todo: recursive
        Object.assign({},obj, {$orig: jb.objFromEntries(jb.entries(obj).filter(e=> e[0].indexOf('$') !== 0).map(e=>[e[0],orig[e[0]]])) })
}

})()