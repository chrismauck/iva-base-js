// iva_base.js (ivaBase)

var touchClick = "click",
    touchDown = "mousedown",
    platformType = 'desktop',
    isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

if( "ontouchstart" in document.documentElement ) {
    touchClick = "touchend";
    touchDown = "touchstart";
}

if( window.navigator.pointerEnabled ) {
    touchClick = "pointerup";
    touchDown = "pointerdown";
}

;(function () {
    "use strict";
    var ready_state =   /complete|loaded|interactive/, $, ivaBase, document = window.document,
        evt_desktop =   { 
            touchstart : 'mousedown',
            touchmove: 'mousemove',
            touchend: 'mouseup',
            tap: 'click',
            doubletap: 'dblclick'
        },
        this_id = 1,
        HANDLERS = {};
        
    function ivaBase( dom, selector ) {
        dom = dom || [];
        dom.__proto__ = ivaBase.prototype;
        dom.selector = selector || '';
        return dom;
    };

    $ = function( query, context ) {
        return ivaBase( $.getDomainSelector( query, context ), query );
    };

    $.getDomainSelector = function( selector ){
        var domain = null,
            elementTypes = [1, 9, 11],
            type = $.toType( selector );
        if (type === 'string') {
            domain = $.query( document, selector );
        } else if ( elementTypes.indexOf( selector.nodeType ) >= 0 || selector === window ) {
            domain = [selector];
            selector = null;
        }
        return domain;
    };
    
    $.query = function( ctxt, sel ) {
        if ($.toType( ctxt ) === 'array') {
            var res = [];
            for (var i = 0, il = ctxt.length; i < il; i++) {
                res = res.concat( Array.prototype.slice.call( ctxt[i].querySelectorAll( sel ) ) );
            }
            return res;
        }
        return Array.prototype.slice.call( ctxt.querySelectorAll(sel) );
    };
    
    $.toType = function( obj ) {
        return Object.prototype.toString.call( obj ).match(/\s([a-z|A-Z]+)/)[1].toLowerCase();
    };


ivaBase.prototype = $.fn = {
    constructor: ivaBase,
    version: "1.0.3",

// ==== DOM METHODS
    ready: function( callback ) {
        if ( ready_state.test( document.readyState ) ) {
            callback($);
        } else {
            document.addEventListener( 'DOMContentLoaded', function(){ callback( $ ) }, false );
        }
        return this;
    },
// ==== QUERY METHODS    
    each: function( callback ){
        [].every.call( this, function( el, idx ){
            return callback.call( el, idx, el ) !== false;
        } );
        return this;
    },
// ==== EVENT METHODS
    on: function( sel, cb ) {
        return this.bind( sel, cb );
    },
    off: function( sel, cb ){
        return this.unbind( sel, cb );
    },
    click: function( callback ) {
        return this.on( "tap", callback );
    },
    bind: function( e, callback ) {
        return this.each( function() {
            addListener( this, e, callback );
        } );
    },
    unbind: function( e, callback ){
        return this.each( function() {
            removeListener(this, e, callback);
        } );
    },
// ==== STYLE METHODS
    css: function( property, value ){
        for(var i = 0;i < this.length;i++){
            if( typeof property === "string" ) {
                if(value && value !== 0) {
                    this[i].style[property] = value;
                } else if( !value && value === '' ) {
                    this[i].style[property] = '0px';
                } else if( !value && value !== 0 ) {
                    return document.defaultView.getComputedStyle( this[i],null ).getPropertyValue( property );
                }
            } else {
                for( var k in property ) this[i].style[k] = property[k];
            }
        }
        return this;
    },
    hasClass: function( name ) {
        return this[0].classList.contains( name );
    },
    addClass: function( name ) {
        return this.each( function() {
            this.classList.add( name );
        } );
    },
    removeClass: function (name) {
        if (name){
            return this.each(function () {
                this.classList.remove(name);
            });
        } else {
            return this.each(function () { this.className = ''; });
        }
    },
    toggleClass: function (name) {
        return this.each(function (idx){
            var _this = this, names = name.split(/[ ,]+/).forEach(function(n){
                _this.classList.toggle(n);
            });
        });
    },
// ==== PLATFORM METHODS
    platform: function( ready_function, delay ) {
        var waitTime = ( delay ) ? delay : 10,
            actual_function = function(){
                window.setTimeout( function(){
                    ready_function();
                }, waitTime );
            }
        if ( platformType === "eve" ){
            window.eveStart = actual_function();
            return this;
        } else {
            return this.each( function(){
                actual_function();
            } );
        }
    },
    slide_change: function( goto_html, presID ) {
        var slidePath = goto_html;
        return this.each( function(){
            $(this).on( touchClick, function(){
                if ( window.slideObj !== undefined && goto_html in window.slideObj && isMobile ) {
                    if( platformType === "eve" ){ // BETTER WAY TO ACCOMPLISH USING TAGS - WHICH FUNCTION???
                        slidePath = slidePath.replace( ".html", "" );
                        navigateToFirstInstanceOfTag( goto_html );
                    } else if( platformType === "irep" ){
                        slidePath = slidePath.replace( ".html", ".zip" );
                        window.location = 'veeva:gotoSlide(' + slidePath + ')';
                    }
                } else {
                    window.location = goto_html;
                }
            } );
        } );
    }
}
window.$ = $;


// ==== Helper Functions    
    function addListener( element, event, callback, selector, delegate_callback ) {
        event = envEvent( event );
        var el_id = elId(element),
            el_handlers = HANDLERS[el_id] || ( HANDLERS[el_id] = [] ),
            delegate = delegate_callback && delegate_callback( callback, event ),
            handler = {
                event: event,
                callback: callback,
                selector: selector,
                proxy: createDelegateCallback( delegate, callback, element ),
                delegate: delegate,
                index: el_handlers.length
            };
        el_handlers.push( handler );
        element.addEventListener( handler.event, handler.proxy, false );
    }

    function removeListener( element, event, callback, selector ) {
        event = envEvent( event );
        var el_id = elId( element );
        findHandler( el_id, event, callback, selector ).forEach( function( handler ) {
            delete HANDLERS[el_id][handler.index];
            element.removeEventListener( handler.event, handler.proxy, false );
        });
    }
    
    function elId( element ) { return element._id || ( element._id = this_id++ ); }
    
    function envEvent( evt ) {
        var env_event = ( isMobile ) ? evt : evt_desktop[evt];
        return ( env_event ) || evt;
    }

    function createDelegateCallback( delegate, callback, element ) {
        var callback = delegate || callback,
            proxy = function ( event ) {
                var result = callback.apply( element, [event].concat( event.data ) );
                if ( result === false ) event.preventDefault();
                return result;
            };
        return proxy;
    }

    function findHandler( element_id, event, fn, selector ) {
        return ( HANDLERS[element_id] || [] ).filter( function( handler ) {
            return handler && ( !event || handler.event == event ) && 
                ( !fn || handler.fn === fn ) && 
                ( !selector || handler.selector === selector );
        } );
    }


})()



