module.exports = function(sandbox_config){
	return {
		help:()=>`find ur way out~`,
		//my_global:()=>sandbox_config.my_global,
		env:()=>sandbox_config.my_global.env,
		reload:()=>sandbox_config.reload(),
		//setInterval:sandbox_config.my_global.setInterval,
		setTimeout:sandbox_config.my_global.setTimeout,
	}
}
