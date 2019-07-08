var url  = require('url');
var from = "https://www.cnblogs.com/chunlei36/p/6443645.html";

from = url.parse(from);
console.log(url)

console.log( from.resolve("./aaa") )
console.log( from.resolve("/aaa") )
console.log( from.resolve("http://aaa.com") )

console.log( from.host,from.hostname,from.hash )
console.log( from )

// protocol: 'https:',
// slashes: true,
// auth: null,
// host: 'www.cnblogs.com',
// port: null,
// hostname: 'www.cnblogs.com',
// hash: null,
// search: null,
// query: null,
// pathname: '/chunlei36/p/6443645.html',
// path: '/chunlei36/p/6443645.html',
// href: 'https://www.cnblogs.com/chunlei36/p/6443645.html'

// Url: [Function: Url],网址：[功能：网址]，
// parse: [Function: urlParse],解析：[功能：urlParse]，
// resolve: [Function: urlResolve],解决：[功能：urlResolve]，
// resolveObject: [Function: urlResolveObject],resolveObject：[Function：urlResolveObject]，
// format: [Function: urlFormat],格式：[功能：urlFormat]，
// URL: [Function: URL],网址：[功能：网址]，
// URLSearchParams: [Function: URLSearchParams],URLSearchParams：[功能：URLSearchParams]，
// domainToASCII: [Function: domainToASCII],domainToASCII：[功能：domainToASCII]，
// domainToUnicode: [Function: domainToUnicode] }domainToUnicode：[功能：domainToUnicode]}

// console.log(path.dirname(from))
// console.log(path.basename(from))
// var dirname = path.dirname(from);
// var basename = path.basename(from);
// var p1 = path.resolve(dirname,'../oncedir')
//
// // resolve: [Function: resolve],解决：[功能：解决]，
// // normalize: [Function: normalize],标准化：[功能：标准化]，
// // isAbsolute: [Function: isAbsolute],isAbsolute：[功能：isAbsolute]，
// // join: [Function: join],加入：[功能：加入]，
// // relative: [Function: relative],相对：[功能：亲戚]，
// // toNamespacedPath: [Function: toNamespacedPath],toNamespacedPath：[Function：toNamespacedPath]，
// // dirname: [Function: dirname],Dirname：[功能：dirname]，
// // basename: [Function: basename],Basename：[功能：basename]，
// // extname: [Function: extname],Extname：[功能：extname]，
// // format: [Function: format],格式：[功能：格式]，
// // parse: [Function: parse],解析：[功能：解析]，
// // sep: '\\',九月：'\\'，
// // delimiter: ';',分隔符：';'，
// // win32: [Circular],Win32：[通告]，
// console.log(path)
// console.log(path.isAbsolute(from))
//
// console.log(p1)

