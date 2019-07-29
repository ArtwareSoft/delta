type param = {
	id: string,
	type?: tgpTypeStr,
	as?: 'string' | 'boolean' | 'number',
	defaultValue?: any,
	essential?: boolean,
	dynamic?: boolean,
}
type jbObj = {
	component(id: string, componentDef: cmpDef) : void,
	comps: [cmpDef]
}
type ctx = {
	setVars({any}) : ctx,
	setData(any) : ctx,
	run(profile: profile): any,
	exp(exp: string) : any,
}
declare var jb: jbObj;



// type incremental
type incrementalType = inc_delta_with_cachePT | inc_delta_without_cachePT | inc_chainPT | inc_mapValuesPT | inc_accumulate_sumPT | inc_joinPT | ((ctx: ctx) => any)
type cmp_def_incrementalType = {
	type: 'incremental',
	params?: [param],
	impl: incrementalType,
}
type inc_delta_with_cachePT = {$: 'inc.delta-with-cache', delta2deltas: dataType,inputToCache: dataType,vars: asIsType}
type inc_delta_without_cachePT = {$: 'inc.delta-without-cache', delta2deltas: dataType}
type inc_chainPT = {$: 'inc.chain', }
type inc_mapValuesPT = {$: 'inc.mapValues', }
type inc_accumulate_sumPT = {$: 'inc.accumulate-sum', }
type inc_joinPT = {$: 'inc.join', }

// type data
type dataType = chainPT | mapValuesPT | accumulate_sumPT | joinPT | delta_map_valuesPT | delta_chain_no_cachePT | delta_accumulate_sumPT | delta_chain_with_cachePT | delta_joinPT | ((ctx: ctx) => any)
type cmp_def_dataType = {
	type: 'data',
	params?: [param],
	impl: dataType,
}
type chainPT = {$: 'chain', items: [dataType]}
type mapValuesPT = {$: 'mapValues', map: dataType}
type accumulate_sumPT = {$: 'accumulate-sum', resultProp: dataType,startValue: dataType,
/** can use vars: item */toAdd: dataType}
type joinPT = {$: 'join', separator: dataType}
type delta_map_valuesPT = {$: 'delta-map-values', }
type delta_chain_no_cachePT = {$: 'delta-chain-no-cache', }
type delta_accumulate_sumPT = {$: 'delta-accumulate-sum', }
type delta_chain_with_cachePT = {$: 'delta-chain-with-cache', }
type delta_joinPT = {$: 'delta-join', }

// type aggregator
type aggregatorType =  | ((ctx: ctx) => any)
type cmp_def_aggregatorType = {
	type: 'aggregator',
	params?: [param],
	impl: aggregatorType,
}

// type boolean
type booleanType =  | ((ctx: ctx) => any)
type cmp_def_booleanType = {
	type: 'boolean',
	params?: [param],
	impl: booleanType,
}

// type test
type testType = delta_testPT | ((ctx: ctx) => any)
type cmp_def_testType = {
	type: 'test',
	params?: [param],
	impl: testType,
}
type delta_testPT = {$: 'delta-test', calculate: dataType,initialData: dataType,delta: dataType,cleanUp: actionType,expectedCounters: dataType}
type cmpDef = cmp_def_incrementalType | cmp_def_dataType | cmp_def_aggregatorType | cmp_def_booleanType | cmp_def_testType