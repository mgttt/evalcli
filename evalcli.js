const my_global = {};//don't directly assign global to it coz wrapeval will cleanup global
if(typeof(global)!='undefined'){ for(var k in global){ my_global[k]=global[k]; } }//quick clone
var module_exports = async({
	wrapeval,
	app=my_global.process.env.PWD+'/app',
	prompt='>>> ',
	_console=console,flag_do_prompt=(my_global.process.stdin.setRawMode)?true:false,
}={})=>new Promise((resolve,reject)=>{
	var sandbox_app_class = require(app);
	const readline = require('readline');
	//const wrapeval = require('wrapeval');
	if(!wrapeval) wrapeval = require('wrapeval');
	const sandbox_app_config = {
		//	breakOnSigint:true,
		//	timeout:3000,//TODO
		//	filename:'app',
		wrapeval,
		reload:(module_name)=>{//to reload the $app
			var cache = require.cache;
			if(module_name){
				delete cache[require.resolve(module_name)];
				return require(module_name);
			}else{
				delete cache[require.resolve(app)];
				try{
					sandbox_app_class = require(app);
					sandbox_app = new sandbox_app_class(sandbox_app_config);
					context = sandbox_app;
					//var rt = { context,config:sandbox_app_config};
					var rt = { context };
					if (sandbox_app!=context) rt.app=sandbox_app;
					return rt;
				}catch(ex){
					console.log(ex);
				}
			}
		},
		//env:()=>my_global.process.env,
		my_global,//expost the $app
	};
	var sandbox_app = new sandbox_app_class(sandbox_app_config);
	var context = sandbox_app;
	var outputError=(err)=>{//_console.log('TMP',err);
		//if(err.message || err.code){
		//	var output = {err_message:err.message || ''};
		//	if(err.code!=null) output.err_code = err.code;
		//	//_console.log({err_message:err.message,err_code:err.code});
		//	_console.log(output);
		//}
		_console.log(err.message||'',err.code||'');
		var lines = (''+err.stack).split('\n');
		var f=true;
		for(var i=1;i<lines.length;i++){
			if(f){
				var line=lines[i];
				if(/^\s*at (app|evalmachine|(new Script)|(eval \(eval at <anonymous>))/.test(line)){
					f=false;
				}else
				_console.log(line);
			}
		}
	};
	my_global.process.on('uncaughtException', (ex) => {
		_console.log('Uncaught',ex);
		if(sandbox_app.handleUncaughtException){
			sandbox_app.handleUncaughtException(ex);
		}else{
			my_global.process.exit(ex.code || -1);
		}
	});
	const argv2o=a=>(a||my_global.process.argv||[]).reduce((r,e)=>((m=e.match(/^(\/|--?)([\w-]*)=?"?(.*)"?$/))&&(r[m[2]]=m[3]),r),{});
	var argo = argv2o();
	var ls=[];//lines buffer
	var err_stack;
	//var flag_do_prompt=(my_global.process.stdin.setRawMode)?true:false; // tag interative mode

	var {Writable} = require('stream');
	var output = flag_do_prompt ?  my_global.process.stdout : new Writable();
	var lastScriptResult;
	var fTryExit=false;

	((h,r)=>{r
			.on('SIGINT',()=>{
				if(flag_do_prompt){
					if(fTryExit){
						my_global.process.exit();
					}else{
						fTryExit=true;
						ls=[];
						r.clearLine(my_global.process.out,0);
						_console.log('(To exit, press ^C again or type .exit)')
						r.prompt();
					}
				}
			})
			.on("close",async(x)=>{
				lastScriptResult = await lastScriptResult;
				if(!flag_do_prompt){ //NOTES: dump final result if not interative mode
					if(lastScriptResult) _console.log(lastScriptResult);
				}
				resolve(lastScriptResult);
				my_global.process.exit(x||0);
			})
			.on("line",async(l)=>{
				if(fTryExit) fTryExit=false;
				await h(l,r);//handle (line, readline_instance)
				if(flag_do_prompt) r.prompt();
			});
		if (flag_do_prompt) {
			r.setPrompt(prompt);
			r.prompt();
		}
	})(
		async(l,r)=>{
			ls.push(l);
			try{
				var codes = ls.join('\n');
				var thisScriptResult = wrapeval(codes,context);
				if(flag_do_prompt){
					if(typeof(thisScriptResult)=='function' && /;;\s*$/.test(codes)){
						thisScriptResult=await thisScriptResult();
						if(thisScriptResult) _console.log(thisScriptResult);
					}else{
						_console.log(await thisScriptResult);
						//_console.log(thisScriptResult);
					}
				}
				if(thisScriptResult) lastScriptResult=thisScriptResult;
			}catch(err){
				if(err.name == "SyntaxError"){
					if (['Unexpected end of input','Invalid or unexpected token'].indexOf(err.message)>-1){//ignore open brakets
						return;//skip
					}
					else if ( /after argument list$/.test(err.message) )
					{
						if(err_stack == err.stack){//error occurs again
							err_stack = null;
						}else{
							err_stack = err.stack;
							return;//skip
						}
					}
				}
				outputError(err);
				if(!flag_do_prompt) my_global.process.exit(); 
			}
			ls=[];//quick clear
			//return lastScriptResult;//no use
		},readline.createInterface({input:my_global.process.stdin, output })
	);
});

if(require.main === module){//cli mode
	(async()=>await module_exports())()
}else{//module mode
	module.exports = module_exports;
}
