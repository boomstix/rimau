
function setupSequences() {
	
	var sequences = $('.sequence, .gallery')
	,	sequence = null
	,	panels = null
	,	panel = null
	, direction = 'FORWARD'
	, vidBaseUrl = 'https://rimau-video.s3.amazonaws.com'
//	, vidBaseUrl = 'assets/video'
	, debug = true
	;
	
	function checkVideo(sceneType, video, sceneNumber, direction) {
		if (debug) { console.log('check: scene type: %o number %o direction: %o', sceneType, sceneNumber, direction); }
		video.get(0).currentTime = 0;
		//if (direction == 'FORWARD')
		if (sceneType == 'fadeIn') {
			if (debug) { console.log('playing video'); }
			video.get(0).play();
		}
		else {
			if (debug) { console.log('pausing video'); }
			video.get(0).pause();
		}
	}

	sequences.each(function(sequenceNumber, el) {
	
		// console.log(el);
	
		sequence = $(el);
		
		panels = $('.panel', sequence);
		panels.addClass('enhanced');
		
		// set the height of the fixed sequence wrapper to which we are pinning the scrollscene
		sequence.height(bodyDims.h);
		sequence.width(bodyDims.w);
		
		// work out the number of transitions
		sceneCount = 0;
		for (var panelNumber = 0, panelCount = panels.length; panelNumber < panelCount; panelNumber++) {
			panel = $(panels[panelNumber]);
			sceneCount += Math.max($('.content', panel).length, $('.caption', panel).length, $('.media', panel).length);
		}
		framesPerScene = 6; // the number of frames in a scene
		frameOverlap = 2; // the number of frames which overlap between scenes
		frameHeight = (bodyDims.h / 2); // the height of a 'scene' in pixels (half a window height)

		frameCount = (sceneCount * framesPerScene) - (sceneCount - 1) * frameOverlap;
		totalDuration = frameCount *  frameHeight;

		// Create a timeline for the tweens to happen on
		last_label = '0';
		timeline = new TimelineMax({onUpdate: function(){
			if (debug) { 
				new_label = parseInt(this.time(), 10);
				if (new_label != last_label) {
					console.log('sequence update',this.time(), this.currentLabel());
					last_label = new_label;
				}
			}
		}});

		if (debug) { console.log('----------------------'); }
		if (debug) { console.log('addressing sequenceNumber: %o', sequenceNumber); }
			
		// Add a label (timestamp) for each sceneCount x framesPerScene - (sceneCount - 1) * frameOverlap	
		for (var ix = -1; ++ix <= frameCount;) {
			// labels offset from 0 - ie first is scene-0
			timeline.add('scene-' + ix, ix);
			if (debug) { console.log('adding scene-%i', ix); }
		}

		// console.log('sceneCount: %o, frameCount: %o, frameHeight: %o, duration: %o', sceneCount, frameCount, frameHeight, totalDuration);
		
		// sceneNumber is the overlapping set of frames - one per content
		for (var panelNumber = 0, panelCount = panels.length, sceneNumber = 0; panelNumber < panelCount; panelNumber++) {
		
			panel = $(panels[panelNumber]);
			if (debug) { console.log('addressing panelNumber: %o', panelNumber); }
			
			currMedia = $('.media, .media-bg', panel);
			currContent = $('.content', panel);
			currCaption = $('.caption', panel);
			
			contentCount = currContent.length > 0 ? currContent.length : 1;
			if (debug) { console.log('contentCount: ' , contentCount); }
			
			// this scene's animation starts at framesPerScene * (sceneCount - 1) - (sceneCount - 1) * frameOverlap
			sceneStartFrame = (framesPerScene * sceneNumber) - (sceneNumber * frameOverlap);
			// console.log('sceneNumber: %o sceneStartFrame: %o', sceneNumber, sceneStartFrame);
			
			fadeInStartLabel = 'scene-' + sceneStartFrame;
			fadeInEndLabel = 'scene-' + (sceneStartFrame + 1);
			scrollInStartLabel = 'scene-' + (sceneStartFrame + 1);
			scrollOutStartLabel = 'scene-' + (sceneStartFrame + 4);
			fadeOutStartLabel = 'scene-' + (sceneStartFrame + (framesPerScene - frameOverlap) * ( contentCount - 1 ) + 5);
			fadeOutEndLabel = 'scene-' + (sceneStartFrame + (framesPerScene - frameOverlap) * ( contentCount - 1 ) + 6);
			
			//if (panelNumber > 0 || sequenceNumber > 0) {
				timeline
				.add(TweenMax
					.from(panel, 0.1, {
						width: "0%"
					,	onStartParams: [panelNumber, panel],	onStart: function(){ if (true) { console.log('panel ' +  arguments[0] + ' width in start'); }}
					,	onCompleteParams: [panelNumber, panel],	onComplete: function(){ if (true) { console.log('panel ' +  arguments[0] + ' width in complete'); }}
					})
				, fadeInStartLabel
				);
			//}

			if (currCaption.length > 0) {
			
				if (debug) { console.log('sliding in caption at %o, sceneNumber %o', scrollInStartLabel, sceneNumber); }
				timeline
				.add(TweenMax
					.from(currCaption, 1, {
						autoAlpha: 0
					,	top: '100%'
 					,	onStartParams: [sceneNumber, currCaption],	onStart: function(){ if (debug) { console.log('caption ' +  arguments[0] + ' slide in start'); }}
 					,	onCompleteParams: [sceneNumber, currCaption],	onComplete: function(){ if (debug) { console.log('caption ' +  arguments[0] + ' slide in complete'); }}
					})
				,	scrollInStartLabel
				);

				if (debug) { console.log('sliding out caption at %o, sceneNumber %o', scrollOutStartLabel, sceneNumber); }
				timeline
				.add(TweenMax
					.to(currCaption, 2, {
						autoAlpha: 0
					,	top: '-100%'
 					,	onStartParams: [sceneNumber, currCaption],	onStart: function(){ if (debug) { console.log('caption ' +  arguments[0] + ' slide out start'); }}
 					,	onCompleteParams: [sceneNumber, currCaption],	onComplete: function(){ if (debug) { console.log('caption ' +  arguments[0] + ' slide out complete'); }}
					})
				,	scrollOutStartLabel
				);
				
			}

			if (currMedia.length > 0) {
				// fade in media
				
				video = null;
				
				if (currMedia.data('video')) {
				
					if (debug) { console.log('got replacement video', currMedia.data('video')); }
					
					img = $('img', currMedia);
					vidName = currMedia.data('video');
					mp4Url = vidBaseUrl + '/MP4/' + vidName + '.mp4';
					webmUrl = vidBaseUrl + '/WebM/' + vidName + '.WebM';
					imgUrl = img.attr('src');
					// replace img with video
					video = $('<video preload="auto" autoplay loop poster="assets/stills/screenshots/' + vidName + '.jpg">\
					<source src="' + mp4Url + '" type="video/mp4"></source>\
					<source src="' + webmUrl + '" type="video/webm"></source>\
					</video>');
					currMedia.append(video);
					img.remove();
					
					if (debug) { console.log('fading up volume at %o, sceneNumber %o', fadeInStartLabel, sceneNumber); }
					timeline
					.add(TweenMax
						.from(video, 1, {
							volume: 0
						,	onStartParams: [sceneNumber, video],	onStart: function(){ if (debug) { console.log('volume ' +  arguments[0] + ' fade up start'); }}
						,	onCompleteParams: [sceneNumber, video],	onComplete: function(){ if (debug) { console.log('volume ' +  arguments[0] + ' fade up complete'); }}
						})
					,	fadeInStartLabel
					)
					.call(checkVideo, ['fadeIn', video, sceneNumber, direction], null, fadeInStartLabel)
					;
					
					if (debug) { console.log('fading down volume at %o, sceneNumber %o', fadeOutStartLabel, sceneNumber); }
					timeline
					.add(TweenMax
						.to(video, 1, {
							volume: 0
						,	onStartParams: [sceneNumber, video],	onStart: function(){ if (debug) { console.log('volume ' +  arguments[0] + ' fade down start'); }}
						,	onCompleteParams: [sceneNumber, video],	onComplete: function(){ if (debug) { console.log('volume ' +  arguments[0] + ' fade down complete'); }}
						})
					,	fadeOutStartLabel
					)
					.call(checkVideo, ['fadeOut', video, sceneNumber, direction], null, fadeOutEndLabel)
					;
					
					
				}
				
				// bypass fadein if first video in first panel
				if (panelNumber > 0 || sequenceNumber > 0 || location.hash == '' || location.hash == '#' || location.hash == 'section-1') {
					if (debug) { console.log('fading in media at %o, sceneNumber %o', fadeInStartLabel, sceneNumber); }
					timeline
					.add(TweenMax
						.from(currMedia, 1, {
							autoAlpha: 0
						,	onStartParams: [sceneNumber, currMedia],	onStart: function(){ if (debug) { console.log('image ' +  arguments[0] + ' fade in start'); }}
						,	onCompleteParams: [sceneNumber, currMedia],	onComplete: function(){ if (debug) { console.log('image ' +  arguments[0] + ' fade in complete'); }}
						})
					,	fadeInStartLabel
					);
				}
				
				if (debug) { console.log('fading out media at %o, sceneNumber %o', fadeOutStartLabel, sceneNumber); }
				timeline
				.add(TweenMax
					.to(currMedia, 1, {
						autoAlpha: 0
					,	onStartParams: [sceneNumber, currMedia],	onStart: function(){ if (debug) { console.log('image ' +  arguments[0] + ' fade out start'); }}
					,	onCompleteParams: [sceneNumber, currMedia],	onComplete: function(){ if (debug) { console.log('image ' +  arguments[0] + ' fade out complete'); }}
					})
				, fadeOutStartLabel
				);

			}
			
			for (var contentNumber = 0; contentNumber < contentCount; contentNumber++) {
				
				// work out which labels this content happens at
				scrollInStartLabel = 'scene-' + ((sceneStartFrame + ((currMedia.length > 0) ? 1 : 0)) + (contentNumber * framesPerScene) - (contentNumber * frameOverlap));
				scrollOutStartLabel = 'scene-' + ((sceneStartFrame + ((currMedia.length > 0) ? 4 : 5)) + (contentNumber * framesPerScene) - (contentNumber * frameOverlap));
				
				content = $(currContent[contentNumber]);
				wrap = content.wrap('<div class="content-wrapper"></div>').parent();
				
				sceneNumber++;
				
 				if (debug) { console.log('scrolling in content at label %o, sceneNumber %o', scrollInStartLabel, sceneNumber); }
				timeline
				.add(TweenMax
					.from(wrap, 1, {
						autoAlpha: 0
					// ,	top: '100%'
					,	onStartParams: [sceneNumber, currContent],	onStart: function(){ if (debug) { console.log('content ' +  arguments[0] + ' scroll in start'); }}
					,	onCompleteParams: [sceneNumber, currContent],	onComplete: function(){ if (debug) { console.log('content ' +  arguments[0] + ' scroll in complete'); }}
					})
				,	scrollInStartLabel
				);

				if (debug) { console.log('scrolling out content at %o, sceneNumber %o', scrollOutStartLabel, sceneNumber); }
				timeline
				.add(TweenMax
					.to(wrap, 1, {
						autoAlpha: 0
					// ,	top: '-100%'
					,	onStartParams: [sceneNumber, currContent],	onStart: function(){ if (debug) { console.log('content ' +  arguments[0] + ' scroll out start'); }}
					,	onCompleteParams: [sceneNumber, currContent],	onComplete: function(){ if (debug) { console.log('content ' +  arguments[0] + ' scroll out complete'); }}
					})
				,	scrollOutStartLabel
				);
				
			}
			
			// make the panel 0 size again
			timeline
			.add(TweenMax
				.to(panel, 0.1, {
					width: "0%"
				,	onStartParams: [sceneNumber, panel],	onStart: function(){ if (true) { console.log('panel ' +  arguments[0] + ' width out start'); }}
				,	onCompleteParams: [sceneNumber, panel],	onComplete: function(){ if (true) { console.log('panel ' +  arguments[0] + ' width out complete'); }}
				})
			, fadeOutEndLabel
			);
			
		}
		
		// Create a scroll scene
		scene = new ScrollScene({ duration: totalDuration, offset: frameHeight })
		.triggerElement(sequence)
		.triggerHook('onCenter')
		.setPin(sequence)
		.setTween(timeline)
		.addTo(controller)
		.on('progress', function(e) {
			// console.log(e.scrollDirection);
			if (e.scrollDirection == 'FORWARD' || e.scrollDirection == 'REVERSE') {
				direction = e.scrollDirection;
			}
		});
 		// .addIndicators({suffix: 'seq'})
		;
		


		
	});

	
}