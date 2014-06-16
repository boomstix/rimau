	function getRandomInt (min, max) {
		return Math.floor(Math.random() * (max - min + 1)) + min;
	}
	
	function getImgPos(wH, img) {
		// images are positioned offset from:
		t0 = (wH.h - img.height()) / 2 + getRandomInt(0, 20); // top pos half the diff between window and image height
		l0 = (wH.w - contentWidth) / 3 + getRandomInt(0, 20); // left pos half the diff between window and content column width
		return { top: t0, left: l0 };
	}
	
	function createImgTimeline(imgHolder, ix) {
		
		// creates the start and end top, left, rotation and alpha
		startPos = getImgPos(bodyDims, $(imgHolder.find('img')));
		startPos.rotation = imgHolder.data('start-rotation');
		startPos.autoAlpha = 1;
		endPos = {
			rotation: -90
		,	left: "-=700"
		,	autoAlpha: 0
		,	top: imgHolder.data('end-top')
// 		,	onStartParams: [ix],	onStart: function(){console.log('portrait ' +  arguments[0] + ' flick in start');}
// 		,	onCompleteParams: [ix],	onComplete: function(){console.log('portrait ' +  arguments[0] + ' flick in complete');}
		,	ease: Power2.easeOut };
		// console.log(startPos)

		return new TimelineMax().fromTo(imgHolder, 1, startPos, endPos, "start");
	}
	
	function createImgTween(imgHolder, ix) {
	
		startPos = getImgPos(bodyDims, $(imgHolder.find('img')));
		startPos.rotation = imgHolder.data('start-rotation');
		startPos.autoAlpha = 1;
		
		endPos = {
			rotation: -90
		,	left: "-=700"
		,	autoAlpha: 0
		,	top: imgHolder.data('end-top')
// 		,	onStartParams: [ix],	onStart: function(){console.log('portrait ' +  arguments[0] + ' flick in start');}
// 		,	onCompleteParams: [ix],	onComplete: function(){console.log('portrait ' +  arguments[0] + ' flick in complete');}
		,	ease: Power2.easeOut };
		
		return { start: startPos, end: endPos } ;
	}
	
	function setupPortraitGallery() {
	
		wH = getBodyDims();
		
		$('.portrait').each(function(ix,el){
		
			el = $(el);
			photos = $('.panel', el);
			
			duration = /*wH.h*/ contentHeight * (photos.length + 1); // pulls end past
			
			var timeline = new TimelineMax()
				.fromTo(el, 1, { autoAlpha: 0 }, { autoAlpha: 1 }) // fade in 
			
			photos.each(function(ix, el) {
			
				el = $(el);
				el.addClass('fix');
				el.css('zIndex', photos.length - ix);
				
				imgHolder = $(el.find('.media'));
				img = $(imgHolder.find('img'));
				caption = $(imgHolder.find('.caption'));
				
				// console.log(img, caption);
				
				// initial positions for image holder from image itself
				imgHolder.data('start-rotation', getRandomInt(-6, 6));
				imgHolder.data('end-top', getRandomInt(-800, 800));
				
				pos = createImgTween(imgHolder, ix);
				
				timeline.add(TweenMax.fromTo(imgHolder, 1, pos.start, pos.end))
				
			});
			
			new ScrollScene({duration: duration, offset: 0})
			.triggerHook('onCenter')
			.triggerElement(el)
			.setTween(timeline)
			.addTo(controller)
			// .addIndicators({suffix: 'stack'})
			;
			
		});
	}
	