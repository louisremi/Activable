Activable
=========

Declarative UI components | 2K, 0 dependency, IE8 compatible
------------------------------------------------------------

Activable helps you build modern UI components quicker and keep your code clean. Here is all the code needed to create a tab component:

```html
<script src="activable.js"></script>
<ul data-activable>
  <li class="active"><a href="#t1">Tab1</a></li>
  <li class=""><a href="#t2">Tab2</a></li>
  <li class=""><a href="#t3">Tab3</a></li>
</ul>
<div>
  <div id="t1" class="active">Raw denim you probably haven't heard of.</div>
  <div id="t2">Mustache cliche tempor, williamsburg carles.</div>
  <div id="t3">Cosby sweater eu banh mi, qui irure terry.</div>
</div>
```

Since Activable uses a global event listeners, once the components are appropriately styled with CSS they are fully functional: **no need to initialize them with JS**, ever.

Demo
====

Activable can be used to create common click-based UI components, as illustrated in the **[demo](http://louisremi.github.com/Activable/demo/)**.

Documentation
=============

The declarative markup used to create activable components and the JS API used to extend them have a *zero to hero* **[documentation](http://louisremi.github.com/Activable/docs/)**.

License
=======

[MIT licensed](http://louisremi.mit-license.org/), by [@louis_remi](http://twitter.com/louis_remi).