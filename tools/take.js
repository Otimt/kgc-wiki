let cheerio = require('cheerio');
let iconv = require("iconv-lite");
let path = require("path");
let http = require('http');
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
	let fileName = urlTextArr.pop();
	let regex = new RegExp("\." + type + "$");
	if (!fileName.match(regex)){
            fileName += "."+type;
            console.log("准备创建文件，文件名："+fileName)
        }
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
	if (true){
	// if (!fs.existsSync(filePath)){
		console.log(filePathStr+"文件不存在，写入");
		createFolderSync(folder);
		//todo gbk 转码 utf-8
		let decodeText = transcodingToUtf8(text);
		if(type=="html"){
			let $ =  cheerio.load(text);

			//todo 保存css
			$ = saveCssFile($,orgiURL);
			$('body').append('Hello there!');
			fs.writeFileSync(filePathStr,$.html());
		}else{
			fs.writeFileSync(filePathStr,text);
		}
	}else{
		console.log(filePathStr+"文件已存在");
	}
	return filePathStr;
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

	let fileReplaceList = [];

	let $linkList = $("link[rel='stylesheet']");
	let $imgList = $("img");
	let $jsList = $("link[rel='stylesheet']");
	// let $styleImgList = $("link[rel='stylesheet']");

	let fileMap = new Map();


	let from = url.parse(orgiHtmlURL);
	for(let i=0,il=$linkList.length;i<il;i++){
		let $link = $linkList.eq(i);
		let orgHref = $link.attr("href");//原始路径
		let absURL = from.resolve(orgHref);//转化为绝对路径
		let filePathStr = countPathByUrl(absURL, "css");//文件保存地址
		let obj = {};
		obj[orgHref] = filePathStr;
		fileReplaceList.push(obj);
		getTextByUrl(absURL,function(orgiURL,text){
			console.log("css获取完毕");
			//文件夹
			var filePath = saveFileByUrl(orgiURL,"css",text);
		});
	// 	let newHref = "";
	// 	if(orgHref.indexOf("/") == 0){
	// 		newHref = orgiURL.spilt("/").slice(0,4).join("/") + orgHref;
	// 	}else if(orgHref.indexOf("http")){
	// 		newHref = orgHref
	// 	}else{
	// 		newHref = orgHref
	// 	}
	// 	console.log(orgHref + " => " + newHref);
		console.log(orgHref + " => " + filePathStr);
	}
	console.log(fileReplaceList)
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
		let text = ''
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