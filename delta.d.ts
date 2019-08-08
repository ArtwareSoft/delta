type param = {
	id: string,
	type?: tgpTypeStr,
	as?: 'string' | 'boolean' | 'number',
	defaultValue?: any,
	essential?: boolean,
	dynamic?: boolean,
}
type profiles = {
	join(separator: dataType) : with_delta_supportType,
	deltaTest({transformation: with_delta_supportType,initialData: dataType,delta: dataType,expectedDeltaOutput: dataType,expectedCounters: dataType,cleanUp: actionType}) : testType,
}

type jbObj = {
	component(id: string, componentDef: cmpDef) : void,
	comps: [cmpDef],
	profiles: profiles
}
type ctx = {
	setVars({any}) : ctx,
	setData(any) : ctx,
	run(profile: profile): any,
	exp(exp: string) : any,
}
declare var jb: jbObj;




// type with-delta-support
type with_delta_supportType = joinPT | selectPT | accumulate_sumPT | countPT | with_delta_supportPT | mapValuesPT | chainPT | filterPT | ((ctx: ctx) => any)
type cmp_def_with_delta_supportType = {
	type: 'with_delta_support',
	params?: [param],
	impl: with_delta_supportType,
}
type joinPT = {$: 'join', separator: dataType}
type selectPT = {$: 'select', path: dataType}
type accumulate_sumPT = {$: 'accumulate-sum', resultProp: dataType,toAdd: dataType,startValue: dataType}
type countPT = {$: 'count', }
type with_delta_supportPT = {$: 'with-delta-support', noDeltaTransform: dataType,update: dataType,splice: dataType,inputToCache: dataType}
type mapValuesPT = {$: 'mapValues', map: dataType}
type chainPT = {$: 'chain', items: [dataType]}
type filterPT = {$: 'filter', exp: dataType}

// type test
type testType = delta_testPT | ((ctx: ctx) => any)
type cmp_def_testType = {
	type: 'test',
	params?: [param],
	impl: testType,
}
type delta_testPT = {$: 'delta-test', transformation: with_delta_supportType,initialData: dataType,delta: dataType,expectedDeltaOutput: dataType,expectedCounters: dataType,cleanUp: actionType}
type cmpDef = cmp_def_with_delta_supportType | cmp_def_testType