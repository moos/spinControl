# spinControl

spinControl is a stand-alone spin control optimized for touch-enabled Webkit-based browsers, such as on the iPad, iPhone, and iPod touch.  Whereas in the [sliderControl](http://github.com/moos/sliderControl), the thumb widget is moved across a fixed set of values to select the desired input, in the spinControl the whole set is movable.  This allows for larger set of data that can fit on the visible screen.

[Demo](http://42at.com/lab/spinControl) (best viewed on desktop Safari/Chrome or iPhone/iPod Touch).

Although the demo uses [jQTouch](http://www.jqtouch.com/) & [jQuery](http://jquery.com/), neither is required to run spinControl.

## Features

* kinetic snap to value
* optimized CSS animation
* full range of spin values supported
* customizable with extensive options
* fully programmable
* event callbacks
* adjusts on orientation change
* works on desktop webkit browser (for testing)
* theme to taste!

## Releases

v0.1 - February 5, 2010

    * initial release


## Usage:

	new spinControl('#spinDiv');

		* Spin control with values 0-100 (%).

	new spinControl('#spinDiv', min, max, step);

		* Spin control with values 'min' to 'max' in increments 'step'.

	new spinControl('#spinDiv',['yes','no','maybe']);

		* Spin control with text values.

	new spinControl('#spinDiv', 1,10, options);

		* Spin control with values 1-10 (step 1) and given options.


## Markup

	<div id="spinDiv"></div>

To show the spin value, include this div anywhere:

	<div class="spinValue"></div>

## Options

defaults:{

	// functionality
	easing            : 'ease-out',	 // any CSS3 easing function
	easingDuration    : 350,		 // in msec, set to 0 to disable animation
	labels            : true,        // show labels within spin: true/false, labels[], or "|" separated string
	spinToClick       : true,        // spin to clicks anywhere on spin
	enableSnap        : true,        // snap to value after user finishes sliding
	enableToggle      : false,       // for binary states, click on thumb
	hints             : null,        // text message to show in place of value, null or hints[]
	//initialValue    : null,        // set initial value or null to not set it (if undefined, set to index 0)
	disabled          : false,       // initial disable/enable state
	bounciness        : .2,          // bounce factor (in relation to distance moved)
	acceleration      : 1,           // spin acceleration factor
	alignToEdge       : false,       // if true, selected item is aligned to right edge, else centered

	// styling
	valueSelector     : '.spinValue',      // selector for place to show value on spin
	spinClass         : 'spin',            // CSS class for main spinner container
	thumbClass        : 'spinThumb',       // CSS class for thumb
	labelClass        : 'spinLabel',       // CSS class for labels
	selectedClass     : 'selected',        // CSS class for the selected value
	labelsDivClass    : 'spinLabelsDiv',   // CSS class for styling the labels DIV
	disabledClass     : 'spinDisabled',    // CSS class for a disabled spin
	spinCss           : {},                // runtime CSS attributes for spin
	thumbCss          : {},                // runtime CSS attributes for thumb
	labelWidthAdjust  : 1,                 // adjust to make labels fit if styling changes (border, etc.)

	// event callbacks
	onspinbegin       : null,        // called once on spin begin (manual only)
	onspin            : null,        // called while user is sliding or just once if spin programmatically.
									 //        args:
									 //        delta - pixels moved since last call
	onspinend         : null,        // called after the spin (transition) ends
	onchange          : null,        // called once at end of spin if the value has changed.
									 //         this.value is the new value
	onclick           : null,        // called if user clicks on spin (incl. thumb). arg: (event)
									 //         return false to prevent default spin action
	}


## Methods

	getValue()       returns current spin value
	getIndex()       returns current spin index (0-based index in values array)
	setValue(value)  set spin to value
	setIndex(index)  set spin to 0-based index in values array
	toggle()         toggle spin position (for binary values)
	next(n)          move spin forward n positions (default n=1)
	prev(n)          move spin backward n positions (default n=1)
	first()          move spin to first position
	last()           move spin to last position
	disable()        disable user interaction with spin
	enable()         re-enabled user interaction with spin
	destroy()        removed added DOM elements and events from original markup
				  (useful for reusing a given spin markup)

## Properties

Some useful object properties include:

**Elements**

	this.wrapper      the main spin element node (#spinDiv)
	this.thumb        thumb element node
	this.labelsDiv    container for the spin labels (if have labels)
	this.$value       container to show value (if any, see valueSelector option)

**Variables**

	this.options      user-selected + default options
	this.value        current value of spin
	this.valueIndex   current index in values array
	this.values       array of values

## Utility

	spinControl.options.defaults

		* can be used to change default options for all new control objects.

	spinControl.range(start,end,step)

		* can be used to generate a range of values

# Special case: The toggle switch

A special case of the spinControl is the toggle switch that behaves similar to iPhone's on/off switch, which can be toggled by clicking or sliding it.  I call it the spinToggle.

Usage:

	spin4 = new spinToggle('#spin4', ['ON','OFF'], {
					// onOffStyle: true,
					onchange: function(){
					   alert('selected state is ' +  this.value);
					},
				 });

The onOffStyle flag (if provided), styles the control similar to iPhone's on/off toggle switch.  The second argument should be an array indicating the text for the two states of the switch.  The width of the control is adjusted accordingly.

See demo link above for example.


## License

Released under MIT license.  Free to use.
