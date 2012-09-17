/*
* Activable: declarative UI components | 2K, 0 dependency, IE8 compatible
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

var activateHandlers = { type: "activate" },
	deactivateHandlers = { type: "deactivate" },
	temporary,
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
		// Opera has the strangest behavior
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
document[ _addEventListener ]( prefix + "click", activeHandler, false );

function Activable( elem ) {
	this[0] = typeof elem == "string" ? exa( document, elem )[0] : elem;
}

// Activable API
Activable.prototype = {
	activate: function( index ) {
		index ?
			seek( this[0], undefined, undefined, index ) :
			activeHandler({ target: this[0], type: "add" });
	},
	deactivate: function() {
		activeHandler({ target: this[0], type: "remove" });
	},

	next: function( loop ) {
		seek( this[0], "n", loop );
	},
	prev: function( loop ) {
		seek( this[0], "p", loop );
	},

	on: function( type, handler ) {
		var uuid = this[0].getAttribute( "data-aid" );

		if ( !uuid ) {
			this[0].setAttribute( "data-aid", uuid = "act" + ( Math.random() * 1E9 |0 ) );
		}

		if ( type == "activate" || type == "both" ) {
			( activateHandlers[ uuid ] = activateHandlers[ uuid ] || [] ).push( handler );
		}
		if ( type == "deactivate" || type == "both" ) {
			( deactivateHandlers[ uuid ] = deactivateHandlers[ uuid ] || [] ).push( handler );
		}
	},
	off: function( type, handler ) {
		var uuid = this[0].getAttribute( "data-aid" );

		off( uuid, type, handler, activateHandlers, "activate" );
		off( uuid, type, handler, deactivateHandlers, "deactivate" );
	},

	toggle: function( activateHandler, deactivateHandler ) {
		if ( activateHandler && deactivateHandler ) {
			Activable.on( this[0], "activate", activateHandler );
			Activable.on( this[0], "deactivate", deactivateHandler );

		} else {
			activeHandler({ target: this[0], type: "toggle" });
		}
	}
};

window.Activable = window.A = function( elem ) {
	return new Activable( elem );
};

function activeHandler( event ) {
	!event && ( event = window.event );
	var target = event.target || event.srcElement,
		descendants = [target],
		dataActivable,
		dataDelegate,
		dataTrigger,
		delegater,
		trigger,
		internalTarget,
		previouslyActive,
		isActive,
		verb,
		ok;

	// search for an activable parent
	while (
		target &&
		target.ownerDocument &&
		( dataActivable = target.getAttribute("data-activable") ) == undefined 
	) {
		descendants.unshift( target = target.parentNode );
	}

	// make sure we've found an activable target
	if ( dataActivable != undefined ) {

		// default behavior is "1 and always 1 is active"
		if ( dataActivable == "" ) {
			dataActivable = "1"
		}

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

		// make sure we have a target and the trigger was clicked if it exists
		if ( target && ( !dataTrigger || ( trigger = queryList( descendants, dataTrigger )[0] ) ) ) {

			isActive = c( target, "has", "active" );

			// also ignore programatically triggered actions when they don't change the current state
			if ( ( isActive && event.type != "add" ) || ( !isActive && event.type != "remove" ) ) {

				verb = ( event.type == "click" || event.type == "toggle" ?
					( isActive ? "remove" : "add" ) :
					event.type
				);

				// if the behavior is "O or 1 is active" or "1 and always 1 is active",
				// deactivate the current active element
				if ( dataActivable == "01" || dataActivable == "1" ) {
					// if delegation is used, search for an active element with the same parent
					if ( delegater ) {
						previouslyActive = queryList( exa( delegater, dataDelegate || ">li" ), ".active" )[0];
					}

					// if "1 and always 1 is active", check the target is not the same as the previously active
					if ( dataActivable == "1" && target == previouslyActive ) {
						return preventDefault( event );
					}
				}

				ok = +true;
			}
		}
	}

	// deactivate the temporary element (make sure we don't deactivate it twice)
	if ( temporary ) {
		make(
			[ temporary, delegater, ( dataTrigger && exa( temporary, dataTrigger )[0] ) || temporary ],
			"remove", "active", [ activateHandlers, deactivateHandlers ], event
		);
	}

	// if the behavior is "temporary", remember the currently active element
	if ( dataActivable == "T" ) {
		temporary = target;
	}

	// deactivate the previously active element
	if ( previouslyActive ) {
		make(
			[ previouslyActive, delegater, ( dataTrigger &&  exa( previouslyActive, dataTrigger )[0] ) || previouslyActive ],
			"remove", "active", [ activateHandlers, deactivateHandlers ], event
		);
	}

	if ( ok ) {
		// activate or deactivate the target and the internal target
		make(
			[ target, delegater, trigger || target ],
			verb, "active", [ activateHandlers, deactivateHandlers ], event
		);

		preventDefault( event );
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

function off( uuid, type, handler, allHandlers, match ) {
	var registeredHandlers, i;

	if ( ( type == match || type == "both" ) && ( registeredHandlers = allHandlers[ uuid ] ) ) {
		// remove one specific handler
		if ( handler ) {
			i = registeredHandlers.length;
			while ( i-- ) {
				if ( registeredHandlers[i] == handler ) {
					registeredHandlers.splice( i, 1 );
				}
			}

		// remove all handlers of the given type
		} else {
			delete allHandlers[ uuid ];
		}
	}
}

function make( targets, verb, action, allHandlers, event ) {
	var target = targets[0],
		uuid, handlers, i, dataAuto;

	targets[2] = findInternalTarget( targets[2] );

	if ( transition && ( dataAuto = ( targets[1] || target ).getAttribute("data-auto") ) ) {
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
		if ( ( uuid = target.getAttribute( "data-aid" ) ) ) {
			handlers = allHandlers[ verb == "add" ? 0 : 1 ][ uuid ] || [];
			i = handlers.length;

			while ( i-- ) {
				if ( !handlers[i].call( 
					targets[0], event, allHandlers[ verb == "add" ? 0 : 1 ].type, targets[2] 
				) ) {
					return;
				}
			}
		}
		target = target.parentNode;
	}
}

function seek( parent, rel, loop, index ) {
	var children = exa( parent, parent.getAttribute("data-delegate") || ">li" ),
		length = children.length,
		i = length,
		prevActive,
		parentStyle,
		parentDisplay;

	while ( i-- ) {
		if ( c( children[i], "has", "active" ) ) {
			prevActive = i;
			break;
		}
	}

	if ( rel ) {
		index = prevActive + ( rel == "p" ?	-1 : 1 );
	}

	// return immediatly if:
	// - there's less than two items in the list
	// - the target item is the same as the currently active one
	// - loop is false & an end of the list is reached
	if ( 
		length < 2 ||
		( !rel && index == prevActive ) ||
		( !loop && ( index < 0 || index >= length ) )
	) {
		return;
	}

	// move an item physically in the list if necessary
	if ( index < 0 || index >= length ) {
		// temporarily hide the list to prevent all items to be animated at once in these cases
		if ( transition ) {
			parentStyle = parent.style;
			parentDisplay = parentStyle.display;
			parentStyle.display = "none";
			// make sure the browser is aware of this change
			getComputedStyle( parent ).display;
		}

		index < 0 ?
			parent.appendChild( parent.removeChild( children[ prevActive ] ) ) :
			parent.insertBefore( parent.removeChild( children[ prevActive ] ), children[0] );

		if ( transition ) {
			parentStyle.display = parentDisplay;
			// here again
			getComputedStyle( parent ).display;
		}
	}

	// make sure index is in our list
	index = ( index + length ) % length;

	activeHandler({ target: children[ prevActive ], type: "remove" });
	activeHandler({ target: children[ index ], type: "add" });
}

function autoDim( elem, dimension, verb, action ) {
	var from, to;

	from = getComputedStyle( elem )[ dimension ];
	// transitions should be temporarily disabled for Chrome
	elem.style[ transition ] = "none";
	c( elem, verb, action );
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

// enhanced querySelecorAll, understand queries starting with ">..."
function exa(a,b,c,d){b.indexOf(">")||(b=((c=a.parentNode)?"#"+(a.id||(a.id=d="a"+(1E6*Math.random()|0))):"html")+b);c=(c||a).querySelectorAll(b);d&&(a.id="");return c};

})(window,document,Math);