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

// Activable API
Activable = {
	activate: function( elem ) {
		activeHandler({ target: elem, type: "add" });
	},

	deactivate: function( elem ) {
		activeHandler({ target: elem, type: "remove" });
	},

	on: function( elem, type, handler ) {
		var uuid = elem.getAttribute( "data-aid" );

		if ( !uuid ) {
			elem.setAttribute( "data-aid", uuid = "act" + ( Math.random() * 1E9 |0 ) );
		}

		if ( type == "activate" || type == "both" ) {
			( activateHandlers[ uuid ] = activateHandlers[ uuid ] || [] ).push( handler );
		}
		if ( type == "deactivate" || type == "both" ) {
			( deactivateHandlers[ uuid ] = deactivateHandlers[ uuid ] || [] ).push( handler );
		}
	},

	off: function( elem, type, handler ) {
		var uuid = elem.getAttribute( "data-aid" );

		off( uuid, type, handler, activateHandlers, "activate" );
		off( uuid, type, handler, deactivateHandlers, "deactivate" );
	},

	toggle: function( elem, activateHandler, deactivateHandler ) {
		if ( activateHandler && deactivateHandler ) {
			Activable.on( elem, "activate", activateHandler );
			Activable.on( elem, "deactivate", deactivateHandler );

		} else {
			activeHandler({ target: elem, type: "toggle" });
		}
	}
};

window.A = Activable;

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
	if ( target.nodeName == "UL" ) {
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
			children = delegater.children;
			i = children.length;

			while ( i-- ) {
				if ( children[i].nodeType == 1 && c( children[i], "has", "active" ) ) {
					previouslyActive = children[i];
					break;
				}
			}

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

// c, an expressive className manipulation library
function c(e,v,n,c,r){r=e[c='className'].replace(RegExp(' *\\b'+n+'\\b','g'),'');return'has'==v?r!=e[c]:e[c]={add:1,toggle:r==e[c]}[v]?r+' '+n:r};

})(window,document,Math);