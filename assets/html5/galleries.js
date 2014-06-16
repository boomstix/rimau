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
		frameOverlap = 2; // the number of frames which overlap between scenes
		frameHeight = (bodyDims.h / 2); // the height of a 'scene' in pixels (half a window height)

		frameCount = (sceneCount * framesPerScene) - (sceneCount - 1) * frameOverlap;

		totalDuration = frameCount *  frameHeight;

		// console.log('frameCount: %o, frameHeight: %o, duration: %o', frameCount, frameHeight, totalDuration);

		// set the height of the fixed sequence wrapper to which we are pinning the scrollscene
		gallery.height(bodyDims.h);

		// Create a timeline for the tweens to happen on
		timeline = new TimelineMax({onUpdate: function(){
			// console.log('gallery update',this.time(), this.currentLabel()/*, this.getChildren()*/)
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
			// console.log('sceneNumber: %o sceneStartFrame: %o', sceneNumber, sceneStartFrame);

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
			
			if (panel.hasClass('light')) {
				// is this scene's bg light and the next scene's bg light? if so, make gallery background light
				// console.log('scene %i of %i: not last scene', sceneNumber, sceneCount - 1);
				// console.log('transition gallery bg to white bg at scene %i', sceneNumber);
				timeline
				.add(TweenMax
					.to(gallery, 0.1, {
						backgroundColor: '#ccc'
// 					,	onStartParams: [sceneNumber],	onStart: function(){console.log('gallery ' +  arguments[0] + ' bg color to white start');}
					})
				,	fadeInStartLabel
				);
			}
			else {
				// console.log('scene %i of %i: IS last scene', sceneNumber, sceneCount - 1);
				// console.log('transition gallery bg to black bg at scene %i', sceneNumber);
				timeline
				.add(TweenMax
					.to(gallery, 0.1, {
						backgroundColor: '#000'
// 					,	onStartParams: [sceneNumber],	onStart: function(){console.log('gallery ' +  arguments[0] + ' bg color to black start');}
					})
				,	fadeInStartLabel
				);
			}
			
			if (currContent.length > 0) {
			
				// console.log('fading text only');
				// console.log(currContent.text());
				
				wrap = currContent.wrap('<div class="content-wrapper"></div>').parent();
				// console.log(wrap);
				
				timeline
				.add(TweenMax
					.from(panel, 1, {
						autoAlpha: 0
// 					,	onStartParams: [sceneNumber],	onStart: function(){console.log('content ' +  arguments[0] + ' fade in start');}
// 					,	onCompleteParams: [sceneNumber],	onComplete: function(){console.log('content ' +  arguments[0] + ' fade in complete');}
					,	ease: Power4.easeInOut
					})
				,	scrollInStartLabel
				)
				.add(TweenMax
					.to(panel, 1, {
						autoAlpha: 0
// 					,	onStartParams: [sceneNumber],	onStart: function(){console.log('content ' +  arguments[0] + ' fade out start');}
// 					,	onCompleteParams: [sceneNumber],	onComplete: function(){console.log('content ' +  arguments[0] + ' fade out complete');}
					,	ease: Power4.easeInOut
					})
				, scrollOutStartLabel
				)
				;
				
			}
			
			if (currCaption.length > 0) {
			
				// console.log('scrolling text')
				// console.log($('.caption', panel).text());
				
				timeline
				.add(TweenMax
					.from(currCaption, 1, {
						top: '100%'
					,	autoAlpha: 0
// 					,	onStartParams: [sceneNumber],	onStart: function(){console.log('caption ' +  arguments[0] + ' slide in start');}
// 					,	onCompleteParams: [sceneNumber],	onComplete: function(){console.log('caption ' +  arguments[0] + ' slide in complete');}
					})
				,	scrollInStartLabel
				);

				timeline
				.add(TweenMax
					.to(currCaption, 2, {
						top: '-100%'
					,	autoAlpha: 0
// 					,	onStartParams: [sceneNumber],	onStart: function(){console.log('caption ' +  arguments[0] + ' slide out start');}
// 					,	onCompleteParams: [sceneNumber],	onComplete: function(){console.log('caption ' +  arguments[0] + ' slide out complete');}
					})
				,	scrollOutStartLabel
				);
				
			}

			if (currMedia.length > 0) {
			
				// console.log('fading image')
				// add each step at each each frame
				timeline
				.add(TweenMax
					.from(currMedia, 1, {
						autoAlpha: 0
// 					,	onStartParams: [sceneNumber],	onStart: function(){console.log('image ' +  arguments[0] + ' fade in start');}
// 					,	onCompleteParams: [sceneNumber],	onComplete: function(){console.log('image ' +  arguments[0] + ' fade in complete');}
					})
				,	fadeInStartLabel
				);

				timeline
				.add(TweenMax
					.to(currMedia, 1, {
						autoAlpha: 0
// 					,	onStartParams: [sceneNumber],	onStart: function(){console.log('image ' +  arguments[0] + ' fade out start');}
// 					,	onCompleteParams: [sceneNumber],	onComplete: function(){console.log('image ' +  arguments[0] + ' fade out complete');}
					})
				, fadeOutStartLabel
				);
				
			}
			
		}
		
		// Create a scroll scene
		scene = new ScrollScene({ duration: totalDuration, offset: frameHeight })
		.triggerElement(gallery)
		.triggerHook('onCenter')
		.setPin(gallery)
		.setTween(timeline)
		.addTo(controller)
// 		.addIndicators({suffix: 'scene'})
		;
		
	});
	
}