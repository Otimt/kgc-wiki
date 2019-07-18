let cheerio = require('cheerio');
var request = require('request');
let iconv = require("iconv-lite");
let path = require("path");
let http = require('http');
var https = require('https');
let url = require('url');
let fs = require("fs");
let target = require('./target.js');
let pointList = target.pointList;
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
	let pendingURLQueue = [];
	for(let i=0,il=pointList.length;i<il;i++){
		let pointObj = pointList[i];
		let urlList = pointObj.urlList;
		for(let j=0,jl=urlList.length;j<jl;j++){
			let urlObj = urlList[j];
			let orgiURL = urlObj.orgiURL;
			let pendingURLObj = {
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
		let pendingURLObj = pendingURLQueue.shift();
		getTextByUrl(pendingURLObj.orgiURL,function(orgiURL,text){
			console.log("执行完毕");
			//文件夹
			saveFileByUrl(orgiURL,"html",text);
			processQueue(pendingURLQueue);
		});
	}
}

function countPathByUrl(orgiURL, type) {
	let urlTextArr = orgiURL.replace("http://", "").replace("https://", "").split("/");
	//文件名
	let fileName = urlTextArr.pop().replace(/\?.*$/,"");
	let regex = new RegExp("\." + type + "$");
	if (type!="img" &&  !fileName.match(regex)){
		fileName += "."+type;
	}
	console.log(orgiURL+"准备创建文件，文件名："+fileName)
	let domainStr = urlTextArr.shift();//域名
	let folder = "../files/" + domainStr + "/" + type + "/" + urlTextArr.join("/");

	let filePathStr = folder + "/" + fileName;
	return filePathStr;
}
/**
 * 根据url保存文件，文件名为网站原路由 最后一段
 * @param orgiURL
 * @param text
 */
function saveFileByUrl(orgiURL,type,text){
	var filePathStr = countPathByUrl(orgiURL, type);
    var folder = path.dirname(filePathStr);

	createFolderSync(folder);//检查文件夹是否存在
	//todo gbk 转码 utf-8
	let decodeText = transcodingToUtf8(text);
	if(type=="html"){
		let $ =  cheerio.load(text);

		//保存css js img
		$ = saveCssJsImgFile({
			$:$,
			orgiHtmlURL:orgiURL,
			htmlFilePathStr:filePathStr
		});
		$('body').append('Hello there!');
		fs.writeFileSync(filePathStr,$.html());
	}else{
		fs.writeFileSync(filePathStr,text);
	}
	return filePathStr;
}
/**
 * gbk 转码 utf-8
 * @param text
 * @returns {*}
 */
function transcodingToUtf8(text){
	// 把数组转换为gbk中文
	var texts = iconv.decode(text, 'utf-8');
	return texts;
}



/**
 * 保存css 文件,并替换link中链接
 * @param $
 * @param orgiHtmlURL
 */
function saveCssJsImgFile({$,orgiHtmlURL,htmlFilePathStr}){
	let $linkList = $("link[rel='stylesheet'],img,script[src]");

	let from = url.parse(orgiHtmlURL),
		htmlFileDir = path.basename(htmlFilePathStr)
	for(let i=0,il=$linkList.length;i<il;i++){
		let $link = $linkList.eq(i),
			type,linkAttrStr;
		//取得原始路径
		var label = $link[0].tagName.toLowerCase();
		console.log( label )
        if(label == "link" ){
			type = "css";
			linkAttrStr = "href";
		}else if(label == "img" ){
			type = "img";
			linkAttrStr = "src";
		}else{
			type = "js";
			linkAttrStr = "src";
		}
		let orgHref = $link.attr(linkAttrStr);
		let absURL = from.resolve(orgHref);//转化为绝对路径
		let filePathStr = countPathByUrl(absURL, type);//文件保存地址
		if (!fs.existsSync(filePathStr)){
			let relaUrl = path.relative(htmlFilePathStr,filePathStr).replace("..\\","")
			console.log( htmlFilePathStr+"内的"+filePathStr+"替换为"+relaUrl )
			$link.attr(linkAttrStr,relaUrl);
			var folder = path.dirname(filePathStr);
			createFolderSync(folder);//检查文件夹是否存在
			downloadFile(absURL,filePathStr,()=>{
				console.log(filePathStr+"保存完毕");
			})
			console.log(orgHref + " => " + filePathStr);
		}else{
			console.log(orgHref + " => " + filePathStr+"已存在");
		}

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
 * @param orgiUrlStr
 * @param endHanddle
 */
function getTextByUrl(orgiUrlStr, endHanddle){
	console.log("正在加载"+orgiUrlStr);
	let orgiUrl = url.parse(orgiUrlStr),
		httProtocol = (orgiUrl.protocol == 'https:' ? https : http);
	httProtocol.get( orgiUrlStr, fileGetSuccessHandle);

	function fileGetSuccessHandle(res){
		let text = ''
		res.on('data',function(chunk){
			text += chunk;
		})
		res.on('end',function(){
			console.log('spider_end && do cb');
			// console.log(d);
			endHanddle(orgiUrlStr,text);
		})
	}
}

/*
 * url 网络文件地址
 * @filename 文件名
 * @callback 回调函数
 */
function downloadFile(uri,filename,callback){
	var stream = fs.createWriteStream(filename);
	request(uri).pipe(stream).on('close', callback);
}