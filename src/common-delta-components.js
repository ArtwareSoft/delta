(function() {
const {asDarray} = jb.delta

jb.component('join', {
    multiplicty: 'manyToOne',
    params: [
        {id: 'separator', as: 'string'}
    ],
    impl: ({data},separator) => (Array.isArray(data) ? data :  jb.entries(data).map(e=>e[1])).join(separator)
})

jb.component('inc.join', {
    derivationOf: 'join',
    type: 'incremental',
    impl :{$: 'inc.delta-with-cache',
        $vars: {
           separator: ({},{transformationFunc}) => jb.propOfProfile(transformationFunc.profile,'separator')
        },
        inputToCache :{$chain: [ 
                { $mapValues: ({data}) => ({length: data.length}) }, 
                { $: 'accumulate-sum', resultProp: 'posOfNext', toAdd: ({data}, {separator}) => data.length + separator.length }
        ]},
        splice: ({data},{cache, separator}) => {
            const delta = data;
            const from = delta.$splice.from ? cache[delta.$splice.from-1].posOfNext : 0;
            const push = delta.$splice.from === cache.length
            const itemsToRemove = cache.slice(delta.$splice.from, delta.$splice.from + delta.$splice.itemsToRemove).reduce((sum,item) => sum + item.length + separator.length, 0-separator.length)
            const toAdd = (push ? separator : '') + delta.$splice.toAdd.join(separator)
            return { $splice: {from, itemsToRemove, toAdd } }
        },
        update: ({data},{cache}) => Object.keys(data).filter(x=>x!='$orig').sort().reverse().map(id=>
                    ({ $splice: {from: cache[id-1] ? cache[id-1].posOfNext : 0, itemsToRemove: cache[id].length, toAdd: data[id] } })
                )
    },
})

function select(obj, path) {
    if (path.length == 0)
        return obj
    if (path[0] === '*')
        return  jb.objFromEntries(jb.entries(obj).map(e=>[e[0], select(e[1], path.slice(1))]))
    return { [path[0]]: select(obj[path[0]], path.slice(1)) }
}

function filterDeltaPropsByPath(obj, path) {
    if (path.length == 0 || obj == null)
        return obj
    const resEntries = path[0] === '*' 
        ? jb.entries(obj).filter(e => e[0] !== '$orig').map(e=>[e[0], filterDeltaPropsByPath(e[1], path.slice(1))])
        : obj[path[0]] ? [[path[0], filterDeltaPropsByPath(obj[path[0]], path.slice(1)) ]] : []

    const orig = obj.$orig ? [['$orig', filterDeltaPropsByPath(obj.$orig, path)]] : []
    return jb.objFromEntries(resEntries.concat(orig))
}

jb.component('select', {
    multiplicty: 'oneToMany',
    params: [
        {id: 'path', as: 'string'}
    ],
    impl: ({data},path) => select(data,path.split('/'))
})

jb.component('inc.select', {
    derivationOf: 'select',
    type: 'incremental',
    impl :{$: 'inc.delta-without-cache',
        $vars: {
            selectPath: ({},{transformationFunc}) => jb.propOfProfile(transformationFunc.profile,'path').split('/')
        },
        update: ({data},{selectPath}) => filterDeltaPropsByPath(data,selectPath)
    },
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
        update: (ctx, {transformationFunc}) => {
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

})()