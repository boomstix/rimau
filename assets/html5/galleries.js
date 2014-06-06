function setupGalleries() {
	
	var galleries = $('.gallery')
	,	gallery = null
	,	panels = null
	,	panel = null
	;
	
	galleries.each(function(ix, el) {
	
		gallery = $(el);
		
		panels = $('.panel', gallery);
		panels.addClass('enhanced');

		sceneCount = panels.length; // the number of transitions
		framesPerScene = 6; // the number of frames in a scene
		frameOverlap = 1; // the number of frames which overlap between scenes
		frameHeight = (bodyDims.h / 2); // the height of a 'scene' in pixels (half a window height)

		frameCount = (sceneCount * framesPerScene) - (sceneCount - 1) * frameOverlap;

		totalDuration = frameCount *  frameHeight;

		console.log('frameCount: %o, frameHeight: %o, duration: %o', frameCount, frameHeight, totalDuration);

		// set the height of the fixed sequence wrapper to which we are pinning the scrollscene
		gallery.height(bodyDims.h);

		// Create a timeline for the tweens to happen on
		timeline = new TimelineMax({onUpdate: function(){
			// console.log('update',this.time(), this.currentLabel()/*, this.getChildren()*/)
		}});

		// Add a label (timestamp) for each sceneCount x framesPerScene - (sceneCount - 1) * frameOverlap	
		for (var ix = -1; ++ix <= frameCount;) {
			// labels offset from 0 - ie first is scene-0
			timeline.add('scene-' + ix, ix);
		}

		for (var sceneNumber = 0; sceneNumber < sceneCount; sceneNumber++) {

			panel = $(panels[sceneNumber]);
			
			// this scene's animation starts at framesPerScene * (sceneCount - 1) - (sceneCount - 1) * frameOverlap
			sceneStartFrame = (framesPerScene * sceneNumber) - (sceneNumber * frameOverlap);
			console.log('sceneNumber: %o sceneStartFrame: %o', sceneNumber, sceneStartFrame);

			// if a panel has a light or dark class, it is just text, and should fade in and out
			// if not, it will have a media panel which will be fixed and fade in, then the caption will scroll past
			
			fadeInStartLabel = 'scene-' + sceneStartFrame;
			scrollInStartLabel = 'scene-' + (sceneStartFrame + 1);
			scrollOutStartLabel = 'scene-' + (sceneStartFrame + 4);
			fadeOutStartLabel = 'scene-' + (sceneStartFrame + 5);
			fadeOutEndLabel = 'scene-' + (sceneStartFrame + 6);

			currMedia = $('.media', panel);
			currContent = $('.content', panel);
			currCaption = $('.caption', panel);
			
			if (currContent.length > 0) {
			
				console.log('fading text only');
				// console.log(currContent.text());
				
				wrap = currContent.wrap('<div class="content-wrapper"></div>').parent();
				console.log(wrap);
				
				timeline
				.add(TweenMax
					.from(panel, 1, {
						autoAlpha: 0
					,	onStart: function(){console.log('content ' +  arguments[0] + ' fade in start');}
					,	onStartParams: [sceneNumber]
					,	onComplete: function(){console.log('content ' +  arguments[0] + ' fade in complete');}
					,	onCompleteParams: [sceneNumber]
					})
				,	scrollInStartLabel
				)
				.add(TweenMax
					.to(panel, 1, {
						autoAlpha: 0
					,	onStart: function(){console.log('content ' +  arguments[0] + ' fade out start');}
					,	onStartParams: [sceneNumber]
					,	onComplete: function(){console.log('content ' +  arguments[0] + ' fade out complete');}
					,	onCompleteParams: [sceneNumber]
					})
				, scrollOutStartLabel
				)
				;
				
			}
			else {
			
				console.log('fading image scrolling text')
				// console.log($('.caption', panel).text());
				
				// add each step at each each frame
				timeline
				.add(TweenMax
					.from(currMedia, 1, {
						autoAlpha: 0
					,	onStart: function(){console.log('image ' +  arguments[0] + ' fade in start');}
					,	onStartParams: [sceneNumber]
					,	onComplete: function(){console.log('image ' +  arguments[0] + ' fade in complete');}
					,	onCompleteParams: [sceneNumber]
					})
				,	fadeInStartLabel
				)
				.add(TweenMax
					.from(currCaption, 1, {
						top: '170%'
					,	autoAlpha: 0
					,	onStart: function(){console.log('caption ' +  arguments[0] + ' slide in start');}
					,	onStartParams: [sceneNumber]
					,	onComplete: function(){console.log('caption ' +  arguments[0] + ' slide in complete');}
					,	onCompleteParams: [sceneNumber]
					})
				,	scrollInStartLabel
				)
				.add(TweenMax
					.to(currCaption, 2.5, {
						top: '-70%'
					,	autoAlpha: 0
					,	onStart: function(){console.log('caption ' +  arguments[0] + ' slide out start');}
					,	onStartParams: [sceneNumber]
					,	onComplete: function(){console.log('caption ' +  arguments[0] + ' slide out complete');}
					,	onCompleteParams: [sceneNumber]
					})
				,	scrollOutStartLabel
				)
				.add(TweenMax
					.to(currMedia, 1, {
						autoAlpha: 0
					,	onStart: function(){console.log('image ' +  arguments[0] + ' fade out start');}
					,	onStartParams: [sceneNumber]
					,	onComplete: function(){console.log('image ' +  arguments[0] + ' fade out complete');}
					,	onCompleteParams: [sceneNumber]
					})
				, fadeOutStartLabel
				)
				;
							
			}
			
		}
		
		// Create a scroll scene
		scene = new ScrollScene({ duration: totalDuration, offset: frameHeight })
		.triggerElement(gallery)
		.triggerHook('onCenter')
		.setPin(gallery)
		.setTween(timeline)
		.addTo(controller)
		.addIndicators({suffix: 'scene'})
		;
		
	});
	
}