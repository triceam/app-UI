/*
THIS SOFTWARE IS PROVIDED BY ANDREW M. TRICE ''AS IS'' AND ANY EXPRESS OR IMPLIED
WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND
FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL ANDREW M. TRICE OR
CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON
ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF
ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/


var ViewNavigator = function( target, backLinkCSS, bindToWindow ) {

	this.supportsBackKey = true; //phonegap on android only
	this.animating = false;
	this.animationX = 150;
	this.animationDuration = 400;
	this.history = [];
	this.scroller = null;
	this.headerPadding = 5;
	
	this.uniqueId = this.guid();
	
	var regexp = new RegExp("Windows Phone OS 7");	
	this.winPhone = (navigator.userAgent.search(regexp) >= 0);
	
	this.rootElement = $('<div class="viewNavigator_root"></div>');
	this.header = $('<div class="viewNavigator_header"></div>');
	this.content = $('<div class="viewNavigator_content" id="contentRoot"></div>');
	this.rootElement.append( this.header );
	this.rootElement.append( this.content );
	
	this.parent = $( target );
	
	this.backLinkCSS = backLinkCSS ? backLinkCSS : "viewNavigator_backButton";
	
	var self = this;
	//$(window).resize( function(event){ self.resizeContent() } );
	//alert( this.parent.toString() );
	//this.parent.resize( function(event){ self.resizeContent() } );
	
	if ( bindToWindow != false ) {
		$(window).resize( function(event){ self.resizeContent() } );
	}
	else {
		this.parent.resize( function(event){ self.resizeContent() } );
	}
	
	this.parent.append( this.rootElement );
	
	if ( window.viewNavigators == null || window.viewNavigators == undefined ) {
		window.viewNavigators = {};
	}
	window.viewNavigators[ this.uniqueId ] = this; 

}

ViewNavigator.prototype.replaceView = function( viewDescriptor ) {
	if (this.animating)
		return;
	viewDescriptor.animation = "pushEffect"
	
	//this is a hack to mimic behavior of pushView, then pop off the "current" from the history
	this.history.push( viewDescriptor );
	this.updateView( viewDescriptor );
	this.history.pop();
	this.history.pop();
	this.history.push( viewDescriptor );
}

ViewNavigator.prototype.pushView = function( viewDescriptor ) {
	if (this.animating)
		return;
	viewDescriptor.animation = "pushEffect"
	this.history.push( viewDescriptor );
	this.updateView( viewDescriptor );
}

ViewNavigator.prototype.popView = function() {

	if (this.animating || this.history.length <= 1 )
		return;
	
	var currentViewDescriptor = this.history[ this.history.length-1];
	if ( currentViewDescriptor.backCallback ) {
		currentViewDescriptor.backCallback();
	}
		
	this.history.pop();	
	var viewDescriptor = this.history[ this.history.length-1 ];
	viewDescriptor.animation = "popEffect"
	this.updateView( viewDescriptor );
}

ViewNavigator.prototype.setHeaderPadding = function( amount ) {
	this.headerPadding = amount;
	if ( this.headerBacklink ) {
		this.headerBacklink.css("left", amount);
	}
}

ViewNavigator.prototype.updateView = function( viewDescriptor ) {
	
	this.animating = true;
	
    
	
	
	this.contentPendingRemove = this.contentViewHolder;
	this.headerContentPendingRemove = this.headerContent;
	
	this.headerContent = $('<div class="viewNavigator_headerContent"></div>');
	
	this.headerTitle = $("<div class='viewNavigator_header_title'>" + viewDescriptor.title + "</div>");
	this.headerContent.append( this.headerTitle );
	
	var linkGuid = this.guid();
	if ( viewDescriptor.backLabel ) {
		this.headerBacklink = $('<li class="viewNavigator_header_backlink viewNavigator_backButtonPosition ' + this.backLinkCSS +'" id="link' + linkGuid + '" onclick="window.viewNavigators[\'' + this.uniqueId + '\'].popView()">'+ viewDescriptor.backLabel + '</li>');
		this.headerContent.append( this.headerBacklink );
		
		//this is for proper handling in splitviewnavigator
		this.setHeaderPadding( this.headerPadding );
	}
	
	var id = this.guid();
	this.contentViewHolder = $('<div class="viewNavigator_contentHolder" id="' + id + '"></div>');
	this.contentViewHolder.append( viewDescriptor.view );
	this.resizeContent();
	
	if ( this.contentPendingRemove ){ 
        this.contentPendingRemove.stop()
	}
	if ( this.headerContentPendingRemove ) {
        this.headerContentPendingRemove.stop()
	}
	this.headerContent.stop()
	this.contentViewHolder.stop()
	
	
	
	if ( this.scroller != null ) {
	    var scrollY = this.scroller.y;
        this.scroller.destroy();
        this.scroller = null;
        
        if (this.contentPendingRemove) {
            //console.log( scrollY );
            
            //use this to mantain scroll position when scroller is destroyed
            var children = $( this.contentPendingRemove.children()[0] );
            children.attr( "scrollY", scrollY );
            var originalTopMargin = children.css( "margin-top" );
            children.attr( "originalTopMargin", originalTopMargin );
            
            var cssString = "translate3d(0px, "+(parseInt( scrollY ) + parseInt( originalTopMargin )).toString()+"px, 0px)";
            children.css( "-webkit-transform", cssString );
            
           // children.css( "margin-top", (parseInt( scrollY ) + parseInt( originalTopMargin )).toString() + "px" );
        } 
    }
	
	$(this.contentPendingRemove).click(function(){ return false; });
	
    
	if ( viewDescriptor.animation == "popEffect" ) {
		
		this.contentViewHolder.css( "left", -this.contentViewHolder.width() );
		this.contentViewHolder.css( "opacity", 1 );
    	this.content.prepend( this.contentViewHolder );
    	
		this.headerContent.css( "left", -this.animationX );
		this.headerContent.css( "opacity", 0 );
		this.header.append( this.headerContent );
    	
    	var func = this.animationCompleteHandler(this.contentPendingRemove, this.headerContentPendingRemove, this.headerContent, this.contentViewHolder );
    	
 	   	this.contentPendingRemove.animate({
   	 			left:this.contentViewHolder.width(),
    			avoidTransforms:false,
    			useTranslate3d: true
    		}, this.animationDuration*0.8);
    		
    	//remove this to change back
 	   	this.contentViewHolder.animate({
   	 			left:0,
    			avoidTransforms:false,
    			useTranslate3d: true
    		}, this.animationDuration/2);
    		
    	this.headerContentPendingRemove.animate({
   	 			left:this.animationX,
    			opacity:0,
    			avoidTransforms:false,
    			useTranslate3d: true
    		}, this.animationDuration, func );
    		
    	this.headerContent.animate({
   	 			left:0,
    			opacity:1,
    			avoidTransforms:false,
    			useTranslate3d: true
    		}, this.animationDuration/2 );
    		
    	
    	//using a timeout to get around inconsistent response times for webkittransitionend event
        //var func = this.animationCompleteHandler(this.contentPendingRemove, this.headerContentPendingRemove, this.headerContent, this.contentViewHolder );
    	//setTimeout( func, this.animationDuration+90 );
	}
	else if ( this.history.length > 1 ) {
	
		this.contentViewHolder.css( "left", this.contentViewHolder.width() );
		this.contentViewHolder.css( "opacity", 1 );
		
    	this.content.append( this.contentViewHolder );
    	
		this.headerContent.css( "left", this.animationX );
		this.headerContent.css( "opacity", 0 );
		this.header.append( this.headerContent );

        var func = this.animationCompleteHandler(this.contentPendingRemove, this.headerContentPendingRemove, this.headerContent, this.contentViewHolder );

 	   	this.contentViewHolder.animate({
   	 			left:0,
    			avoidTransforms:false,
    			useTranslate3d: true
    		}, this.animationDuration*0.75);
    	
 	   	this.contentPendingRemove.animate({
   	 			left:-this.contentViewHolder.width()/2,
    			avoidTransforms:false,
    			useTranslate3d: true
    		}, this.animationDuration, func);
    		
    	this.headerContent.animate({
   	 			left:0,
    			opacity:1,
    			avoidTransforms:false,
    			useTranslate3d: true
    		}, this.animationDuration*0.75);
    		
    	this.headerContentPendingRemove.animate({
   	 			left:-this.animationX,
    			opacity:0,
    			avoidTransforms:false,
    			useTranslate3d: true
    		}, this.animationDuration );
    		
    	//using a timeout to get around inconsistent response times for webkittransitionend event
    	//var func = this.animationCompleteHandler(this.contentPendingRemove, this.headerContentPendingRemove, this.headerContent, this.contentViewHolder );
    	//setTimeout( func, this.animationDuration+90 );
	}
	else {
		this.contentViewHolder.css( "left", 0 );
		this.contentViewHolder.css( "opacity", 1 );
    	this.content.append( this.contentViewHolder );

		this.headerContent.css( "left", 0 );
		this.headerContent.css( "opacity", 1 );
		this.header.append( this.headerContent );
		this.animating = false;
		this.resetScroller();
	}
	
    if ( viewDescriptor.backLabel ) {
    	new NoClickDelay( this.headerBacklink.get()[0] );
	}
	
	if ( viewDescriptor.showCallback ) {
	    viewDescriptor.showCallback();
	}
}


ViewNavigator.prototype.destroyScroller = function() {
  
	if ( !this.winPhone ) {
		if ( this.scroller != null ) {
			this.scroller.destroy();
			this.scroller = null;
		}
    }
}


ViewNavigator.prototype.resetScroller = function() {
    
    var id = this.contentViewHolder.attr( "id" );
    var currentViewDescriptor = this.history[ this.history.length-1];
    this.destroyScroller();
    
	if ( !this.winPhone ) {
		if ( id && !(currentViewDescriptor && currentViewDescriptor.scroll == false)) {
			var self = this;
			if ( 'ontouchstart' in window ){
                setTimeout( function() { 
                    
                    //use this to mantain scroll position when scroller is destroyed
                    var targetDiv = $( $("#"+id ).children()[0] );
                    var scrollY= targetDiv.attr( "scrollY" );
                    var originalTopMargin = targetDiv.attr( "originalTopMargin" );
                    if ( currentViewDescriptor.maintainScrollPosition !== false && scrollY != undefined && scrollY != "" ){
                      //  console.log( "resetScroller scrollY: " + scrollY)
                      //  targetDiv.css( "margin-top", originalTopMargin );
                        var cssString = "translate3d(0px, "+(originalTopMargin).toString()+"px, 0px)";
                        targetDiv.css( "-webkit-transform", cssString );
                    }
                    self.scroller = new iScroll( id ); 
                    if ( currentViewDescriptor.maintainScrollPosition !== false && scrollY != undefined && scrollY != "" ) {
                        self.scroller.scrollTo( 0, parseInt( scrollY ) );
                    }
                }, 10 );
                //this.scroller = new iScroll( id );
			} 
			else {
			    var target = $("#"+id );
			    target.css( "overflow", "auto" );
			}
		}
    }
}


ViewNavigator.prototype.refreshScroller = function() {
    
	if ( !this.winPhone ) {
		if ( this.scroller != null ) {
			this.scroller.refresh();
		}
    }
}

ViewNavigator.prototype.animationCompleteHandler = function(removalTarget, headerRemovalTarget, headerView, contentView) {
	var self = this;
	return function() {
		self.animating = false;
        self.resetScroller();
		if ( removalTarget ) {
			removalTarget.unbind( "click" );
			removalTarget.detach();
		}
		if ( headerRemovalTarget ) {
			headerRemovalTarget.unbind( "click" );
			headerRemovalTarget.detach(); 
		}
	}
}

ViewNavigator.prototype.resizeContent = function(event) {

	var targetWidth = this.parent.width();
	if ( this.headerContent )
		this.headerContent.width( targetWidth );
	if ( this.contentViewHolder )
		this.contentViewHolder.width( targetWidth );
}


//GUID logic from http://stackoverflow.com/questions/105034/how-to-create-a-guid-uuid-in-javascript

ViewNavigator.prototype.S4 = function() {
    return (((1+Math.random())*0x10000)|0).toString(16).substring(1); 
}
 
ViewNavigator.prototype.guid = function() {
	return (this.S4() + this.S4() + "-" + this.S4() + "-4" + this.S4().substr(0,3) + "-" + this.S4() + "-" + this.S4() + this.S4() + this.S4()).toLowerCase();
}



/*  PHONEGAP INTEGRATION */
/*
//android+phonegap specific back button support - will only work if phonegap is used on android (www.phonegap.com)
if ( typeof PhoneGap != 'undefined' ) { 
	document.addEventListener("deviceready", onDeviceReady, false);
}

function onDeviceReady() {
   document.addEventListener("backbutton", onBackKey, false);
}

function onBackKey( event ) {
	event.preventDefault();
	window.viewNavigator.popView();
	for ( var x=0; x<window.backKeyViewNavigators.length; x++ ) {
		window.backKeyViewNavigators[x].popView();
	}
}
*/
	
//block page scrolling
document.addEventListener('touchmove', function (e) { e.preventDefault(); }, false);



