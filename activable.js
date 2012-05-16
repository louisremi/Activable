(function(window,document,Math,undefined) {

// feature detection
if ( !document.querySelector ) { return; }

var isStandard = "addEventListener" in window,
	_addEventListener = isStandard ? "addEventListener" : "attachEvent",
	prefix = isStandard ? "" : "on",
	Activable,
	activateHandlers = {},
	deactivateHandlers = {};

// event delegater
document[ _addEventListener ]( prefix + "click", activeHandler, false );

function Activable( elem ) {
	this[0] = typeof elem == "string" ? document.querySelector( elem ) : elem;
}

// Activable API
Activable.prototype = {
	activate: function( index ) {
		index ?
			seek( this[0], undefined, index ) :
			activeHandler({ target: this[0], type: "add" });
	},
	deactivate: function() {
		activeHandler({ target: this[0], type: "remove" });
	},

	next: function() {
		seek( this[0], "n" );
	},
	prev: function() {
		seek( this[0], "p" );
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

window.A = function( elem ) {
	return new Activable( elem );
};

function activeHandler( event ) {
	event = event || window.event;
	var target = event.target || event.srcElement,
		descendants = [target],
		isActivable,
		delegater,
		activationAnchor,
		internalTarget,
		group,
		children, i,
		previouslyActive,
		previousInternalTarget,
		isActive,
		verb;

	// search for activable parent
	while ( target && target.ownerDocument && !( isActivable = c( target, "has", "activable" ) ) ) {
		descendants.unshift( target = target.parentNode );
	}

	// ignore clicks occuring outside of activable targets
	if ( !isActivable ) { return; }

	// if the element is an ul, delegation is being used;
	if ( target.nodeName == "UL" && descendants[1] ) {
		delegater = target;
		target = descendants[1];
		descendants.shift();
	}

	activationAnchor = findActivationAnchor( target );
	isActive = c( target, "has", "active" );

	// if an activation anchor exists, ignore clicks occuring outside of it
	// also ignore programatically triggered actions when they don't change the current state
	if ( 
		( activationAnchor && event.type == "click" && activationAnchor != descendants[1] ) ||
		( ( isActive && event.type == "add" ) || ( !isActive && event.type == "remove" ) )
	) { return; }

	verb = ( event.type == "click" || event.type == "toggle" ?
		( isActive ? "remove" : "add" ) :
		event.type
	);

	// search for an active element in the same group
	if ( ( group = ( delegater || target ).getAttribute( "data-group" ) ) ) {
		if ( delegater ) {
			eachChild( delegater, function(el) {
				if ( c( el, "has", "active" ) ) {
					previouslyActive = el;
					return false;
				}
			});

		} else {
			previouslyActive = document.querySelector( ".active[data-group=" + group + "]" );
		}

		// make sure one element is always active, unless group starts with -
		if ( !/^-/.test( group ) && target == previouslyActive ) { 
			return preventDefault( event ); 
		}

		// deactivate the active element of the same group
		if ( previouslyActive ) {
			make( [ previouslyActive, delegater, findInternalTarget( findActivationAnchor( previouslyActive ) || previouslyActive ) ], "remove", event );
		}
	}

	// activate or deactivate the target and the internal target
	make( [ target, delegater, findInternalTarget( activationAnchor || target ) ], verb, event );

	preventDefault( event );
	return false;

}

function findActivationAnchor( elem, firstElemChild ) {
	firstElemChild = elem.children[0];
	// naughty IE8 includes comments in children
	while ( firstElemChild && firstElemChild.nodeType != 1 ) {
		firstElemChild = firstElemChild.nextSibling;
	}

	return firstElemChild && firstElemChild.nodeName == "A" ?
		firstElemChild :
		undefined;
}

function findInternalTarget( elem, internalTarget ) {
	return ( internalTarget = elem.getAttribute( "href" ) ) && /^#./.test( internalTarget ) ?
		document.querySelector( internalTarget ) :
		undefined;
}

function preventDefault( event ) {
	event.type == "click" && isStandard ?
		event.preventDefault() :
		event.returnValue = false;
}

function off( uuid, type, handler, allHandlers, match ) {
	var registeredHandlers, i;

	if ( ( type == match || type == "both" ) && ( registeredHandlers = allHandlers[ uuid ] ) ) {
		// remove one handler
		if ( handler ) {
			i = registeredHandlers.length;
			while ( i-- ) {
				if ( registeredHandlers[i] == handler ) {
					registeredHandlers.splice( i, 1 );
				}
			}

		// remove all handlers
		} else {
			delete allHandlers[ uuid ];
		}
	}
}

function make( targets, verb, event ) {
	var uuid, handlers, i;

	if ( targets[2] ) {
		c( targets[2], verb, "active" );
	}

	if ( ( uuid = ( targets[1] || targets[0] ).getAttribute( "data-aid" ) ) ) {
		handlers = ( verb == "add" ? activateHandlers : deactivateHandlers )[ uuid ] || [];
		i = handlers.length;

		while ( i-- ) {
			handlers[i].call( targets[0], event, targets[2] );
		}
	}

	c( targets[0], verb, "active" );
}

function eachChild( elem, callback ) {
	var children = elem.children,
		i = -1,
		length = children.length;

	while ( ++i < length ) {
		if ( children[i].nodeType == 1 ) {
			if ( callback( children[i] ) === false ) {
				break;
			}
		}
	}
}

function seek( elem, rel, index ) {
	var i = 0,
		prevChild,
		isActive;

	eachChild( elem, function(el) {
		isActive = c( el, "has", "active" );

		// using .activate( <index> )
		if ( index ) {
			if ( i == index ) {
				// activate target
				activeHandler({ target: el, type: "add" });
			} else if ( isActive ) {
				// deactivate previously active one
				activeHandler({ target: el, type: "remove" });
			}

			c( el, i < index ? "add" : "remove", "before-active" );

		// using .prev()
		} else if ( rel == "p" ) {
			if ( isActive && prevChild ) {
				c( prevChild, "remove", "before-active" );
				activeHandler({ target: prevChild, type: "add" });
				activeHandler({ target: el, type: "remove" });
				return false;
			}
			prevChild = el;

		// using .next()
		} else {
			if ( prevChild ) {
				activeHandler({ target: el, type: "add" });
				activeHandler({ target: prevChild, type: "remove" });
				c( prevChild, "add", "before-active" );
				return false;
			}
			if ( isActive ) {
				prevChild = el;
			}
		}

		i++;
	});
}

// c, an expressive className manipulation library
function c(e,v,n,c,r){r=e[c='className'].replace(RegExp('(^| ) *'+n+' *( |$)','g'),'');return'has'==v?r!=e[c]:e[c]={add:1,toggle:r==e[c]}[v]?r+' '+n:r};

})(window,document,Math);