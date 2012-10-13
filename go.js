if (typeof jQuery == 'undefined'){
	var s = document.createElement('script');
	s.src = "//ajax.googleapis.com/ajax/libs/jquery/1.8.2/jquery.min.js";
	document.body.appendChild(s);
}
setTimeout(function(){
	jQuery(function($){
		// Set up output
		$("<link href='http://crawly/go.css' media='screen' rel='Stylesheet' type='text/css'>").appendTo(document.head);
		var $gc = $("<div id='gocrawly'></div>").appendTo(document.body);
		
		// Seed the queue
		var queue = [],
			visited = {},
			resources = {},
			maxDepth = 1,
			blockedExtentions = /\.(zip|png|gif|je?pg|pdf|docx?|xlsx?|ppsx?|mov|avi|js|javascript|xml|sh|txt)$/,
			blockedProtocols = /^(mailto:|ftp:)/,
			running = false,
			host = window.location.hostname;
	
		function Link( url, depth ){
			this.depth = depth || 0;
			this.url = ( url || location.href ).split("#")[0]; // ignore hash URLs
		}
		
		handle( new Link(), undefined ); // null case scrapes the current document to seed the queue
	
		function handle( link, data ){
			var $data = data ? $(data.replace(/[ ]src=/ig," data-src=")) : undefined;
			$("#"+link.id).removeClass("running").addClass("done");
			$( "a", $data ).each(function(){ enqueue( new Link( $(this).attr("href"), link.depth+1 ) ); });
			$("img,link,script[src]",$data).each(function(){ resource( link, this ); });
			run();
		}
		function run(){
			if ( !running ){
				running = true;
				while( queue.length ){
					var link = queue.shift();
					$("#"+link.id).removeClass("queued").addClass("running");
					get( link );
				}
				running = false;
			}
		}
		function get( link ){ $.get( link.url, function(data){ handle( link, data ) } )}
		function enqueue( link ){
			if ( kosher( link ) ){
				link.id = urlToId(link.url);
				$gc.append("<div class='page depth_"+link.depth+" queued' id='"+link.id+"'><a href='"+link.url+"'>"+link.url+"</a><ul class='resources'></ul></div>")
				queue.push(link);
				visited[link.url] = true;
				run();
			}
		}
		function kosher( link ){
			if ( link.depth > 10 ) return false;
			if ( visited[link.url] ) return false;
			if ( link.url.indexOf("/") != 0 && link.url.indexOf(host) == -1 ) return false;
			if ( link.url.indexOf("/") != 0 && link.url.indexOf(host) > 10 ) return false;
			if ( blockedExtentions.test(link.url) ) return false;
			if ( blockedProtocols.test(link.url) ) return false;
			return true;
		}
		function resource( link, node ){
			var buffer = ["<li>"];
			$("#"+link.id+" .resources").append("<li></li>")
			//console.log(node)
		}
		function urlToId( url ){ return b62(url); }
		function b62(input) {
			try { b62pad } catch(e) { b62pad=''; }
			var tab = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
			var output = "";
			var len = input.length;
			for(var i = 0; i < len; i += 3)
			{
				var triplet = (input.charCodeAt(i) << 16) | (i + 1 < len ? input.charCodeAt(i+1) << 8 : 0) | (i + 2 < len ? input.charCodeAt(i+2) : 0);
				for(var j = 0; j < 4; j++)
				{
					if(i * 8 + j * 6 > input.length * 8) output += b62pad;
					else output += tab.charAt((triplet >>> 6*(3-j)) & 0x3F);
				}
			}
			return output;
		}
	});
},100);