function setupSequences() {
	
	var sequences = $('.sequence')
	,	sequence = null
	,	panels = null
	,	panel = null
	;
	
	sequences.each(function(ix, el) {
	
		// console.log(el);
	
		sequence = $(el);
		
		panels = $('.panel', sequence);
		panels.addClass('enhanced');
		
		// set the height of the fixed sequence wrapper to which we are pinning the scrollscene
		sequence.height(bodyDims.h);
		sequence.width(bodyDims.w);
		
		sceneCount = $('.content', sequence).length; // the number of transitions
		framesPerScene = 6; // the number of frames in a scene
		frameOverlap = 2; // the number of frames which overlap between scenes
		frameHeight = (bodyDims.h / 2); // the height of a 'scene' in pixels (half a window height)

		frameCount = (sceneCount * framesPerScene) - (sceneCount - 1) * frameOverlap;
		totalDuration = frameCount *  frameHeight;

		// Create a timeline for the tweens to happen on
		timeline = new TimelineMax({onUpdate: function(){
			// console.log('sequence update',this.time(), this.currentLabel());
		}});

		// Add a label (timestamp) for each sceneCount x framesPerScene - (sceneCount - 1) * frameOverlap	
		for (var ix = -1; ++ix <= frameCount;) {
			// labels offset from 0 - ie first is scene-0
			timeline.add('scene-' + ix, ix);
			// console.log('adding scene-%i', ix);
		}

		// console.log('sceneCount: %o, frameCount: %o, frameHeight: %o, duration: %o', sceneCount, frameCount, frameHeight, totalDuration);
		
		// sceneNumber is the overlapping set of frames - one per content
		for (var panelNumber = 0, panelCount = panels.length, sceneNumber = 0; panelNumber < panelCount; panelNumber++) {
		
			panel = $(panels[panelNumber]);
			// console.log('addressing panelNumber: %o', panelNumber);
			
			currMedia = $('.media', panel);
			currContent = $('.content', panel);
			currCaption = $('.caption', panel);
			
			contentCount = currContent.length;
			
			// this scene's animation starts at framesPerScene * (sceneCount - 1) - (sceneCount - 1) * frameOverlap
			sceneStartFrame = (framesPerScene * sceneNumber) - (sceneNumber * frameOverlap);
			// console.log('sceneNumber: %o sceneStartFrame: %o', sceneNumber, sceneStartFrame);
			
			fadeInStartLabel = 'scene-' + sceneStartFrame;
			
			if (currMedia.length > 0) {
				// fade in media
				// console.log('fading in media at %o, sceneNumber %o', fadeInStartLabel, sceneNumber);
				timeline
				.add(TweenMax
					.from(currMedia, 1, {
						autoAlpha: 0
// 					,	onStartParams: [sceneNumber],	onStart: function(){console.log('image ' +  arguments[0] + ' fade in start');}
// 					,	onCompleteParams: [sceneNumber],	onComplete: function(){console.log('image ' +  arguments[0] + ' fade in complete');}
					})
				,	fadeInStartLabel
				);

			}
			
			for (var contentNumber = 0; contentNumber < contentCount; contentNumber++) {
				
				// work out which labels this content happens at
				scrollInStartLabel = 'scene-' + ((sceneStartFrame + 1) + (contentNumber * framesPerScene) - (contentNumber * frameOverlap));
				scrollOutStartLabel = 'scene-' + ((sceneStartFrame + 4) + (contentNumber * framesPerScene) - (contentNumber * frameOverlap));
 				// console.log('scrolling in content at label %o, sceneNumber %o', scrollInStartLabel, sceneNumber);
				
				content = $(currContent[contentNumber]);
				wrap = content.wrap('<div class="content-wrapper"></div>').parent();
				
				sceneNumber++;
				
				// console.log('scrolling out content at %o, sceneNumber %o', scrollOutStartLabel, sceneNumber);
				
				timeline
				.add(TweenMax
					.from(wrap, 1, {
						top: '100%'
					,	autoAlpha: 0
// 					,	onStartParams: [sceneNumber],	onStart: function(){console.log('content ' +  arguments[0] + ' scroll in start');}
// 					,	onCompleteParams: [sceneNumber],	onComplete: function(){console.log('content ' +  arguments[0] + ' scroll in complete');}
					})
				,	scrollInStartLabel
				);

				timeline
				.add(TweenMax
					.to(wrap, 2, {
						top: '-100%'
					,	autoAlpha: 0
// 					,	onStartParams: [sceneNumber],	onStart: function(){console.log('content ' +  arguments[0] + ' scroll out start');}
// 					,	onCompleteParams: [sceneNumber],	onComplete: function(){console.log('content ' +  arguments[0] + ' scroll out complete');}
					})
				,	scrollOutStartLabel
				);
				
			}
			
			fadeOutStartLabel = 'scene-' + (sceneStartFrame + (framesPerScene - frameOverlap) * ( contentCount -1 ) + 5);
			
			if (currMedia.length > 0) {
				// fade in media
				// console.log('fading out media at %o, sceneNumber %o', fadeOutStartLabel, sceneNumber);
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
		.triggerElement(sequence)
		.triggerHook('onCenter')
		.setPin(sequence)
		.setTween(timeline)
		.addTo(controller)
 		// .addIndicators({suffix: 'seq'})
		;
		


		
	});

	
}