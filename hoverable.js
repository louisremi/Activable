/*
* Hoverable: declarative UI components | 2K, 0 dependency, IE8 compatible
*
* latest version, README and documentation available on Github:
* https://github.com/louisremi/Activable
*
* Copyright 2012 @louis_remi
* Licensed under the MIT license.
*
* Want to show some love?
* Send me music http://www.amazon.co.uk/wishlist/HNTU0468LQON
*
*/

(function(window,document,Math,undefined) {

var delayed = {},
	currentTarget = {},
	isStandard = "addEventListener" in window,
	_addEventListener = isStandard ? "addEventListener" : "attachEvent",
	prefix = isStandard ? "" : "on",
	_ransition = "ransition",
	html = document.documentElement,
	prfx,
	prefixes = {
		"WebkitT": "webkitTransitionEnd",
		"MozT": "transitionend",
		// transitions are unprefixed in IE10
		//"msT": "msTransitionEnd",
		// Previous Opera had really strange behaviors
		//"OT": "oTransitionEnd",
		"t": "transitionend"
	},
	transition,
	transitionend;

// transition feature detection
for ( prfx in prefixes ) {
	if ( ( transition = prfx + _ransition ) in html.style ) {
		transitionend = prefixes[ prfx ];
		break;
	}
	transition = undefined;
}
transition && document[ _addEventListener ]( transitionend, transitionendHandler, false );

// event delegater
document[ _addEventListener ]( prefix + "mouseover", intentHandler, false );
document[ _addEventListener ]( prefix + "mouseout", intentHandler, false );

function Hoverable( elem ) {
	this[0] = typeof elem == "string" ? exa( document, elem )[0] : elem;
}

// Hoverable API
Hoverable.prototype = {
	enter: function( index ) {
		hoverHandler({ target: this[0], type: "add" });
	},
	leave: function() {
		hoverHandler({ target: this[0], type: "remove" });
	},

	on: function( type, handler ) {
		var expando = this[0].hoverExpando || {};

		if ( type == "enter" || type == "both" ) {
			( expando.enterHandlers || ( expando.enterHandlers = [] ) ).push( handler );
		}
		if ( type == "leave" || type == "both" ) {
			( expando.leaveHandlers || ( expando.leaveHandlers = [] ) ).push( handler );
		}

		this[0].hoverExpando = expando;

	},
	off: function( type, handler ) {
		var expando;

		if ( ( expando = this[0].hovexpando ) ) {
			if ( type == "enter" || type == "both" ) {
				off( expando.enterHandlers, handler );
			}
			if ( type == "leave" || type == "both" ) {
				off( expando.leaveHandlers, handler );
			}
		}
	},

	toggle: function( enterHandler, leaveHandler ) {
		if ( enterHandler && leaveHandler ) {
			Hoverable.on( this[0], "enter", enterHandler );
			Hoverable.on( this[0], "leave", leaveHandler );

		} else {
			hoverHandler({ target: this[0], type: "toggle" });
		}
	}
};

window.Hoverable = window.H = function( elem ) {
	return new Hoverable( elem );
};

function intentHandler( event ) {
	!event && ( event = window.event );
	!event.target && ( event.target = event.srcElement );
	!event.relatedTarget && ( event.relatedTarget = event.toElement );
	!event.type && ( event.type = event.type );

	// cancel mouseover as long as events are captured
	clearTimeout( delayed.mouseover );

	if ( event.type == "mouseover" ) {
		currentTarget.mouseover = event.target;
		
		// if mouseover is captured before mouseout, block subsequent mouseout
		if ( !delayed.mouseout ) {
			delayed.mouseout = 1;
		}

	// type == "mouseout"
	} else {
		currentTarget.mouseover = undefined;
		if ( !delayed.mouseout ) {
			currentTarget.mouseout = event.target;
		}
	}

	// reject all mouseout events as long as a mouseout handler is in the queue
	if ( event.type == "mouseover" || !delayed.mouseout ) {
		// delay the handler
		delayed[ event.type ] = setTimeout(function() {
			hoverHandler( event, currentTarget[ event.type == "mouseover" ? "mouseout" : "mouseover" ] );

			// reset .mouseout to make sure it's not stuck at "1"
			currentTarget.mouseout = delayed.mouseout = undefined;

		}, event.type == "mouseover" ? 150 : 1 );
	}
}

function hoverHandler( event, related ) {
	var target = event.target,
		descendants = [target],
		dataHoverable,
		dataDelegate,
		dataTrigger,
		delegater,
		trigger,
		internalTarget,
		isHover,
		verb;

	while ( target && target.ownerDocument && ( dataHoverable = target.getAttribute( "data-hoverable" ) ) == undefined ) {
		descendants.unshift( target = target.parentNode );
	}

	if ( dataHoverable == undefined ) { return; }

	dataDelegate = target.getAttribute("data-delegate");
	dataTrigger = target.getAttribute("data-trigger");

	target = [ target, 0 ];

	// if the element is an ul, delegation is being used;
	if ( dataDelegate || dataDelegate != "" && target[0].nodeName == "UL" ) {
		delegater = target[0];

		target = dataDelegate ?
			queryList( descendants, dataDelegate ) :
			[ descendants[1], 1 ];
	}

	// refresh the list of descendants
	descendants.splice( 0, target[1] + 1 );

	target = target[0];

	while ( related && related != target && related.ownerDocument ) {
		related = related.parentNode;
	}

	if ( related == target ) { return; }

	// make sure we have a target and the trigger was hovered if it exists
	if ( target && ( !dataTrigger || ( trigger = queryList( descendants, dataTrigger )[0] ) ) ) {

		isHover = c( target, "has", "hover" );

		// also ignore programatically triggered actions when they don't change the current state
		if ( ( isHover && event.type != "add" ) || ( !isHover && event.type != "remove" ) ) {

			verb = ( event.type == "toggle" && !ishover ) || event.type == "mouseover" || event.type == "add" ?
				"add":
				"remove";

			// activate or deactivate the target and the internal target
			make( [ target, delegater, trigger || target ], verb, verb == "add" ? "enter" : "leave", "hover", event );

			preventDefault( event );
		}
	}
}

function queryList( nodeList, selector ) {
	var i = nodeList.length;

	// walk the list in reverse order, to find the deepest matching element
	while ( i-- ) {
		if( matches( nodeList[i], selector ) ) {
			return [ nodeList[i], i ];
		}
	}

	return [];
}

function findInternalTarget( elem, internalTarget ) {
	return ( internalTarget = elem.getAttribute( "href" ) ) &&
		/^#./.test( internalTarget ) &&
		exa( document, internalTarget )[0];
}

function preventDefault( event ) {
	event.type == "click" && isStandard ?
		event.preventDefault() :
		event.returnValue = false;
}

function off( handlers, handler ) {
	if( handler ) {
		i = handlers.length;
		while ( i-- ) {
			if ( handlers[i] == handler ) {
				handlers.splice( i, 1 );
			}
		}
	} else {
		handlers.length = 0;
	}
}

function make( targets, verb, type, action, event ) {
	var target = targets[0],
		attributeHolder = targets[1] || target,
		dataAuto, handlers;

	targets[2] = findInternalTarget( targets[2] );

	// content rendering
	renderContent( target, attributeHolder, verb, action );

	// change class names, after starting a transition if necessary
	if ( transition && ( dataAuto = attributeHolder.getAttribute("data-auto") ) ) {
		if ( targets[2] ) {
			autoDim( targets[2], dataAuto, verb, action );
		}
		autoDim( target, dataAuto, verb, action );

	} else {
		if ( targets[2] ) {
			c( targets[2], verb, action );
		}
		c( target, verb, action );
	}

	// bubble the event up in the tree
	while ( target && target.ownerDocument ) {
		handlers = ( target[ action + "Expando" ] || {} )[ type + "Handlers" ] || [];
		i = handlers.length;

		while ( i-- ) {
			if ( !handlers[i].call( 
				targets[0], event, type, targets[2] 
			) ) {
				return;
			}
		}
		target = target.parentNode;
	}
}

function renderContent( target, attributeHolder, verb, action ) {
	var dataTemplate, dataContent, dataPlacement, title,
		tmp, targetOffset,
		rendered;

	// We'll try to display a content
	if ( ( verb == "add" ) && ( dataContent = target.getAttribute("data-content") || ( title = target.title ) ) ) {

		dataPlacement = attributeHolder.getAttribute("data-placement") || "right";

		// content is an internal link
		if ( /^#/.test( dataContent ) ) {
			rendered = exa( document, dataContent )[0];

		// content is JSON and must be rendered
		} else if ( ( window.Mustache || H ).render && ( dataTemplate = attributeHolder.getAttribute("data-template") ) ) {

			// parse the content (create a simple {title:...} object if not jsonable)
			try {
				dataContent = JSON.parse( dataContent );
			} catch (e) {
				dataContent = {
					title: dataContent
				}
				// if the title contains a ":", add "header" and "body" properties
				if ( ( tmp = dataContent.title.split(":") ).length > 1 ) {
					dataContent.header = tmp.shift();
					dataContent.body = tmp.join(":");
				}
			}

			// render the template
			rendered = ( window.Mustache || H ).render( exa( document, dataTemplate )[0].innerHTML, dataContent );
			tmp = document.createElement("div");
			tmp.innerHTML = rendered;

			// add a reference to the expando
			( target[ action + "Expando" ] || ( target[ action + "Expando" ] = {} ) ).rendered =
				rendered = exa( tmp, "*" )[0];

			document.body.appendChild( rendered );
			c( rendered, "add", dataPlacement );
		}

		// place the content
		if ( rendered ) {
			// remove target title
			if ( title ) {
				target.setAttribute( "data-content", title );
				target.title = null;
			}

			rendered.style.position = "absolute";
			rendered.style.display = "block";
			rendered.style.opacity = 0;
			targetOffset = getOffset( target );

			if ( dataPlacement == "top" || dataPlacement == "bottom" ) {
				// center the render content and the target on the same vertical axe
				rendered.style.left = targetOffset.left + ( target.offsetWidth - rendered.offsetWidth )/2 + "px";

				rendered.style.top = targetOffset.top +
					( dataPlacement == "top" ? -rendered.offsetHeight : target.offsetHeight ) + "px";

			// dataPlacement == "left" || dataPlacement == "right"
			} else {
				// center the render content and the target on the same horizontal axe
				rendered.style.top = targetOffset.top + ( target.offsetHeight - rendered.offsetHeight )/2 + "px";

				rendered.style.left = targetOffset.left +
					( dataPlacement == "left" ? -rendered.offsetWidth : target.offsetWidth ) + "px";
			}

			rendered.style.opacity = "";
		}

	// We'll hide the rendered content
	} else if ( rendered = ( target[ action + "Expando" ] || {} ).rendered ) {
		document.body.removeChild( rendered );
	}
}

function autoDim( elem, dimension, type, action ) {
	var from, to;

	from = getComputedStyle( elem )[ dimension ];
	// transitions should be temporarily disabled for Chrome
	elem.style[ transition ] = "none";
	c( elem, typeToVerb[ type ], action );
	// make sure the inline style is empty (not the case during a transition)
	elem.style[ dimension ] = "";
	to = getComputedStyle( elem )[ dimension ];
	elem.style[ dimension ] = from;
	// computed value has to be accessed to make sure the browser took it into account
	getComputedStyle( elem )[ dimension ];
	elem.style[ transition ] = "";
	elem.style[ dimension ] = to;
}

// remove inline style on transition end
function transitionendHandler( event ) {
	var target = event.target,
		dataAuto, dataDelegate;

	while (
		target
		&& target.ownerDocument
		&& target.getAttribute("data-activable") == undefined
	) {
		target = target.parentNode;
	}

	// make sure we have an activable element with data-auto attr
	if ( 
		!target.ownerDocument
		|| ( dataAuto = target.getAttribute("data-auto") ) != event.propertyName
	) { 
		return;
	}

	// if delegation is being used, make sure the target is actually activable
	if (
		target.nodeName == "UL"
		&& ( dataDelegate = target.getAttribute("data-delegate") ) != ""
		&& !matches( event.target, ( dataDelegate || ">li" ) )
	) { 
		return;
	}

	// Chrome is having this bug again
	event.target.style[ transition ] = "none";
	// This line is enough to get the job done in Firefox
	event.target.style[ dataAuto ] = "";
	// the following 2 lines are part of workaround for Chrome as well
	getComputedStyle( event.target )[ transition ];
	event.target.style[ transition ] = "";
}

// c, an expressive className manipulation library
function c(e,v,n,c,r){r=e[c='className'].replace(RegExp('(^| ) *'+n+' *( |$)','g'),'');return'has'==v?r!=e[c]:e[c]={add:1,toggle:r==e[c]}[v]?r+' '+n:r};

// matches, check if an element matches a CSS selector | IE8 compatible
function matches(a,d,b,c){for(b=exa(a.parentNode||document,d),c=0;d=b[c++];)if(d==a)return!0;return!1};

// enhanced querySelecorAll, understand queries starting with ">"
function exa(a,b,c,d){b.indexOf(">")||(b=((c=a.parentNode)?"#"+(a.id||(a.id=d="a"+(1E6*Math.random()|0))):"html")+b);c=(c||a).querySelectorAll(b);d&&(a.id="");return c};

// return offset of a given element
function getOffset(e){var r=e.getBoundingClientRect(),b=document.body,d=document.documentElement;return{top:r.top+(window.pageYOffset||d.scrollTop)-(d.clientTop||b.clientTop||0),left:r.left+(window.pageXOffset||d.scrollLeft)-(d.clientLeft||b.clientLeft||0)}}

})(window,document,Math);