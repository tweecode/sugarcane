//
// Section: Effects
//

//
// Function: fade
// Fades a DOM element in or out.
// 
// Parameters:
// el - the element to fade
// options - an object of options to use. This object must have a *fade*
//					 property, which should be either the string 'in' or 'out',
//					 corresponding to the direction of the fade. The second
//					 property used here, *onComplete*, is a function that is called
//					 once the fade is complete. This is optional.
//
// Returns:
// nothing
//

function fade (el, options)
{
	var current;
	var proxy = el.cloneNode(true);
	var direction = (options.fade == 'in') ? 1 : -1;
	
	el.parentNode.replaceChild(proxy, el);
	
	if (options.fade == 'in')
	{
		current = 0;
		proxy.style.visibility = 'visible';
	}
	else
		current = 1;

	setOpacity(proxy, current);	
	var interval = window.setInterval(tick, 25);
	
	function tick()
	{
		current += 0.05 * direction;
		
		setOpacity(proxy, Math.easeInOut(current));
		
		if (((direction == 1) && (current >= 1))
				|| ((direction == -1) && (current <= 0)))
		{
			console.log('swapping fader proxy out');
			el.style.visibility = (options.fade == 'in') ? 'visible' : 'hidden';
			proxy.parentNode.replaceChild(el, proxy);
			delete proxy;
			window.clearInterval(interval);	
			
			if (options.onComplete)
				options.onComplete();
		}
	};
	
	function setOpacity (el, opacity)
	{						
		var percent = Math.floor(opacity * 100);
			
		// IE
		el.style.zoom = 1;
		el.style.filter = 'alpha(opacity=' + percent + ')';
					
		// CSS 3
		el.style.opacity = opacity;
	};
};

//
// Function: scrollWindowTo
// This scrolls the browser window to ensure that a DOM element is
// in view. Make sure that the element has been added to the page
// before calling this function.
//
// Parameters:
// el - the element to scroll to.
//
// Returns:
// nothing
//

function scrollWindowTo (el)
{
	var start = window.scrollY ? window.scrollY : document.body.scrollTop;
	var end = ensureVisible(el);
	var distance = Math.abs(start - end);
	var progress = 0;
	var direction = (start > end) ? -1 : 1;
	var interval = window.setInterval(tick, 25);
	
	function tick()
	{
		progress += 0.1;
		window.scrollTo(0, start + direction * (distance * Math.easeInOut(progress)));
				
		if (progress >= 1)
			window.clearInterval(interval);
	};
	
	function ensureVisible (el)
	{
		var posTop = findPosY(el);
		var posBottom = posTop + el.offsetHeight;
		var winTop = window.scrollY ? window.scrollY : document.body.scrollTop;
		var winHeight = window.innerHeight ? window.innerHeight : document.body.clientHeight;
		var winBottom = winTop + winHeight;
				
		if (posTop < winTop)
			return posTop;
		else if (posBottom > winBottom)
		{
			if (el.offsetHeight < winHeight)
				return (posTop - (winHeight - el.offsetHeight) + 20);
			else
				return posTop;
		}
		else
			return posTop;
	};
	
	function findPosY (el)
	{
		var curtop = 0;
		while (el.offsetParent)
		{
			curtop += el.offsetTop;
			el = el.offsetParent;
		}
		return curtop;	
	};
}