// ==== Veeva iRep Tracking

/***
Callback from clmTracking.  Will run after saveObject or createRecord have been called.
Will run regardless of success or failure of veeva function.
result      // object with veeva information specific to function
***/
var createRecordCallback = function( result ) {
    if( !( result.success ) ) {
        // I've got nothing.
    }
}

/***
Bind this function to the event you need to track and pass the necessary parameters:
        clmType;    // Type of click (tab, modal, etc.)
        clmDesc;    // Unique description of type (such as name specific to tab or button)
        clmID;      // iRep: SLIDE/TAB Unique ID, eve: callback
***/
var clickTracking = function( clmType, clmDesc, clmID ) {
    if( isMobile ) {   // Ignore desktops
        if(platformType === "irep") {
            var clickStream = {};

            clickStream.Track_Element_Id_vod__c = clmID;        // SLIDE/TAB Unique ID
            clickStream.Track_Element_Type_vod__c = clmType;    // Type of click (tab, modal, etc.)
            clickStream.Selected_Items_vod__c = clickStream.Track_Element_Description_vod__c = clmDesc;     // Description of type

            var myJSONText = JSON.stringify( clickStream );

            try
            {   // CLM v. 18+
                request = com.veevasystems.clm.createRecord( Call_Clickstream_vod__c, myJSONText, createRecordCallback );
            }
            catch( f )
            {   // Older CLM
                request = "veeva:saveObject(Call_Clickstream_vod__c),value(" + myJSONText + "),callback(createRecordCallback)";
                document.location = request;
            }
        } else if(platformType === "eve") {
            if(clmID) {
                addEventWithDuration( clmType, clmDesc, clmID );
            } else {
                addEventWithNoDuration( clmType, clmDesc );
            }
        }
    } else {
        console.log( "clickStream.Track_Element_Id_vod__c: " + clmID );
        console.log( "clickStream.Track_Element_Type_vod__c: " + clmType );
        console.log( "clickStream.Selected_Items_vod__c: " + clmDesc );
        console.log( "clickStream.Track_Element_Description_vod__c: " + clmDesc );
    }
};


// ==== Optional Plugins

// Debug

;(function() {
    var DBUG = false;

    $.fn.append = function(value) {  // Can be included in main prototype, but only included her for plugin
        return this.each(function() {
            if ($.toType(value) === 'string') {
                if (value) {
                    var div = document.createElement('div');
                    div.innerHTML = value;
                    this.appendChild(div.firstChild);
                }
            } else if($.toType(value) === 'object' || $.toType(value) === 'array'){
                this.appendChild(value[0]); console.log(value);
            }
        });
    }

    $.fn.debug = function(params){
        var active = (params.active || false),
            color = (params.color || 'grey'),
            pos = (params.pos || 'bottom'),
            width = (params.width || 'full'),
            height = (params.height || 80),
            w, h, loc, tcol, col;
            
        if(color == "grey" || color == "gray"){ col = "rgba(140,140,140,0.4)"; tcol = "#000"; }
        else if(color == "black" || color == "dark"){ col = "rgba(0,0,0,0.4)"; tcol = "#e5e5e5"; }
        else if(color == "white" || color == "light"){ col = "rgba(255,255,255,0.4)"; tcol = "#333"; }
    
        w = (width == "full" || width == "100%") ? "right: 10px" : "width: "+width+"px";
        h = (height == "auto") ? "auto" : height + 'px';
        
        DBUG = (active == false) ? false : true;
        if(DBUG){
            var logger = '<div id="logger" style="background-color: '+col+'; color: '+tcol+'; position: absolute; '+pos+': 10px; left: 10px; '+w+'; height: '+h+'; display: block; padding: 10px 0; border-radius: 6px; overflow-y: scroll;"></div>';
            this.append(logger);
        
            if (typeof console != "undefined"){
                console.olog =(typeof console.log != 'undefined') ? console.log : function() {};
            }
            console.log = function(message) {
                $('#logger').append('<p style="padding: 0 10px;margin:0px;line-height: 1.2em;font-family: arial; font-size: 10px;">' + message + '</p>');
            };
            console.error = console.debug = console.info =  console.log;
        }
    }
})();


