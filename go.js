if (typeof jQuery == 'undefined'){
	var s = document.createElement('script');
	s.src = "//ajax.googleapis.com/ajax/libs/jquery/1.8.2/jquery.min.js";
	document.body.appendChild(s);
}
setTimeout(function(){
	jQuery(function($){
		// Set up output
		$("<link href='https://raw.github.com/richmarr/go-crawly/master/go.css' media='screen' rel='Stylesheet' type='text/css'>").appendTo(document.head);
		var $gc = $("<div id='gocrawly'></div>").appendTo(document.body);
		
		// Seed the queue
		var queue = [],
			startTag = /<(body|head)((?:\s+[\w-]+(?:\s*=\s*(?:(?:"[^"]*")|(?:'[^']*')|[^>\s]+))?)*)\s*(\/?)>/ig,
			endTag = /<\/(body|head)[^>]*>/ig,
			visited = {},
			resources = {},
			throttle = 6,
			open = 0,
			maxDepth = 6,
			blockedExtentions = /\.(zip|png|gif|je?pg|pdf|docx?|xlsx?|ppsx?|mov|avi|js|javascript|xml|sh|txt)$/,
			blockedProtocols = /^(mailto:|ftp:)/,
			running = false,
			host = window.location.hostname;
	
		function Link( url, depth ){
			this.depth = depth || 0;
			this.url = ( url || location.href ).split("#")[0]; // ignore hash URLs
		}
		
		enqueue( new Link(document.location.href) ); // null case scrapes the current document to seed the queue
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
			$( "a", $data ).each(function(){ enqueue( new Link( $(this).attr("href"), link.depth+1 ) ); });
			
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
			var $req = $.get( link.url, function(data){ 
				open--;
				var time = new Date().getTime() - start.getTime();
				$link.removeClass("running").addClass("done").find(".time").html(time+"ms");
				handle( link, data ); 
			},'text').error( function( xhr, status, err ){ 
				open--;
				$link.removeClass("running").addClass("error").append("<div>"+err+"</div>");
			});
		}
		
		// pushes a new link to the queue, assuming it passes validation
		function enqueue( link ){
			if ( kosher( link ) ){
				link.id = b52(8);
				$gc.append("<div class='page depth_"+link.depth+" queued' id='"+link.id+"'><a href='"+link.url+"'>"+link.url+"</a> <span class='time'></span> <span class='total'></span> <ul class='resources'></ul> </div>")
				queue.push(link);
				visited[link.url] = true;
			}
		}
		// test whether we want to traverse a new link
		function kosher( link ){
			if ( link.depth > maxDepth ) return false; // max depth
			if ( visited[link.url] ) return false; // 
			if ( link.url.indexOf("/") != 0 && link.url.indexOf(host) == -1 ) return false;
			if ( link.url.indexOf("/") != 0 && link.url.indexOf(host) > 10 ) return false;
			if ( blockedExtentions.test(link.url) ) return false;
			if ( blockedProtocols.test(link.url) ) return false;
			return true;
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