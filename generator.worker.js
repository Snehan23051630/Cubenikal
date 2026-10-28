import {makeHardLevel} from './difficulty.js';
self.onmessage=({data:{id,size}})=>{
 try{self.postMessage({id,...makeHardLevel(size)});}
 catch(error){self.postMessage({id,error:error.message});}
};
