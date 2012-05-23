(function(window,document,Math,undefined) {

// feature detection
if ( !document.querySelector ) { return; }

var isStandard = "addEventListener" in window,
	_addEventListener = isStandard ? "addEventListener" : "attachEvent",
	prefix = isStandard ? "" : "on",
	Activable,
	activateHandlers = {},
	deactivateHandlers = {},
	rauto = /(?:^| )auto(\w*)-onactivate(?: |$)/,
	_ransition = "ransition",
	html = document.documentElement,
	prefx,
	prefixes = {
		"WebkitT": "webkitTransitionEnd",
		"MozT": "transitionend",
		"msT": "MSTransitionEnd",
		// Opera has the strangest behavior
		//"OT": "oTransitionEnd",
		"t": "transitionend"
	},
	transition,
	transitionend;

// transition feature detection
for ( prefx in prefixes ) {
	if ( ( transition = prefx + _ransition ) in html.style ) {
		transitionend = prefixes[ prefx ];
		break;
	}
	transition = undefined;
}
transition && document[ _addEventListener ]( transitionend, transitionendHandler, false );

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

window.Activable = window.A = function( elem ) {
	return new Activable( elem );
};

function activeHandler( event ) {
	!event && ( event = window.event );
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

	// search for an activable parent
	while ( target && target.ownerDocument && ( isActivable = target.getAttribute("data-activable") ) == undefined ) {
		descendants.unshift( target = target.parentNode );
	}

	// stop here if the last target is not activable
	if ( isActivable == undefined ) {
		return;
	}
	// default behavior is "1 and always 1 is active"
	if ( isActivable == "" ) {
		isActivable = "1"
	}

	// if the element is an ul, delegation is being used;
	if ( target.nodeName == "UL" && descendants[1] ) {
		delegater = target;
		target = descendants[1];
		descendants.shift();
	}

	// search for an activation anchor
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

	// unless the behavior is "O or X are active", deactivate the current active element
	if ( isActivable != "0X" ) {
		// if delegation is used, search for an active element with the same parent
		if ( delegater ) {
			eachChild( delegater, function(el) {
				if ( c( el, "has", "active" ) ) {
					previouslyActive = el;
					return false;
				}
			});

		// search for an active element in the same group
		} else if ( ( group = ( target ).getAttribute( "data-group" ) ) ) {
			previouslyActive = document.querySelector( ".active[data-group=" + group + "]" );
		}

		// if "1 and always 1 is active", check the target is not the same as the previously active
		if ( isActivable == "1" && target == previouslyActive ) {
			return preventDefault( event );
		}

		// deactivate the previously active element
		if ( previouslyActive ) {
			make( [ previouslyActive, delegater, findInternalTarget( findActivationAnchor( previouslyActive ) || previouslyActive ) ], "remove", event );
		}
	}

	// activate or deactivate the target and the internal target
	make( [ target, delegater, findInternalTarget( activationAnchor || target ) ], verb, event );

	preventDefault( event );
}

function findActivationAnchor( elem, firstElemChild ) {
	eachChild( elem, function(el) {
		firstElemChild = el;
		return false;
	});

	return firstElemChild && firstElemChild.nodeName == "A" && firstElemChild;
}

function findInternalTarget( elem, internalTarget ) {
	return ( internalTarget = elem.getAttribute( "href" ) ) &&
		/^#./.test( internalTarget ) &&
		document.querySelector( internalTarget );
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

function make( targets, verb, event ) {
	var target = targets[0],
		uuid, handlers, i, matches;

	if ( transition && ( matches = rauto.exec( ( targets[1] || target ).className ) ) ) {
		if ( targets[2] ) {
			autoDim( targets[2], matches[1], verb );
		}
		autoDim( target, matches[1], verb );

	} else {
		if ( targets[2] ) {
			c( targets[2], verb, "active" );
		}
		c( target, verb, "active" );
	}

	// bubble the event up in the tree
	while ( target && target.ownerDocument ) {
		if ( ( uuid = target.getAttribute( "data-aid" ) ) ) {
			handlers = ( verb == "add" ? activateHandlers : deactivateHandlers )[ uuid ] || [];
			i = handlers.length;

			while ( i-- ) {
				if ( !handlers[i].call( targets[0], event, verb == "add" ? "activate" : "deactivate", targets[2] ) ) {
					return;
				}
			}
		}
		target = target.parentNode;
	}
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

function autoDim( elem, dimension, verb ) {
	var from, to;

	from = getComputedStyle( elem, dimension );
	// transitions should be temporarily disabled for Chrome
	elem.style[ transition ] = "none";
	c( elem, verb, "active" );
	// make sure the inline style is empty (not the case during a transition)
	elem.style[ dimension ] = "";
	to = getComputedStyle( elem, dimension );
	elem.style[ dimension ] = from;
	// computed value has to be accessed to make sure the browser took it into account
	getComputedStyle( elem, dimension );
	elem.style[ transition ] = "";
	elem.style[ dimension ] = to;
}

// remove inline style on transition end
function transitionendHandler( event ) {
	var target = event.target,
		matches, child, lastTest;

	while ( target && target != document && !( matches = rauto.exec( target.className ) ) && !lastTest ) {
		child = target,
		target = target.parentNode;
		lastTest = true;
	}

	if ( !matches || matches[1] != event.propertyName ) { return; }

	// delegation is being used
	target.nodeName == "UL" && ( target = child );

	// Chrome is having this bug again
	target.style[ transition ] = "none";
	// This line is enough to get the job done in Firefox
	target.style[ matches[1] ] = "";
	// the following 2 lines are part of workaround for Chrome as well
	getComputedStyle( target, transition );
	target.style[ transition ] = "";
}

function getComputedStyle( elem, prop ) {
	return window.getComputedStyle( elem )[ prop ];
}

// c, an expressive className manipulation library
function c(e,v,n,c,r){r=e[c='className'].replace(RegExp('(^| ) *'+n+' *( |$)','g'),'');return'has'==v?r!=e[c]:e[c]={add:1,toggle:r==e[c]}[v]?r+' '+n:r};

})(window,document,Math);