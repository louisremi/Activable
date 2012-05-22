Activable
=========

foundations for click-based UI components | 2K, IE8 compat.
-----------------------------------------------------------

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

Some CSS will also be required (Twitter Bootsrap is a good fit) but **no custom JS**. Activable can be used to create common click-based UI components in a declarative way, as illustrated in the *[demo](http://louisremi.github.com/Activable/demo/)*.

Declarative conventions
=======================