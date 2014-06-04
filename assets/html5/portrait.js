	function getRandomInt (min, max) {
		return Math.floor(Math.random() * (max - min + 1)) + min;
	}
	
	function getImgPos(wH, img) {
		// images are positioned offset from:
		t0 = (wH.h - img.height()) / 2 + getRandomInt(0, 20); // top pos half the diff between window and image height
		l0 = (wH.w - contentWidth) / 2 + getRandomInt(0, 20); // left pos half the diff between window and content column width
		return { top: t0, left: l0 };
	}
	
	function createImgTimeline(imgHolder) {
		
		// creates the start and end top, left, rotation and alpha
		startPos = getImgPos(bodyDims, $(imgHolder.find('img')));
		startPos.rotation = imgHolder.data('start-rotation');
		startPos.autoAlpha = 1;
		endPos = { rotation: -90, left: "-=700", autoAlpha: 0, top: imgHolder.data('end-top'), ease: Power2.easeOut };
		// console.log(startPos)

		return new TimelineMax().fromTo(imgHolder, 1, startPos, endPos, "start");
	}
	
	function setupPortraitGallery() {
	
		wH = getBodyDims();
		
		$('.portrait').each(function(ix,el){
		
			el = $(el);
			photos = $('.panel', el);
			
			// add padding div.photo to bottom
			el.append('<div class="panel fix"></div>');
			
			duration = contentHeight * (photos.length + 1); // pulls end past
			
			new ScrollScene({duration: duration, offset: 0})
			.triggerHook('onCenter')
			.triggerElement(el)
			.setTween(new TimelineMax()
				.set(el, {autoAlpha: 0})
				.to(el, 1.5, {}) // do nothing
				.to(el, 1, {autoAlpha: 1}) // fade in 
				.to(el, 16, {}) // do nothing
				.to(el, 1, {autoAlpha: 0})
				.to(el, 0.5, {}) // do nothing
			)
			.addTo(controller)
			//.addIndicators({suffix: 'stack'})
			;
			
			
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
				
				// create a timeline for rotation of images left out of window
				imgHolder.data('timeline', createImgTimeline(imgHolder));
				
				imgHolder.data('scene', new ScrollScene({duration: contentHeight, offset: contentHeight})
					.triggerElement(el)
					.setTween(imgHolder.data('timeline'))
					.addTo(controller)
					.addIndicators({ suffix: ix })
				);
				
			});
		});
	}
	