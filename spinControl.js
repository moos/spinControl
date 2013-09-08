/*!
* spinControl
*
*     touch spin input control for mobile WebKit
*     (also works on desktop webkit browsers for testing/dev purposes)
*
* Copyright (c) 2010
* http://42at.com/lab/spinControl
* Released under MIT license
*
* Version 0.2 - Last updated: 2013.08.01
*/

/**
* spinControl:
* @param {String} el -- selector of spin div
* @param {Mixed} args -- <none> | max | min,max | min,max,step | values[]
* @param {Object} options -- hash of options
* @usage:
* 		new spinControl('#spinDiv');
*
* 				default spin with values 0-100
*
* 		new spinControl('#spinDiv', 10)		// max
* 		new spinControl('#spinDiv', 1,10)	// min,max
* 		new spinControl('#spinDiv', 1,10,1)	// min,max,step
*
* 				spin with values 1-10, step 1
*
* 		new spinControl('#spinDiv', ['a','b','c'], {easingDuration: 100})
*
*  				spin with values ['a','b','c'] and modified easing Duration (ms)
*
* 		new spinControl('#spinDiv', function(index){ ... })
*
* 				values are determined by return value of function
*
*  @see spinControl.options (below) for options.
*
*  NOTE: spin element (and it's parents!) must be visible (display != 'none')
*  to get proper dimensions
*/

