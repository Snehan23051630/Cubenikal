import {makeHardLevel} from '../difficulty.js';
import {LEVEL_SIZES} from '../levels.js';
const sizes=process.argv.length>2?process.argv.slice(2).map(Number):LEVEL_SIZES;
for(const size of sizes){
 const started=performance.now();
 const {analysis}=makeHardLevel(size);
 console.log(JSON.stringify({size,blocks:size**3,...analysis,generationMs:Math.round(performance.now()-started)}));
}
