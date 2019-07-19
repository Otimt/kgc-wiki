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

loopPointList(pointList);

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
	if(type=="html"){
		let $ =  cheerio.load(text,{
			// decodeEntities: false
		});
		//保存css js img
		$ = saveCssJsImgFile({
			$:$,
			orgiHtmlURL:orgiURL,
			htmlFilePathStr:filePathStr
		});
		$('meta[charset]').attr('charset',"utf-8")
		$('body').append('Hello there!');
		let outStr = $.html();
		fs.writeFileSync(filePathStr,outStr,'utf8');
	}else{
		fs.writeFileSync(filePathStr,text,'utf8');
	}
	return filePathStr;
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
		let relaUrl = path.relative(htmlFilePathStr,filePathStr).replace("..\\","")
		console.log( htmlFilePathStr+"内的"+filePathStr+"替换为"+relaUrl )
		$link.attr(linkAttrStr,relaUrl);
		if (!fs.existsSync(filePathStr)){
			var folder = path.dirname(filePathStr);
			createFolderSync(folder);//检查文件夹是否存在
			downloadFile(absURL,filePathStr,()=>{
				console.log(filePathStr+"保存完毕 => " + filePathStr);
			})
		}else{
			console.log(orgHref + " => " + filePathStr+"已存在 => " + filePathStr);
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
	let orgiUrl = url.parse(orgiUrlStr),
		httProtocol = (orgiUrl.protocol == 'https:' ? https : http);
	httProtocol.get( orgiUrlStr, fileGetSuccessHandle);

	function fileGetSuccessHandle(res){
		let text = ''
		res.setEncoding('binary');//这一步不可省略
		res.on('data',function(chunk){
			text += chunk;
		})
		res.on('end',function(){
			console.log('spider_end && do cb');
			var $ = cheerio.load(text);
			var buf = new Buffer(text, 'binary'); //这一步不可省略
			if(/gbk/i.test($('meta[charset]').attr('charset'))){
				var str = iconv.decode(buf, 'GBK'); //将GBK编码的字符转换成utf8的
			}else{//将utf8编码下的binary字符还原为utf8
				var str = iconv.decode(buf,'UTF8');
			}
			endHanddle(orgiUrlStr,str);
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