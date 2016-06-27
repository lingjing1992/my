/**
 * Created by Administrator on 2016/6/11.
 */
(function(window,undefined){
    //Jerry构造函数
    function Jerry(selector){
        return new Jerry.fn.init(selector);//返回一个jquery实例对象
    }
    //Jerry原型对象
    Jerry.fn = Jerry.prototype ={
        init:function(selector){
            //选择器
            if(Jerry.isString(selector)) {
                //创建节点
                if (selector.charAt(0) === '<') {
                    [].push.apply(this,Jerry.parseHTML(selector));
                }else{
                    this.selector = selector;  //Jerry实例添加selector属性，用于判断是否是Jerry对象
                    [].push.apply(this,Jerry.select(selector));
                }
                return this;//返回jQuery对象// 是为了遍历，实现链式操作，因为each方法位于Jerry原型上
            }
            if(Jerry.isJerry(selector)){
                return selector;
            }
            if(Jerry.isDom(selector)){
                this[0]=selector;
                selector.length=1; //Jerry实例是一个类数组，具有length属性
                return this;
            }
            if(Jerry.isArrayLike(selector)){
                [].push.apply(this,selector); //把类数组转化为数组
                return this;
            }
        },
    }
    //在Jerry和Jerry的原型上扩展成员
    Jerry.extend = Jerry.fn.extend = function(o1,o2){
        var p =arguments;
        if(p.length===1){
            for(var key in p[0]){   //for in 循环会把原型上的属性也遍历出来
                this[key]=p[0][key];
            }
        }else if(p.length===2){
            for(var key in o2){
                o1[key]=o2[key];
            }
        }
    }
    //在Jerry对象上（构造函数）扩展模块
    Jerry.extend({
        select : function(selector){
            var result =[];
            var firstChar = selector.charAt(0);
            switch(firstChar){
                case '#':
                    //借用result的push方法，this指向result
                    result.push.call(result,document.getElementById(selector.slice(1)));
                    break;
                case '.':
                    if(document.getElementsByClassName){
                        //当数据为类数组时，因为没有数组操作的api，必须使用apply调用。apply可以把类数组（关联数组）转为数组，
                        result.push.apply(result,document.getElementsByClassName(selector.slice(1)));
                    }else{
                        var allEles=document.getElementsByTagName('*');
                        for(var i=0;i<allEles.length;i++){
                            var arr =allEles[i].className.split(/\s+/);
                            for(var j=0;j<arr.length;j++){
                                if(arr[j] == selector.slice(1)){
                                    result.push(allEles[i]);
                                    break;
                                }
                            }
                        }
                    }
                    break;
                default :
                    result.push.apply(result,document.getElementsByTagName(selector));
                    break;
            }
            return result;
        },
        each : function(arr,fn){
            for(var i=0;i<arr.length;i++){
                //改变this指向的目的：指向arr里的每一个元素，在调用each()的时候，就可以使用this了,
                // 比如 $.each('div'，function(i,ele){},如果不改变this指向,this指向$本身，函数内部不能使用this，
                //如果改变this指向，指向每一个div元素，就可以在函数内部使用this了。
                if(fn.call(arr[i],i,arr[i]) === false){
                    break;
                }
            }
            return arr;
        },
        trim : function(str){
            return str.replace(/(^\s+)|(\s+$)/g,'');  //去字符串里掉空格
        },
        parseHTML : function(html){
            var result = [];
            var div = document.createElement('div');
            div.innerHTML = html;
            for(var i= 0;i<div.childNodes.length;i++){
                result.push(div.childNodes[i]);
            }
            return result;
        },
        ajax : function(param){
            //设置默认值
            var deaults = {
                type: 'get',
                asyns: true,
                url: '#',
                dateType : 'json',
                jsonp : 'callback',
                success : function(data){
                    console.log(data);
                },
                error : function(data){
                    console.log(data);
                }
            }
            //传入的参数替换默认值
            Jerry.extend(deaults,param);
            //AJAX请求还是jsonp跨域请求
            if(deaults.dateType === 'json'){
                jsonFn(deaults);
            }else if(deaults.dateType === 'jsonp'){
                jsonpFn(deaults);
            }
            //ajax请求方法
            function jsonFn(p){
                var xhr = null;
                // 1、兼容创建XMLHttpRequest对象
                if(window.XMLHttpRequest){
                    xhr = new XMLHttpRequest();
                }else{
                    xhr = new ActiveXObject();
                }
                //处理需要发送的数据
                var param ='';
                if(p.data){
                   for(var key in p.data){  //遍历data数据，
                       param += key + '=' + p.data[key]+'&';
                   }
                }
                if(param){
                    param = param.slice(0,param.length-1); //截取最后一个&字符
                }
                if(p.type === 'get'){
                    p.url += '?'+param;
                    param = null;
                }
                if(p.type === 'post'){
                    //post设置请求头信息
                    xhr.setRequestHeader('Content-Type','application/x-www-form-urlencoded')
                }
                // 2、设置请求（type,url,asyns）
                xhr.open(p.type,p.url, p.asyns);
                // 3、准备发送
                xhr.send(param);
                // 4、监听响应状态
                xhr.onreadystatechange =function(){
                    //获取响应头信息
                    var ret = xhr.responseText;
                    //把字符串转化为JSON对象
                    ret = JSON.parse(ret);
                    //响应完成并数据响应正常
                    if(xhr.readyState ===4 && xhr.status == 200){
                        p.success(ret);
                    }else{
                        p.error(ret);
                    }
                }
            }
            //jsonp请求方法
            function jsonpFn(p){
                //自定义回调函数名字
                var cbName = 'jQuery' + ('1.11.1'+Math.random()).replace(/\D+/g,'')+'_'+Date.now();
                if(p.jsonpCallback){
                     cbName = p.jsonpCallback;
                }
                //回调函数，向window加一个方法
                window[cbName] = function(data){
                    p.success(data);
                }
                //处理传递的数据
                var param = '';
                if(p.data){
                    for(var key in p.data){
                        param += key + '=' + p.data[key]+'&';
                    }
                }
                if(param){
                    param = param.slice(0,param.length-1);
                }
                //jsonp实质，动态添加script标签
                var script = document.createElement('script');
                //设置url
                script.src= p.url + '?' + p.jsonp + '=' + cbName + '&'+param;
                var head = document.getElementsByTagName('head')[0];
                head.appendChild(script);
            }
        },
    });
    //类型判断
    Jerry.extend({
        isString : function(str){
            return typeof str === 'string';
        },
        isDom : function(dom){
            return dom.nodeType === 1;
        },
        isJerry : function(obj){
            return 'selector' in obj;
        },
        isArray : function(arr){
            return Object.prototype.toString.call(arr) === '[object Array]';
            //return arr instanceof Array; //'[object Array]'
        },
        isRegExp : function(reg){
            return Object.prototype.toString.call(reg) === '[object RegExp]';
        },
        isFunction : function(fn){
            return fn instanceof Function; //'function'
        },
        isObj : function(obj){
            return Object.prototype.toString.call(obj) === '[object Object]';
            //return obj instanceof Object; //'object'
        },
        //判断是否是关联数组
        isArrayLike : function(arr){
            return arr && arr.length && arr.length>0;
        },
    })
    //在Jerry原型对象上扩展模块
    Jerry.fn.extend({
        each : function(fn) {
            return Jerry.each(this,fn);//this==arr[i],要遍历的每一个元素
        },
        append : function(html){
            Jerry(html).appendTo(this);
            return this;
        },
        prepend : function(html){
            Jerry(html).prependTo(this);
            return this;
        },
        prependTo : function(param){
            var origins = this;
            var targets = Jerry(param);
            var nodes = [];
            var node =null;
            for(var i =0 ;i < targets.length;i++){
                var tar = targets[i]; //每一个目标元素
                for(var j =0 ;j < origins.length;j++){
                    if(targets.length-1 ===i){  //最后一个目标元素
                        node = origins[j];
                    }else{
                        node = origins[j].cloneNode(true);
                        nodes.push(node); //把克隆的元素缓存起来
                    }
                    tar.insertBefore(node,tar.firstChild); //把元素添加到每一目标元素的前面
                }
            }
            [].push.call(this,nodes);
            return this;
        },
        appendTo : function(param){
            //$（‘div’）返回的是数组，使用this遍历的时候可以取到每一个值
            var that = this; //包含要添加的每一个元素
            var targets = Jerry(param);
            var cNode =[];
            Jerry.each(targets,function(){
                var nowTarget = this; //需要追加到的每一个节点
                Jerry.each(that,function(index){
                    //如果是最后的节点就直接追加通过参数产生的节点；
                    //如果不是最后一个节点就克隆一份新的节点
                    var node = null;
                    if(targets.length - 1 === index){
                        node = this;
                    }else{
                        node = this.cloneNode(true);
                        cNode.push(node);
                    }
                    if(nowTarget != node){ //判断是不是同一个元素
                        nowTarget.appendChild(node);
                    }
                });
            });
            [].push.apply(this,cNode);
            return this;
        },
        remove : function(){
            return this.each(function(){
                this.parentNode.removeChild(this);
            });
        },
        html : function(html){
            if(html === undefined){
                return this[0].innerHTML;
            }else{
                Jerry.each(this,function(){
                  return this.innerHTML = html;
                })
            }
        },
        val: function(val){
            if(arguments.length ===0){
                return this[0].value;
            }else{
                //this 要设置的全部元素，是一个数组
                return this.each(function(){
                    this.value = val; //this// 每一个元素
                })
            }
        },
        css : function(){
            var p = arguments;
            var getStyle =function(k,v){
                //兼容ie 678  //style只能获取行内样式
                if(k.currentStyle){
                    return k.currentStyle[v];
                }else{
                    //标准浏览器获取样式
                    var ret = window.getComputedStyle(k,null);//null用于早期支持伪元素
                    return ret[v];
                }
            }
            if(p.length === 1){ //获取样式
                if(Jerry.isString(p[0])){
                    return getStyle(this[0],p[0]);
                }else if(Jerry.isObj(p[0])){  //判断对象，设置多个样式
                    this.each(function(){
                        for(var k in p[0]){
                            //这里的this是单个的DOM对象
                            this.style[k] = p[0][k];
                        }
                    })
                    return this;
                }else if(Jerry.isArray(p[0])){  //判断数组，设置多个样式
                    var obj ={};
                    for(var i=0;i<p[0].length;i++){
                        obj[p[0][i]] = getStyle(this[0],p[0][i])
                    }
                    return obj;
                }
            }else if(p.length === 2){ //设置样式
                return this.each(function(){
                    this.style[p[0]] =p[1];        //this  每一个元素
                })
            }
        },
        hasClass : function(cn){
            var cname = this[0].className;//获取第一个元素
            var arr = cname.split(/\s+/);//把类名按照空格分隔开  \s空白字符
            for(var i=0;i<arr.length;i++){//遍历判断每一个类名是否和传入的参数相等
                if(arr[i] === cn){
                    return true;//如果找到直接返回true
                }
            }
            return false;//没有找到直接返回false
        },
        addClass : function(){
            var p = arguments;
            console.log(p)
            if(Jerry.isString(p[0])){
                this.each(function(){
                    var className = this.className;
                    className += ' ' + p[0];
                    this.className =className;
                })
            }
            return this;
        },
        removeClass : function(){
            var p = arguments;
            if(Jerry.isString(p[0])){
                this.each(function(){
                    //把参数以空格截取成数组
                    var arr = p[0].split(/\s+/g);
                    var className = this.className;
                    for(var i=0;i<arr.length;i++){
                    //正则匹配字符边界, /b一字符开始，以字符结尾
                    var xhr = new xhrExp('\\b'+Jerry.trim(arr[i])+'\\b','g');
                    className = className.replace(xhr,'');
                    this.className =className;
                    }
                })
            }
            return this;
        },
        toggleClass : function(){
            var p = arguments;
            if(p.length ===1) {
                if (Jerry.isString(p[0])) {
                    var reg = /\b\w+\b/g;
                    var arr =p[0].match(reg);
                    if(arr.length === 1){ //参数是一个类
                        this.each(function(){
                            if(Jerry(this).hasClass){
                                //这里的this是原生DOM对象，不能调用Jerry的方法
                                Jerry(this).removeClass(arr[0])
                            }else{
                                Jerry(this).addClass(arr[0])
                            }
                        })
                    }else if(arr.length === 2){  //参数是两个类
                        this.removeClass(arr[0]);
                        this.addClass(arr[1]);
                    }
                }else if(Jerry.isFunction(p[0])){  //参数是一个方法
                    this.each(function(index,element){
                        p[0](index,element,className);
                    })
                }
            } else if(p.length ===2){
                    this.each(function(i,v){
                        if(Jerry.isFunction(p[0])){
                            p[0].call(this,i,this.className,p[1]);
                        }
                    })
            }
            return this;
        } ,
        attr : function(key,value){
            if(key ==='string' && value === undefined){
                return this.getAttribute(key);
            }else if(key ==='string' && value === 'string'){
                return this.each(this,function(){
                    this.setAttribute(key,value);
                })
            }
        },
        eq : function(num){
            if(typeof num === 'number'){
                //this[num]是dom对象，需要转化为Jerry对象
                return Jerry(this[num]);
            }
        },
        get : function(num){
            if(typeof num === 'number'){
                return this[num];
            }
    }
    });
    Jerry.fn.init.prototype = Jerry.fn;
    window.$ = window.Jerry =Jerry;
})(window);