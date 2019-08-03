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
type incrementalType = inc_joinPT | inc_selectPT | inc_accumulate_sumPT | inc_delta_with_cachePT | inc_delta_without_cachePT | inc_chainPT | inc_mapValuesPT | inc_filterPT | ((ctx: ctx) => any)
type cmp_def_incrementalType = {
	type: 'incremental',
	params?: [param],
	impl: incrementalType,
}
type inc_joinPT = {$: 'inc.join', }
type inc_selectPT = {$: 'inc.select', }
type inc_accumulate_sumPT = {$: 'inc.accumulate-sum', }
type inc_delta_with_cachePT = {$: 'inc.delta-with-cache', init: dataType,update: dataType,splice: dataType,inputToCache: dataType}
type inc_delta_without_cachePT = {$: 'inc.delta-without-cache', update: dataType,splice: dataType}
type inc_chainPT = {$: 'inc.chain', }
type inc_mapValuesPT = {$: 'inc.mapValues', }
type inc_filterPT = {$: 'inc.filter', }

// type data
type dataType = joinPT | selectPT | accumulate_sumPT | chainPT | mapValuesPT | filterPT | delta_select_outsidePT | delta_select_insidePT | delta_select_*PT | delta_map_valuesPT | delta_chain_no_cachePT | delta_accumulate_sumPT | delta_chain_with_cachePT | delta_join_change_elemPT | delta_join_pushPT | delta_join_splicePT | delta_join_splice2PT | delta_join_splice_beginPT | delta_join_splice_begin2PT | ((ctx: ctx) => any)
type cmp_def_dataType = {
	type: 'data',
	params?: [param],
	impl: dataType,
}
type joinPT = {$: 'join', separator: dataType}
type selectPT = {$: 'select', path: dataType}
type accumulate_sumPT = {$: 'accumulate-sum', resultProp: dataType,startValue: dataType,
/** can use vars: item */toAdd: dataType}
type chainPT = {$: 'chain', items: [dataType]}
type mapValuesPT = {$: 'mapValues', map: dataType}
type filterPT = {$: 'filter', exp: dataType}
type delta_select_outsidePT = {$: 'delta-select-outside', }
type delta_select_insidePT = {$: 'delta-select-inside', }
type delta_select_*PT = {$: 'delta-select-*', }
type delta_map_valuesPT = {$: 'delta-map-values', }
type delta_chain_no_cachePT = {$: 'delta-chain-no-cache', }
type delta_accumulate_sumPT = {$: 'delta-accumulate-sum', }
type delta_chain_with_cachePT = {$: 'delta-chain-with-cache', }
type delta_join_change_elemPT = {$: 'delta-join-change-elem', }
type delta_join_pushPT = {$: 'delta-join-push', }
type delta_join_splicePT = {$: 'delta-join-splice', }
type delta_join_splice2PT = {$: 'delta-join-splice2', }
type delta_join_splice_beginPT = {$: 'delta-join-splice-begin', }
type delta_join_splice_begin2PT = {$: 'delta-join-splice-begin2', }

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
type delta_testPT = {$: 'delta-test', calculate: dataType,initialData: dataType,delta: dataType,expectedDeltaOutput: dataType,expectedCounters: dataType,cleanUp: actionType}
type cmpDef = cmp_def_incrementalType | cmp_def_dataType | cmp_def_aggregatorType | cmp_def_booleanType | cmp_def_testType