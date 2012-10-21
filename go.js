if (typeof jQuery == 'undefined'){
	var s = document.createElement('script');
	s.src = "//ajax.googleapis.com/ajax/libs/jquery/1.8.2/jquery.min.js";
	document.body.appendChild(s);
}
setTimeout(function(){
	jQuery(function($){
		
		// Output style
		$("<style>\n"+
			"#gocrawly { padding:10px; margin:10px; background:rgba(255,255,255,0.3); border:3px solid white; border-radius:10px; box-shadow:2px 2px 15px #666, 2px 2px 15px #eee inset; color:#999; position:absolute; right:0; top:0; width:400px; z-index:9999999 }\n"+
			"#gocrawly .page { font:11px Helvetica, Arial; padding:1px; margin:1px; }\n"+
			"	#gocrawly .page a { color:#39c}\n"+
			"	#gocrawly .page ul { margin:0 0 0 10px; padding:0 }\n"+
			"		#gocrawly .page li { margin:0; padding:0; list-style:none }\n"+
			"			#gocrawly .page li a { color:#9cf; font-size:10px }\n"+
			"#gocrawly .queued { background:#999; color:#666 }\n"+
			"#gocrawly .running { background:#ccc; color:#696 }\n"+
			"#gocrawly .done { color:#666 }\n"+
			"#gocrawly .error { background:#fcc }\n"+
			"#gocrawly .resources { display:none; overflow:hidden }\n"+
			"#gocrawly .time { padding:0 4px; }\n"+
			"#gocrawly .depth_1{ padding-left:0 }\n"+
			"#gocrawly .depth_2{ padding-left:10px }\n"+
			"#gocrawly .depth_3{ padding-left:20px }\n"+
			"#gocrawly .depth_4{ padding-left:30px }\n"+
			"#gocrawly .depth_5{ padding-left:40px }\n"+
			"#gocrawly .depth_6{ padding-left:50px }\n"+
			"</style>").appendTo(document.head);
		
		// outline UI
		var $gc = $("<div id='gocrawly'></div>").appendTo(document.body);
		$("<a href='#' style='float:right'>X</a>").appendTo($gc).click(function(e){ e.preventDefault(); $gc.remove() });
		
		// Seed the queue
		var queue = [],
			startTag = /<(body|head)[^>]*>/ig,
			endTag = /<\/(body|head)[^>]*>/ig,
			queued = {},
			resources = {},
			throttle = 2,
			open = 0,
			maxDepth = 6,
			blockedExtentions = /\.(zip|png|gif|je?pg|pdf|docx?|xlsx?|ppsx?|mov|avi|js|javascript|xml|sh|txt)$/,
			running = false,
			origin = parseUrl(document.location.href),
			host = window.location.hostname;
		
		// 
		function parseUrl( url, depth ){
			var a = document.createElement('a');
			a.href = url;
			a.id = b52(8);
			a.path = a.pathname + a.search;
			a.depth = isNaN(depth) ? 0 : depth;
 			return a;
		}
		
		enqueue(origin);
		run()
		
		// Iterates over the queue
		function run(){
			if ( !running ) {
				running = true; 
				while( queue.length && open < throttle ) {
					get( queue.shift() ); // FIFO
					open++;
				}
				running = false;
			}
		}
		
		// Takes some response data and pulls any links or resources out of it
		function handle( link, data ){
			// HTML comes in as a string, XHTML comes in as a document, and we want to avoid auto pre-loading all the images
			var $data = data ? $( data instanceof Document ? data : data.replace(/[ ]src=/ig," data-src=").replace(startTag,"<div>").replace(endTag,"</div>") ) : undefined,
				count = 0;
			
			// Queue up any links in this doc
			$( "a", $data ).each(function(){ enqueue( parseUrl($(this).attr("href"), link.depth+1 ) ); });
			
			// List all the resources
			$("img,link,script",$data).each(function(){ if ( resource( link, this ) ) count++; });
			
			$("<a href='#'>("+count+")</a>").appendTo("#"+link.id+" .total").click(function(e){
				e.preventDefault();
				$("#"+link.id+" .resources").stop().slideToggle();
			});
			
			// Kick the loop off
			setTimeout( run, 1 );
		}
		
		// calls URLs to and wraps the source link into the processing call
		function get( link ){
			var $link = $("#"+link.id).removeClass("queued").addClass("running");
			var start = new Date();
			var $req = $.get( link.path, function(data){ 
				open--;
				var time = new Date().getTime() - start.getTime();
				$link.removeClass("running").addClass("done").find(".time").html(time+"ms");
				handle( link, data ); 
			},'text').error( function( xhr, status, err ){ 
				open--;
				$link.removeClass("running").addClass("error").append("<div>"+err+"</div>");
			});
		}
		
		// push a new link to the queue
		function enqueue( a ){
			
			// filters
			if ( a.depth > maxDepth ) return;
			if ( queued[a.path] ) return;
			if ( a.hostname != origin.hostname || a.protocol != origin.protocol ) return;
			if ( blockedExtentions.test(a.path) ) return;
			
			// output
			$("<div class='page depth_"+a.depth+" queued' data-depth='"+a.depth+"'>"+
				"<a href='"+a.path+"'>"+a.path+"</a> "+
				"<span class='time'></span> "+
				"<span class='total'></span> "+
				"<ul class='resources'></ul> "+
			"</div>")
				.appendTo($gc);
			
			queue.push(a);
			queued[a.path] = true;
		}
		
		function resource( link, node ){
			var name = node.tagName.toLowerCase(),
				url;
			switch ( name ) {
				case 'script':
				case 'img':
					url = node.getAttribute('data-src');
					break;
				case 'link':
					url = node.getAttribute('href');
					break;
			}
			if ( url ) {
				$("#"+link.id+" .resources").append("<li><a href='"+url+"'>"+url+"</a></li>");
				return true
			}
		}
		
		// Random base 52 ID
		function b52(len) { // 
			var tab = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz",
				output = "";
			for(var i = 0; i < len; i++ ) output += tab[Math.round(Math.random()*52-0.5)];
			return output;
		}
	});
},100);