var cheerio = require('cheerio');
var iconv = require("iconv-lite");
var path = require("path");
var http = require('http');
var url = require('url');
var fs = require("fs");
var target = require('./target.js');
var pointList = target.pointList;
console.log(target);

loopPointList(pointList);

// {
// 	pointIndex:0,
// 	urlIndex:0,
// 	url:"balabala"
// }

/**
 * 遍历 知识点数组，生成待处理队列
 * @param pointList
 */
function loopPointList(pointList){
	var pendingURLQueue = [];
	for(var i=0,il=pointList.length;i<il;i++){
		var pointObj = pointList[i];
		var urlList = pointObj.urlList;
		for(var j=0,jl=urlList.length;j<jl;j++){
			var urlObj = urlList[j];
			var orgiURL = urlObj.orgiURL;
			var pendingURLObj = {
				pointIndex:i,
				urlIndex:j,
				orgiURL:orgiURL,
			};
			pendingURLQueue.push(pendingURLObj);
		}
	}
	processQueue(pendingURLQueue);
}

/**
 * 处理队列
 * @param pendingURLQueue
 */
function processQueue(pendingURLQueue){
	if(pendingURLQueue.length > 0){
		console.log("正在处理队列,pendingURLQueue长度："+pendingURLQueue.length);
		var pendingURLObj = pendingURLQueue.shift();
		getTextByUrl(pendingURLObj.orgiURL,function(orgiURL,text){
			console.log("执行完毕");
			//文件夹
			saveFileByUrl(orgiURL,"html",text);
			processQueue(pendingURLQueue);
		});
	}
}

/**
 * 根据url保存文件，文件名为网站原路由 最后一段
 * @param orgiURL
 * @param text
 */
function saveFileByUrl(orgiURL,type,text){

	var urlTextArr = orgiURL.replace("http://", "").replace("https://", "").split("/");
	//文件名
	var fileName = urlTextArr.pop();
	if(!fileName.match(/\.html$/)){
		fileName += "."+type;
		console.log("准备创建文件，文件名："+fileName)
	}
	var domainStr = urlTextArr.shift();//域名
	var folder = "../files/" + domainStr + "/" + type + "/" +urlTextArr.join("/");

	var filePath = folder+"/"+fileName;
	if (true){
	// if (!fs.existsSync(filePath)){
		console.log(filePath+"文件不存在，写入");
		createFolderSync(folder);
		//todo gbk 转码 utf-8
		var decodeText = transcodingToUtf8(text);
		if(type=="html"){
			var $ =  cheerio.load(text);

			//todo 保存css
			$ = saveCssFile($,orgiURL);
			$('body').append('Hello there!');
			fs.writeFileSync(filePath,$.html());
		}else{
			fs.writeFileSync(filePath,text);
		}
	}else{
		console.log(filePath+"文件已存在");
	}
}
/**
 * gbk 转码 utf-8
 * @param text
 * @returns {*}
 */
function transcodingToUtf8(text){
	return text;
}



/**
 * 保存css 文件,并替换link中链接
 * @param $
 * @param orgiHtmlURL
 */
function saveCssFile($,orgiHtmlURL){
	// let linkReg = /<link.*?>/g;
	// let imgReg = /<image.*?>/g;
	// let scriptReg = /<script.*?>/g;
	// let styleReg = /<style.*?>.*?<\/style>/g;



	let $linkList = $("link[type='text/css']");
	let from = url.parse(orgiHtmlURL);
	for(var i=0,il=$linkList.length;i<il;i++){
		var $link = $linkList.eq(i);
		var orgHref = $link.attr("href");
		let orgiURL = from.resolve(orgHref);
		getTextByUrl(orgiURL,function(orgiURL,text){
			console.log("css获取完毕");
			//文件夹
			saveFileByUrl(orgiURL,"css",text);
		});
	// 	var newHref = "";
	// 	if(orgHref.indexOf("/") == 0){
	// 		newHref = orgiURL.spilt("/").slice(0,4).join("/") + orgHref;
	// 	}else if(orgHref.indexOf("http")){
	// 		newHref = orgHref
	// 	}else{
	// 		newHref = orgHref
	// 	}
	// 	console.log(orgHref + " => " + newHref);
		console.log(orgHref + " => ");
	}
	return $;
}


//通用工具方法======================================================================================================================================
/**
 * 递归创建目录 同步方法
 */
function createFolderSync(dirname) {
	if (fs.existsSync(dirname)) {
		return true;
	} else {
		if (createFolderSync(path.dirname(dirname))) {
			fs.mkdirSync(dirname);
			return true;
		}
	}
}
/**
 * 加载远程文本
 * @param orgiURL
 * @param endHanddle
 */
function getTextByUrl(orgiURL, endHanddle){
	console.log("正在加载"+orgiURL);
	http.get( url.parse(orgiURL), function(res){
		var text = ''
		res.on('data',function(chunk){
			text += chunk;
		})
		res.on('end',function(){
			console.log('spider_end && do cb');
			// console.log(d);
			endHanddle(orgiURL,text);
		})
	});
}