(function(context){

// expose!!
context.spinControl = spinControl;
context.spinToggle = spinToggle;

spinControl.version = spinToggle.version = '0.2';

var
  disableMouse = false,
  moveEventName, endEventName;


function spinControl (el, args, options){

  var self = this;
  var opt = options || {};
  var l = arguments.length;

  this.valuesFnc = null;
  this._position = 0;

    // (el, [])
  if (args instanceof Array) {
    this.values = args;
  // (el,10,options) ==> 1->10, step=1
  // (el,1,10)

  // (el,1,10,1,options)
  } else if ( l > 4) {
    opt = arguments[4];
    this.values = range(arguments[1], arguments[2], arguments[3]);
  // (el,1,10,1)
  // (el,1,10,options)
  } else if (l == 4) {
    opt = typeof arguments[3] == 'object' ? arguments[3] : null;
    this.values = range(arguments[1], arguments[2], opt?1:arguments[3]);
  // (el,1,10)
  // (el,10,options)
  } else if (l == 3) {
    opt = typeof arguments[2] == 'object' ? arguments[2] : null;
    if (opt) {
      //this.values = range(1, arguments[1], 1);
      if (typeof arguments[1] != 'function')
        this.values = range(1, arguments[1], 1);
      else {
        this.valuesFnc = arguments[1];
        this.values = range(0, 100, 1);
      }
    }
    else
      this.values = range(arguments[1], arguments[2], 1);
  // (el,10)
  // (el,options)
  } else if (l == 2) {
    opt = typeof arguments[1] == 'object' ? arguments[1] : null;
    if (opt || typeof arguments[1] == 'function')
      this.values = range(0, 100, 1);
    else {
      if (typeof arguments[1] != 'function')
        this.values = range(1, arguments[1], 1);
      else
        this.valuesFnc = arguments[1];
    }
  } else
    this.values =  range(0, 100, 1);

  // parse options
  this.options = mixin(mixin({}, spinControl.options.defaults), opt);

  // split hints on | if string
  if (this.options.hints && typeof this.options.hints == 'string'){
    this.options.hints = this.options.hints.split('|');
  }

  this.wrapper = document.querySelector(el);
  this.thumb = this.options.thumbSelector ? this.wrapper.querySelector(this.options.thumbSelector) : null; ////////////////////////!!!
  this.$value = this.options.valueSelector  ? document.querySelector(this.options.valueSelector) : null;
  this.labelsDiv = null;

  this.valueIndex = 0;
  this.startIndex = -1;
  this.moving = false;
  this.value = this.values ? this.values[this.valueIndex] : null;
  this.percent = 0;

  if (!this.thumb) {// add thumb
    var thumb = document.createElement('div');
    thumb.className = this.options.thumbClass;
    this.thumb = this.wrapper.appendChild(thumb);
  }

  // apply spin CSS
  this.wrapper.className += ' ' + this.options.spinClass;
  for(var s in this.options.spinCss) {
    this.wrapper.style[s] = this.options.spinCss[s];
  }

  // apply thumb CSS
  for(var s in this.options.thumbCss) {
    this.thumb.style[s] = this.options.thumbCss[s];
  }

  // Init transform
  this.thumb.webkitTransitionProperty = '-webkit-transform';
  this.thumb.style.webkitTransitionTimingFunction = this.options.easing;
  this.thumb.style.webkitTransform = 'translate3d(0, 0, 0)';

  this.thumb.addEventListener('touchstart', this, true);
  this.thumb.addEventListener('mousedown', this, true);
  this.numberOfTouches = 1;

  makeLabels(this);

  if (this.options.spinToClick || this.options.enableToggle)
    this.wrapper.addEventListener('click', this, true);

  if (typeof window.orientation != 'undefined')
    document.body.addEventListener('orientationchange', this, true);

  this.refresh();
  if (typeof this.options.initialValue != 'undefined'){
    if (this.options.initialValue !== null) {
      this.valueIndex = -1;
      this.setValue(this.options.initialValue);
    }
  }
  else
    this.setIndex(0);

  if (this.options.disabled)
    this.disable();
}

spinControl.options = {
  defaults:{
    // functionality
    easing			: 'ease-out',
    easingDuration	: 350,
    labels			: true,		// show labels within spin: true/false, labels[], or "|" separated string
    spinToClick		: true,		// spin to clicks anywhere on spin
    enableSnap 		: true,		// snap to value after user finishes sliding
    enableToggle	: false,	// for binary states, click on thumb
    hints			: null,		// text message to show in place of value, null or hints[]
    //initialValue	: null,		// set initial value or null to not set it (if undefined, set to index 0)
    disabled		: false,	// initial disable/enable state
    bounciness		: .2, 		// bounce factor (in relation to distance moved)
    acceleration	: 1,		// spin acceleration factor
    alignToEdge		: false,	// if true, selected item is aligned to right edge, else centered

    // styling
    valueSelector	: '.spinValue',		// selector for place to show value on spin
    spinClass		: 'spin',			// CSS class for main spinner container
    thumbClass		: 'spinThumb',		// CSS class for thumb
    labelClass		: 'spinLabel',		// CSS class for labels
    selectedClass	: 'selected',		// CSS class for the selected value
    labelsDivClass	: 'spinLabelsDiv',	// CSS class for styling the labels DIV
    disabledClass	: 'spinDisabled',	// CSS class for a disabled spin
    spinCss			: {},				// runtime CSS attributes for spin
    thumbCss		: {},				// runtime CSS attributes for thumb
    labelWidthAdjust: 1,				// adjust to make labels fit if styling changes (border, etc.)

    // event callbacks
    onspinbegin		: null,		// called once on spin begin (manual only)
    onspin			: null,		// called while user is sliding or just once if spin programmatically.
                  //		args:
                  //		delta - pixels moved since last call
    onspinend		: null,		// called after the spin (transition) ends
    onchange		: null,		// called once at end of spin if the value has changed.
                  // 		this.value is the new value
    onclick			: null,		// called if user clicks on spin (incl. thumb). arg: (event)
                  // 		return false to prevent default spin action
    // ignore me!
    dummy			: null
  }
};

spinControl.prototype = {

  /* callbacks */

  spin: function(delta){
    if (typeof this.options.onspin == 'function')
      return this.options.onspin.apply(this, arguments);
  },

  change: function(){
    if (typeof this.options.onchange == 'function')
      return this.options.onchange.apply(this, arguments);
    //console.log(['change',this.value]);
    if (this.$value)
      this.$value.innerHTML = this.options.hints ? this.options.hints[this.valueIndex] : this.value;
  },

  spinend: function(){
    if (typeof this.options.onspinend == 'function')
      return this.options.onspinend.apply(this, arguments);
  },

  spinbegin: function(){
    if (typeof this.options.onspinbegin == 'function')
      return this.options.onspinbegin.apply(this, arguments);
  },

  click: function(){
    if (typeof this.options.onclick == 'function')
      return this.options.onclick.apply(this, arguments);
    return true;
  },

  /* operations */

  getValue: function(){
    return this.value;
  },

  getIndex: function(){
    return this.valueIndex;
  },

  setValue: function(value){
    if (typeof value != 'undefined' && this.values) {
      for (var j in this.values) {
        if (value == this.values[j]) {
          this.setIndex(j);
          break;
        }
      }
    }
    return this.value;
  },

  // set 0-based index
  setIndex: function(i){
    if (typeof i != 'undefined' && this.values
      && i >= 0 && i < this.values.length) {
      var pos = this.positionAtIndex(i),
        duration = this.adjustDuration(i);
      if (i != this.valueIndex) {
        var oldPos = this.position();
        this.updateValue(i >> 0);
        this.triggerCallback('spin', pos - oldPos, true);
        this.change();
        // spin end is called after transition
      }
      this.spinTo(pos, duration);
    }
    return this.valueIndex;
  },

  // toggle: equivalent to next() then loop back at the end!
  toggle: function(){
    var i = this.valueIndex;
    if (i < this.values.length-1) i++;
    else i=0;
    this.setIndex(i);
    return this.value;
  },

  next: function(n){
    n = typeof n=='undefined' ? 1 : n;
    var i = this.valueIndex,
      imax = this.values.length-1;
    if (i+n > imax || i+n < 0) return null;
    this.setIndex(i+n);
    return this.value;
  },

  prev: function(n){
    n = typeof n=='undefined' ? 1 : n;
    return this.next(-n);
  },

  first: function(){
    this.setIndex(0);
    return this.value;
  },

  last: function(){
    this.setIndex(this.values.length-1);
    return this.value;
  },

  disable: function(){
    this.disabled = true;
    this.wrapper.className += ' ' + this.options.disabledClass;
  },

  enable: function(){
    this.disabled = false;
    this.wrapper.className = this.wrapper.className.replace(new RegExp("\\b"+this.options.disabledClass+"\\b",'g'),'');
  },

  destroy: function(){
    this.destroyLabels();
    if (this.thumb){
      this.thumb.removeEventListener('touchstart', this, true);
      this.thumb.removeEventListener('mousedown', this, true);
      this.wrapper.removeChild(this.thumb);
      this.thumb = null;
    }
    // remove events
    if (this.options.spinToClick || this.options.enableToggle)
      this.wrapper.removeEventListener('click', this, true);
    if (typeof window.orientation != 'undefined')
      document.body.removeEventListener('orientationchange', this, true);
    // remove spin CSS
    for(var s in this.options.spinCss) {
      this.wrapper.style[s] = '';		// @TODO: safe!
    }
    this.wrapper = null;
    this.$value = null;
  },

  /* internal */

  positionAtIndex: function(i){
    if (!this.values) return 0;
    var j=0,x=0, last=0, multiplier, node;
    if (this.options.alignToEdge
      && (this.moving /* non-clicked event */ || this.options.type == 'spinToggle')
      ) {
      multiplier = 1;
      x = 0;
    } else {
      multiplier = .5;
      x = Math.floor(this.wrapper.offsetWidth/2);
    }
    while (j <= i) {
      node = this.labelsDiv.children[j++];
      last = node.offsetWidth
        + parseInt(getComputedStyle(node,null).getPropertyValue('margin-left'))
        + parseInt(getComputedStyle(node,null).getPropertyValue('margin-right'));

      x -= last;
    }
    x = Math.floor(x + multiplier * last);
    //console.log('++', i,j,x);
    // if non-moving event, then manually align position
    if (this.options.alignToEdge && !this.moving)
      x = this.alignPosition(x);

    return x;
  },

  indexFromNode: function(el){
    var i=-1;
    while (el) {
      el = el.previousSibling;
      i++;
    }
    return i;
  },

  // align p to edge
  alignPosition: function(p) {
    // check for left-edge alignment first
    var wrapperLeftEdge = -this.labelsDivWidth + this.wrapper.offsetWidth
            - (this.options.type == 'spinToggle' ? 0 : 2) /* .spinThumb padding */;
    if (p < wrapperLeftEdge) {
      return wrapperLeftEdge;
    }
    // else align to panel right edge
    var x=p, i=0, w=0, multiplier, edge, last;
    multiplier = .5;
    last = this.labelsDiv.firstChild.offsetWidth;
    //console.log('align from pos', p, x, last);
    var labels = this.labelsDiv.children,
      len = labels.length;
    while (x < -0.5 * last && i < len){
      var node = labels[i++];
      last = node.offsetWidth
          + parseInt(getComputedStyle(node,null).getPropertyValue('margin-left'))
          + parseInt(getComputedStyle(node,null).getPropertyValue('margin-right'));
      x += last;
      w -= last;
      //console.log('=-=',p,i,x, last, w);
    }
    return w;
  },

  indexFromPos: function(p){
    if (!this.values) return 0;
    var x=p,i=0, multiplier, edge, last;
    if (this.options.alignToEdge){
      multiplier = .5;
      last = -this.labelsDiv.firstChild.offsetWidth;
    } else{
      multiplier = 1;
      last = .5 * this.wrapper.clientWidth;
    }
    //console.log('index from pos', p, x, this.wrapper.clientWidth);
    while (x < multiplier * last && i < this.values.length){
      //console.log('===',p,i,x, last);
      if (this.options.alignToEdge)
        last = this.labelsDiv.children[i].offsetWidth;
      x += this.labelsDiv.children[i++].offsetWidth;
    }
    //console.log('=',i-1);
    return Math.max(0,--i);
  },

  triggerCallback: function(callbackName /*, args */ ) {
    var that = this,
      args = [].slice.call(arguments);
    args.shift(); // drop callback name
    setTimeout(function(){
      that[callbackName].apply(that, args);
    },0);
  },

  handleEvent: function (e) {
    //console.log(['handle event', e.type, e.target]);
    if (this.disabled) return;
    if (disableMouse && e.type.indexOf('mouse') == 0) return;

    switch (e.type) {
      case 'touchstart':
      case 'mousedown':
        disableMouse = e.type === 'touchstart';
        this.onTouchStart(e);
        break;
      case 'touchmove':
      case 'mousemove':
        this.onTouchMove(e);
        break;
      case 'touchend':
      case 'mouseup':
        this.onTouchEnd(e);
        break;
      case 'click':
        // call user click handler first
        if (!this.moving && this.click(e) !== false) {
          this.moving = false;
          this.onClick(e);
        }
        this.moving = false;
        break;

      case 'orientationchange':
        this.onOrientation(e);
        break;
      case 'webkitTransitionEnd':
        this.onTransitionEnd(e);
        break;
    }
  },

  position: function (pos) {
    if (typeof pos != 'undefined'){
      this._position = pos;
      this.thumb.style.webkitTransform = 'translate3d(' + pos + 'px, 0, 0)';
    }
    return this._position;
  },

  refresh: function() {
    this.thumb.style.webkitTransitionDuration = '0';
    this.wrapperWidth = this.wrapper.clientWidth;
    this.labelsDivWidth = labelsDivWidth(this);

    var v = this.labelsDivWidth;
    if (this.options.alignToEdge){
      this.maxSlide = -v + this.wrapperWidth;
      this.minSlide = 0;
    } else {
      this.maxSlide = -Math.floor(v - .5* (this.wrapper.offsetWidth + this.labelsDiv.lastChild.offsetWidth));
      this.minSlide = Math.floor(.5* (this.wrapper.offsetWidth - this.labelsDiv.firstChild.offsetWidth));
    }
    //console.log(['min/maxslide' , this.minSlide, this.maxSlide]);
  },

  onClick: function(e) {
    var el = e.target;
    // handle click only on labels
    if (e.target.parentNode != this.labelsDiv) return;
    var i = this.indexFromNode(el);
    //console.log('onclick', i, this.valueIndex, el, this.options.enableToggle);
    if (this.options.spinToClick && i != this.valueIndex) {
      this.startIndex = this.valueIndex;
      this.setIndex(i);
    }
    else if (this.options.enableToggle) {
      this.toggle();
    }
    //e.preventDefault();
  },

  destroyLabels: function() {
    if (!this.labelsDiv) return;
    var d = this.labelsDiv;
    while (d.firstChild) {
      d.removeChild(d.firstChild);
    }
    d.parentNode.removeChild(d);
  },

  onOrientation: function(e) {
    // remake labels if wrapper size changed
    this.refresh();
    if (this.wrapperWidth != this.wrapper.clientWidth) {
      //this.destroyLabels();
      //makeLabels(this);
      this.setIndex(this.valueIndex);
    }
  },

  onTouchStart: function(e) {
    moveEventName = disableMouse ? 'touchmove' : 'mousemove';
    endEventName = disableMouse ? 'touchend' : 'mouseup';

    if (e.targetTouches && e.targetTouches.length != this.numberOfTouches)
      return;

    //e.preventDefault(); // no preventDefault to allow clicks on thumb
    this.moving = false;
    if (this.values)
      this.startIndex = this.valueIndex;

    this.startX = e.targetTouches ? e.targetTouches[0].clientX : e.clientX;
    this.startY = e.targetTouches ? e.targetTouches[0].clientY : e.clientY;
    this.startTime = e.timeStamp;

    this.thumb.addEventListener(moveEventName, this, false);
    this.thumb.addEventListener(endEventName, this, false);
    this.triggerCallback('spinbegin');
    //return false;
  },

  onTouchMove: function(e) {
    if (e.targetTouches && e.targetTouches.length != this.numberOfTouches)
      return;

    var x =  e.targetTouches ? e.targetTouches[0].clientX : e.clientX;
    var y =  e.targetTouches ? e.targetTouches[0].clientY : e.clientY;

    var theTransform = window.getComputedStyle(this.thumb,null).webkitTransform;
    theTransform = new WebKitCSSMatrix(theTransform).m41;

    var deltaX =  x - this.startX;
    var deltaY =  y - this.startY;
    if (1.5 * Math.abs(deltaY) > Math.abs(deltaX) || deltaX == 0) return true;//false;
    e.preventDefault();

    var delta = deltaX;
    this.scrollTime = e.timeStamp - this.startTime;
    this.startTime = e.timeStamp;
    //console.log(x, this.startX, delta, theTransform);

    // slow down end points
    if ((delta > 0 && theTransform >= this.minSlide) || (delta < 0 && theTransform <= this.maxSlide)){
      delta /= 3;
      delta = delta < 0 ? Math.ceil(delta) : Math.floor(delta);
    }
    var pos = this.position(),
      newPos = pos+delta;

    // if bounciness is zero & we're exactly at an end point, don't move beyond end points.
    if (this.options.bounciness == 0) {
      newPos = Math.max(Math.min(newPos,this.minSlide), this.maxSlide);
      if (theTransform == newPos) return;
      delta = newPos - pos;
    }
    this.moving = true;
    this.position(newPos);
    this.startX = x;
    this.delta = delta;
    this.triggerCallback('spin', delta);
    return;
  },

  updateValue: function(i) {
    this.value = this.valuesFnc ? this.valuesFnc(i) : this.values[i];
    this.valueIndex = i;
  },

  onTouchEnd: function(e) {
    e.preventDefault(); // no preventDefault to allow clicks on thumb
    this.thumb.removeEventListener(moveEventName, this, false);
    this.thumb.removeEventListener(endEventName, this, false);

    if (!this.moving) return false;

    // callback here if moved & no transition
    if (!this.options.enableSnap || this.options.easingDuration == 0) {
      this.triggerCallback('spinend');
    }
    var i,p;
    if (!this.options.enableSnap) {
      i = this.indexFromPos(this._position);
      if (this.startIndex != i) {
        this.updateValue(i);
        this.triggerCallback('change');
        this.updateSelected();
      }
      return false;
    }

    var speed = this.delta / this.scrollTime,
      accel = .00005 / (1+ Math.abs(this.options.acceleration)) * this.wrapper.clientWidth,
      displacement, pos;

    accel = Math.max(1e-4, accel);
    displacement = (this.delta < 0 ? -1 : 1 ) * Math.floor(speed * speed / accel);
    pos = this._position + displacement;
    i = this.indexFromPos(pos);

    if (this.options.alignToEdge) {
      p = this.alignPosition(pos);
    } else {
      // make sure we move at least 1 position right or left
      if (i == this.valueIndex && Math.abs(speed) > .1)
        i += (speed > 0 ? -1 : 1);
      if (i<0) i=0;
      if (i>this.values.length-1) i=this.values.length-1;
      p = this.positionAtIndex(i);
    }

    // slightly adjust duration if moving more than one position
    var duration = this.adjustDuration(i);
    this.updateValue(i);
    this.spinTo(p, duration);

    if (this.valueIndex != this.startIndex){
      this.triggerCallback('change');
    }
  },

  adjustDuration: function(i){
    var shift = Math.abs(this.valueIndex - i);
    if (!this.values || shift <= 1) return this.options.easingDuration;

    var factor = .7 * (1+shift) / this.values.length;
    var duration = Math.floor(this.options.easingDuration * (1 + factor));
    return duration;
  },

  onTransitionEnd: function(e) {
    //console.log('tran end',  e, e.elapsedTime);
    this.thumb.style.webkitTransitionDuration = '0';
    this.thumb.removeEventListener('webkitTransitionEnd', this, false);
    this.updateSelected();
    this.triggerCallback('spinend');
  },

  spinTo: function(pos, duration) {
    duration =  duration || this.options.easingDuration;
    if (duration == 0){
      this.position(pos);
      this.updateSelected();
      return;
    }

    // already there?
    if (pos == this._position){
      this.updateSelected();
      return;
    }
    // else: handle bounce and transition
    var	bounceThreshold = 3,	// don't bounce if below this many pixels
      bounceAmount = Math.floor(this.options.bounciness * (pos - this._position)),
      dur;

    // smaller bounce in the middle!
    if (this.valueIndex > 0 && this.valueIndex < this.values.length-1) bounceAmount = 0;// /= 2;
    if (Math.abs(bounceAmount) < bounceThreshold) bounceAmount = 0;
    //console.log('>', pos, this.valueIndex, bounceAmount);

    dur = bounceAmount ? Math.floor(.7*duration) : duration;

    this.thumb.style.webkitTransitionTimingFunction = this.options.easing;
    this.thumb.style.webkitTransitionDuration = dur + 'ms';
    if (bounceAmount){
      var that = this;
      setTimeout(function(){
        //console.log('calling bounce ', bounceAmount);
        that.thumb.style.webkitTransitionDuration = Math.floor(.3*duration) + 'ms';
        that.thumb.addEventListener('webkitTransitionEnd', that, false);
        that.position(that._position - bounceAmount);
      }, dur + 20);

    } else {
      this.thumb.addEventListener('webkitTransitionEnd', this, false);
    }
    this.position(pos + bounceAmount);
    return;
  },

  updateSelected: function(mode){
    // change selected class
    mode = mode || '';
    if (this.startIndex != this.valueIndex && this.options.selectedClass && this.labelsDiv) {

      if (mode == 'off' || mode == '') {
        var sel = this.labelsDiv.querySelector('.'+this.options.selectedClass);
        if (sel) sel.className = sel.className.replace(new RegExp("\\b"+this.options.selectedClass+"\\b",'g'),'');
      }
      if (mode == 'on' || mode == '') {
        if (this.labelsDiv.childNodes.length > this.valueIndex)
          this.labelsDiv.childNodes[this.valueIndex].className += ' ' +this.options.selectedClass;
      }
    }
  }

};

// returns [start,end] (inclusive) range
spinControl.range = range; // expose!
function range(start, end, step) {
  var l = arguments.length;
  if (l == 0) return [];
  if (l == 1) return arguments.callee(0, start, 1);
  if (l == 2) return arguments.callee(start, end, 1);
  var temp = [];
  if (step == 0) return [];
  if ((start <= end && step < 0) || (start >= end && step > 0)){
    step = -step;
  }
  var n=-1;
  // correct for Javascript float precision error
  var floaty = step.toString().indexOf('.');
  if (floaty != -1) {
    n = step.toString().length - (1 + floaty);
    floaty = true;
  }
  else {
    start >>= 0; end >>=0; step >>=0; // make int
    floaty = false;
  }

  for (; step > 0 ? start <= end : start >= end; start += step) {
    temp.push(floaty ? parseFloat(start.toFixed(n)) : start);
  }
  return temp;
}

function makeLabels(self){
  var labels = self.options.labels;
  switch (typeof labels) {
    case 'boolean':
    case 'number':
      labels = self.values;
      break;
    case 'string':
      labels = labels.split(/\|/);
      if (labels.length != self.values.length) {
        // repeat pattern
        labels = new Array(self.values.length+1).join(labels+'\u0000').split('\u0000', self.values.length);
      }
      break;
  }
  // create a div to hold the labels
  var div = document.createElement('div');
  div.className = self.options.labelsDivClass;
  self.labelsDiv = self.thumb.appendChild(div);
  var str = '',
    n = self.values.length > 1 ? self.values.length : labels.length,
    w = Math.floor(self.wrapper.clientWidth / self.values.length)
        - /* label border with */ self.options.labelWidthAdjust;

  // create the labels html (faster!)
  var emptyLabel = false;
  if (self.options.labels == false || self.options.labels.length == 0)
    emptyLabel = ' ';

  for (var j in self.values) {
    var label = emptyLabel || labels[j];
    if (label === undefined) label = '';
    str += '<span class="'+self.options.labelClass+'">'+ label +'</span>';
  }
  self.labelsDiv.innerHTML = str;
  //self.refresh();
}

function labelsDivWidth(self){
  var v = 0, node,
    i = self.labelsDiv.children.length;
  while (--i >= 0) {
    node = self.labelsDiv.children[i];
    v += parseInt(node.offsetWidth) +
      parseInt(getComputedStyle(node,null).getPropertyValue('margin-left')) +
      parseInt(getComputedStyle(node,null).getPropertyValue('margin-left'));
  }
  return v;
}

function mixin (destination, source) {
    for (var property in source)
      destination[property] = source[property];
    return destination;
};

/****************************
 * two-value spinner
 * mimics iPhone's 'on/off' behavior
 */
function spinToggle (el, values, opt){
  opt = opt || {};
  var labels = opt.labels || values;
  delete opt.labels;

  if (values.length != 2)
    throw "spinToggle: values must be an array with only two values! id=" + el +', values='+values ;

  var options = {
    type			: 'spinToggle',
    labels			: labels,
    selectedClass 	: '',
    enableToggle 	: true,
    bounciness		: 0,
    easingDuration	: 50,
    spinClass		: 'spinToggle',
    alignToEdge		: true,		// !important
    spinToClick		: opt.enableToggle,

    _onchange : function(){
      //console.log(this.value + ' -- override onchange callback to do something useful!');
    }
  };
  if (opt.onOffStyle) options.spinClass += ' onOffStyle';
  for (var i in opt){
    options[i] = opt[i];
  }
  delete options.initialValue;	// set it after layout adjustments

  var spin = new spinControl(el, values, options);

  // override click behavior
  spin.base_click = spin.click;
  spin.click = function(e){
    this.toggle();
    this.base_click(e);
    return false;
  };

  // insert thimble separator
  var thimble = document.createElement('span');
  thimble.className = spin.options.labelClass + ' thimbleClass';
  thimble.innerHTML = '';
  thimble = spin.labelsDiv.insertBefore(thimble, spin.labelsDiv.lastChild);

  // adjust size
  // labels have display:table-cell and setting width doesn't work! so adjust border width of smaller label!
  var amount = spin.labelsDiv.firstChild.offsetWidth - spin.labelsDiv.lastChild.offsetWidth,
    el = amount > 0 ? spin.labelsDiv.lastChild : spin.labelsDiv.firstChild;

  amount = Math.abs(amount);
  if (amount > 0) {
    var amountLeft = Math.floor(amount/2),
      amountRight = amount - amountLeft;
    el.style.paddingLeft = amountLeft + parseInt(getComputedStyle(el,null).getPropertyValue('padding-left')) + 'px';
    el.style.paddingRight = amountRight + parseInt(getComputedStyle(el,null).getPropertyValue('padding-right')) + 'px';
  }

  var v = parseInt(getComputedStyle(spin.thumb,null).getPropertyValue('padding-left'))
      + parseInt(getComputedStyle(spin.thumb,null).getPropertyValue('border-left-width')) ;

  var w = 2 * v /* 2 * thumb border or padding */
      + spin.labelsDiv.firstChild.offsetWidth
      + thimble.offsetWidth;
  spin.wrapper.style.width = w+'px';
  spin.refresh();
  spin.maxSlide = -spin.labelsDiv.firstChild.offsetWidth;
  spin.labelsDivWidth += 2*v;
  spin.onOrientation = function(){};

  // reset initial value after adjustments
  if ('initialValue' in opt) spin.setValue(opt.initialValue)
  else spin.setIndex(0);

  return spin;
};

})(this);
