var p4web = require('../../p4web');
module.exports = function(sandbox_config){
	return {
		help:()=>`find ur way out~`,
		//my_global:()=>sandbox_config.my_global,
		env:()=>sandbox_config.my_global.env,
		reload:()=>sandbox_config.reload(),
		//setInterval:sandbox_config.my_global.setInterval,
		setTimeout:sandbox_config.my_global.setTimeout,
		//real_global:()=>require('rawglobal'),
		web:p4web({cookie_pack:'test'}).web1_p,
		p4web,
		exec:(command,options,callback)=>{
			var rst=exec(command||'', options||{}, (error, stdout, stderr) => {
				if (callback){
					callback(error,stdout,stderr);
				}else{
					if (error) { console.error(`exec error: ${error}`); return; }
					if (stdout) console.log(`stdout: ${stdout}`);
					if (stderr) console.error(`stderr: ${stderr}`);
				}
			});
		},
		global:()=>rawglobal,
	}
}
