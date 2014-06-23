(function($){

	$.fn.sequence = function(_options) {
		
		// call this once per page. multiple invocations will result in a bad time.
		
		// console.log('defining sequence');
		
		var body = $('body')
		,	bodyDims = {}
		,	win = $(window)
		,	header = $('body > header')
		,	windowDims = {}
		, scrollDirection = 'FORWARD'
		, scrollState = 'BEFORE'
		,	defaultOptions = {
				controller: new ScrollMagic()
			,	contentWidth: 920
			,	contentHeight: 518
			,	breakPoint: 768			// window width above which scrollmagic kicks in
			,	debug: false
			,	logLevel: 2
			, onSceneStart: function() {}
			}
		,	options = $.extend({}, defaultOptions, _options)
		,	section = null
		,	sequences = null
		,	sequence = null
		,	panels = null
		,	panel = null
		,	lastWindowWidth = 0
		,	destroyed = true
		,	audioHolder = null
		,	loopAudio = true
		,	chapter1Preload = null
		,	remainderPreload = null
		,	mediaSources = []
		,	retryMax = 10 // will retry this many times to reload
		,	retryCount = 0
		, currAudioId = null
		,	currAudioSrc = null
		;
		
		// handle nav link clicks and scroll in the scene
		function openScene(e) {
			
			if (options.debug)
			{ console.log('openScene') }
			
			if (!destroyed) {
				setTimeout(function() {
					scrollPos = (location.hash == '#') ? '#the-mission' : location.hash;
					scrollPos = $(scrollPos);
					if (scrollPos.length && $('.sequence', scrollPos).length > 0) {
						$('html, body').animate({
							scrollTop: scrollPos.offset().top + $(window).height() * 1.8
						}, 500);
					}
				}, 500);
			}
		}
		
		// grab width and height of viewport
		function getWindowDims() {
			sizer = $('#sizer');
			windowDims.w = sizer.width();
			windowDims.h = sizer.height();
			windowDims.navH = header.height();
			windowDims.aspectRatio = windowDims.w / windowDims.h;
			windowDims.ratio16x9 = 16/9;
			windowDims.horizBoxing = windowDims.aspectRatio > windowDims.ratio16x9;
			return windowDims;
		}
		
		// update height, top, left, widths of viewport filling element
		function fixDims() {
		
			// console.log('fixDims');
		
			// adjust sequence elements to the dims of the window
			// adjust position of elements constrained to page width (atmos, image) - cw
			// adjust position of elements constrained to viewport (text, content video, page) - cw/ch
			
			d = getWindowDims();
			allSequences = $('.sequence');				// window w,h
			allAtmosPanels = $('.atmos');					// letterboxed to width
			allImagePanels = $('.image');					// letterboxed
			allVideoPanels = $('.video');					// letterboxed
			allTextPanels = $('.text-wrapper');	// constrained to window w, window h
			allContentVideos = $('.video video');	// contrained
			
			// these only exist if scrollmagic hasn't been destroyed - no condition to check.
			
			$('.scrollmagic-pin-spacer').css({ width: d.w, minWidth: d.w });
			
			// reset all to starting values
			allSequences.css({ height: 'initial', width: 'intitial', marginTop: 'initial', marginLeft: 'initial' });
			allAtmosPanels.css({ height: 'initial', width: 'intitial', marginTop: 'initial', marginLeft: 'initial' });
			allImagePanels.css({ height: 'initial', width: 'intitial', marginTop: 'initial', marginLeft: 'initial' });
			allTextPanels.css({ height: 'initial', width: 'intitial', marginTop: 'initial', marginLeft: 'initial' });
			allSequences.css({ height: 'initial', width: 'intitial', marginTop: 'initial', marginLeft: 'initial' });
			allContentVideos.css({ height: 'initial', width: 'intitial', marginTop: 'initial', marginLeft: 'initial' });
			
			if (d.w > options.breakPoint) {
			
				// console.log('setting dims', d.w, d.h, options.breakPoint, destroyed);
				
				constrW = {} // constrain width - letterbox top and bottom
				constrW.width = d.w;
				constrW.marginLeft = 0;
				constrW.height = Math.ceil(d.w / d.ratio16x9);
				constrW.marginTop = ((d.h - (d.w / d.ratio16x9)) / 2) + (d.navH / 2);

				constrH = {} // constrain width - letterbox left and right
				constrH.height = d.h - d.navH;
				constrH.marginTop = d.navH;
				constrH.width = Math.floor((d.h - d.navH) * d.ratio16x9);
				constrH.marginLeft = (d.w - ((d.h - d.navH) * d.ratio16x9)) / 2;
				
				// console.log('constrW: %o', constrW);
				// console.log('constrH: %o', constrH);

				// fit the constrained elems to the window regardless of whether we have scrollmagic
				
				// letterbox left and right - fix the left and width
				// letterbox top and bottom - fix the top and height
				allContentVideos.css(d.horizBoxing ? constrH : constrW);
				allImagePanels.css(d.horizBoxing ? constrH : constrW);
				allAtmosPanels.css(d.horizBoxing ? constrH : constrW);
				
				// sequences are made to fit the viewport
				if (!destroyed) {
					// console.log('fixing atmos, image', allAtmosPanels[0])
					allSequences.css({width: d.w, height: d.h});
					allTextPanels.css(d.horizBoxing ? constrH : constrW);
				}
				allSequences.css({left: 0});
				
			}
			
			// we want to call updateScenes if the body width has passed over the
			if (lastWindowWidth < options.breakPoint && d.w > options.breakPoint) {
				// createScenes();
			}
			if (lastWindowWidth > options.breakPoint && d.w < options.breakPoint) {
				destroyScenes();
			}
			
			// store for next resize
			lastWindowWidth = d.w;
			
		}
		/*
		function createScenes() {
		
			console.log('enabling scenes');
			
			allSequences = $('.sequence');
			
			$.each(allSequences, function(ix, sequence) {
			
				sequence = $(sequence);
				
				sequenceTimeline = sequence.data('timeline');
				sequenceScene = sequence.data('scene');
				
				if (typeof(sequenceScene) !== 'undefined') {
					console.log('live');
					sequenceScene.addTo(options.controller);
				}
				
			});

		}
		*/
		function destroyScenes() {
		
			console.log('destroying scenes');
			
			allSequences = $('.sequence');
			
			$('.panel', allSequences).removeClass('enhanced');
			
			$.each(allSequences, function(ix, sequence) {
			
				sequence = $(sequence);
				
				sequenceScene = sequence.data('scene');
				
				if (typeof(sequenceScene) !== 'undefined') {
					console.log('die');
					sequenceScene.removeTween(true)
					sequenceScene.remove();
					sequenceScene.destroy(true);
				}
				
			});
			
			// reset the tween opacities - destroy is not removing the tweens 
			$('.panel, .text-wrapper, .caption').css({'opacity': 'initial', 'visibility': 'initial'});
			
			destroyed = true;
			
		}
		
		function contentHandler(sceneNumber, timelineString, panel) {
			if (options.debug)
			{ console.log('content timeline %i %s', sceneNumber, timelineString); }
		}
		
		function panelHandler(sceneNumber, timelineString, panel) {
			if (options.debug)
			{ console.log('panel timeline %i %s %s %s',  sceneNumber, timelineString, scrollDirection, scrollState); }
		}
		
		function contentTweenHandler(sceneNumber, timelineString, panel) {
			if (options.debug)
			{ console.log('content tween %i %s', sceneNumber, timelineString); }
		}
		
		function panelTweenHandler(sceneNumber, timelineString, panel) {
			if (options.debug)
			// if (arguments[0] == 0)
			{ console.log('panel tween %i %s', sceneNumber, timelineString); }
			
			atmos = $('.atmos video', panel);
			audioIn = panel.hasClass('audio-in') ? panel.data('audio') : false;
			audioOut = panel.hasClass('audio-out');
			
			if (timelineString == 'FADEINSTART') {
				if (atmos.length) {
					playVideo(video.attr('id'));
				}
				if (audioIn) {
					playAudio(audioIn);
				}
			}
			if (timelineString == 'FADEOUTSTART') {
				if (atmos.length) {
					stopVideo(video.attr('id'));
				}
				if (audioOut) {
					stopAudio();
				}
			}
			
		}
		
		function setupSequence(sectionIx, section) {
		
			// passed a section containing panels fixed to viewport,.
			// panels can contain video, atmos video or img which appear with it
			// atmos video and img are letterboxed to the width of the viewport,
			// letterboxing top and bottom of viewport.
			// panels can also contain multiple text or caption which fade in one frame after
			// and out one frame before the panel.
			// panel fades in for scroll equivalent of half the viewport
			
			destroyed = false;
		
			section = $(section);
			
			sequences = $('.sequence', section);
			
			$('.panel', sequences).addClass('enhanced');
			
			$.each(sequences, function(sequenceNumber, sequence) {
			
				sequence = $(sequence); 
				// console.log(section, sequence, sequenceIx);
				
				panels = $('.panel', sequence);
				
				// work out the number of transitions
				sceneCount = 0;
				for (var panelNumber = 0, panelCount = panels.length; panelNumber < panelCount; panelNumber++) {
					panel = $(panels[panelNumber]);
					sceneCount += Math.max($('.text', panel).length, $('.caption', panel).length, $('.image', panel).length, $('.video', panel).length, $('.portrait-image', panel).length);
				}
				framesPerScene = 6; // the number of frames in a scene
				frameOverlap = 1; // the number of frames which overlap between scenes
				frameHeight = (windowDims.h / 2); // the height of a 'scene' in pixels (half a window height)

				frameCount = (sceneCount * framesPerScene) - (sceneCount - 1) * frameOverlap;
				totalDuration = frameCount *  frameHeight;

				// Create a timeline for the fade tweens to happen on
				last_label = '0';
				timeline = new TimelineMax({paused: false, onUpdate: options.debug ? function() {
					new_label = parseInt(this.time(), 10);
					if (new_label != last_label) {
						console.log('sequence update',this.time(), this.currentLabel());
						last_label = new_label;
					}
				} : function(){} });

				if (options.debug) { console.log('----------------------'); }
				if (options.debug) { console.log('addressing sequenceNumber: %o', sequenceNumber); }
				
				// Add a label (timestamp) for each sceneCount x framesPerScene - (sceneCount - 1) * frameOverlap	
				for (var frameIx = -1; ++frameIx <= frameCount;) {
					// labels offset from 0 - ie first is scene-0
					timeline.add('seq-scene-' + frameIx, frameIx);
					// if (options.debug) { console.log('adding scene-%i', frameIx); }
				}
				
				// sceneNumber is the overlapping set of frames - one per content
				for (var panelNumber = 0, panelCount = panels.length, sceneNumber = 0; panelNumber < panelCount; panelNumber++) {
		
					panel = $(panels[panelNumber]);
					if (options.debug) { console.log('addressing panelNumber: %o', panelNumber); }
			
					currMedia = $('.image, .atmos, .video', panel);
					currContent = $('.text-wrapper, .sketch, .page, .caption', panel);
					// currCaption = $('.caption', panel);
			
					contentCount = currContent.length > 0 ? currContent.length : 1;
					if (options.debug) { console.log('contentCount: ' , contentCount); }
			
					// this scene's animation starts at framesPerScene * (sceneCount - 1) - (sceneCount - 1) * frameOverlap
					sceneStartFrame = (framesPerScene * sceneNumber) - (sceneNumber * frameOverlap);
					// console.log('sceneNumber: %o sceneStartFrame: %o', sceneNumber, sceneStartFrame);
			
					fadeInStartLabel = 'seq-scene-' + sceneStartFrame;
					fadeInEndLabel = 'seq-scene-' + (sceneStartFrame + 1);
					scrollInStartLabel = 'seq-scene-' + (sceneStartFrame + 1);
					scrollOutStartLabel = 'seq-scene-' + (sceneStartFrame + 4);
					fadeOutStartLabel = 'seq-scene-' + (sceneStartFrame + (framesPerScene - frameOverlap) * ( contentCount - 1 ) + 5);
					fadeOutEndLabel = 'seq-scene-' + (sceneStartFrame + (framesPerScene - frameOverlap) * ( contentCount - 1 ) + 6);
					
					if (options.debug) { console.log('fading in panel at %o, sceneNumber %o', fadeInStartLabel, sceneNumber); }
					timeline
					.add(TweenMax
						.from(panel, 1, {
							autoAlpha: 0
						,	onStartParams: [sceneNumber, 'FADEINSTART', panel],	onStart: panelTweenHandler
						,	onCompleteParams: [sceneNumber, 'FADEINCOMPLETE', panel],	onComplete: panelTweenHandler
						,	onReverseCompleteParams: [sceneNumber, 'FADEINREVERSECOMPLETE', panel],	onReverseComplete: panelTweenHandler
						})
					,	fadeInStartLabel
					).call(panelHandler, [sceneNumber, 'FADEOUT', panel]);
					
					if (options.debug) { console.log('fading out panel at %o, sceneNumber %o', fadeOutStartLabel, sceneNumber); }
					timeline
					.add(TweenMax
						.to(panel, 1, {
							autoAlpha: 0
						,	onStartParams: [sceneNumber, 'FADEOUTSTART', panel],	onStart: panelTweenHandler
						,	onCompleteParams: [sceneNumber, 'FADEOUTCOMPLETE', panel],	onComplete: panelTweenHandler
						,	onReverseCompleteParams: [sceneNumber, 'FADEOUTREVERSECOMPLETE', panel],	onReverseComplete: panelTweenHandler
						})
					, fadeOutStartLabel
					).call(panelHandler, [sceneNumber, 'FADEOUT', panel]);
					
					for (var contentNumber = 0; contentNumber < contentCount; contentNumber++) {
					
						// work out which labels this content happens at
						scrollInStartLabel = 'seq-scene-' + ((sceneStartFrame + ((currMedia.length > 0) ? 1 : 0)) + (contentNumber * framesPerScene) - (contentNumber * frameOverlap));
						scrollOutStartLabel = 'seq-scene-' + ((sceneStartFrame + ((currMedia.length > 0) ? 4 : 5)) + (contentNumber * framesPerScene) - (contentNumber * frameOverlap));
						
						content = $(currContent[contentNumber]);
						
						sceneNumber++;
						
						if (options.debug) { console.log('fading in content at label %o, sceneNumber %o', scrollInStartLabel, sceneNumber); }
						timeline
						.add(TweenMax
							.from(content, 1, {
								autoAlpha: 0
							// ,	top: '100%'
							,	onStartParams: [sceneNumber, 'FADEINSTART', currContent],	onStart: contentTweenHandler
							,	onCompleteParams: [sceneNumber, 'FADEINCOMPLETE', currContent],	onComplete: contentTweenHandler
							})
						,	scrollInStartLabel
						).call(contentHandler, [sceneNumber, 'FADEIN', content]);

						if (options.debug) { console.log('fading out content at %o, sceneNumber %o', scrollOutStartLabel, sceneNumber); }
						timeline
						.add(TweenMax
							.to(content, 1, {
								autoAlpha: 0
							// ,	top: '-100%'
							,	onStartParams: [sceneNumber, 'FADEOUTSTART', currContent],	onStart: contentTweenHandler
							,	onCompleteParams: [sceneNumber, 'FADEOUTCOMPLETE', currContent],	onComplete: contentTweenHandler
							})
						,	scrollOutStartLabel
						).call(contentHandler, [sceneNumber, 'FADEOUT', content]);
			
					}

				}
				
				// Store the timeline in the sequence's data store
				sequence.data('timeline', timeline);
				
				// in the sequence's data store 
				sequence.data('scene', new ScrollScene({ duration: totalDuration, offset: frameHeight })
					.triggerElement(sequence)
					.triggerHook('onCenter')
					.setPin(sequence)
					.setTween(timeline)
					.addTo(options.controller)
					.on('progress', function(e) {
						// console.log(e);
						scrollDirection = e.scrollDirection;
						scrollState = e.state;
					})
					.loglevel(options.logLevel)
				);
				if (options.debug) {
					sequence.data('scene').addIndicators({suffix: 'seq'});
				}
					
			});
			
		}
		
		// Setup the resize handlers to fix geometry of panels in the sequence
		
		// grab the window dimensions
		d = getWindowDims();
		// store for comparing on resize
		lastWindowWidth = d.w;
		// handle the resize event
		$(window).on('resize', fixDims);
		
		// jquery plugin init this' elements
		ret = this;
		// only setup the sequence and timeline if over breakpoint width
		if (d.w > options.breakPoint) {
			ret = this.each(setupSequence);
		}
		
		// fix the dimensions of the fixed elements and their children
		$(window).trigger('resize');
		
		
		/*
		
		audio mp3, atmos videos, content videos:
		strategy: replace images in atmos with video tags. no source.
		
		*/
		
		function playVideo(id) {
			// if have not yet encountered vid, preload the video and 
			// then call addSource when the element is loaded
			// else add source tags to video tags
			if (options.debug)
			{ console.log('playVideo'); }
		}
		
		function stopVideo() {
			// remove source tags from video tag
			if (options.debug)
			{ console.log('stopVideo'); }
		}
		
		function removeAudio(_audio) {
		
			var victim = $('#' + _audio.attr('id'));
			
			if (victim.length > 0) {
				if (options.debug)
				{ console.log('removeAudio()', victim); }
				victim.get(0).pause();
				sources = $("source", victim);
				for (var i = 0; i < sources.length; i++) {
						var source = sources[i];
						source.setAttribute("src", "");
				}
				victim.remove();
				victim = null;
				_audio = null;
			}
			
		}
		
		function stopAudio() {
		
			// when we call stop, we want to fade out, and remove the audio el via removeAudio
			audio = $('#' + currAudioId);
			
			if (audio.length > 0) {
				if (options.debug)
				{ console.log('stopAudio()', currAudioId); }
				audio.hide();
				TweenMax
				.to(audio, 1, {
						volume: 0
					,	onComplete: removeAudio
					,	onCompleteParams: [audio]
				});
				
			}
			
		}
		
		function playAudio(audioId) {
			
			audioSrc = mediaSources[audioId];
			
			if (location.search.indexOf('audio=off') > -1) {
				return;
			}
			
			if (typeof(audioSrc) == 'undefined') {
				// it hasn't loaded yet - can't play.
				if (options.debug)
				{ console.log('playAudio() cannot play %s - retrying', audioId); }
				// retry a max of ten times
				retryCount += 1;
				if (retryCount < retryMax) {
					setTimeout(playAudio, 1000, audioId);
				}
				else {
					retryCount = 0;
				}
				
			}
			else
			{
				
				if (options.debug)
				{ console.log('playAudio() - trying to play id ', audioId); }
				
				// we're want to play a new one - fade out any old
				existing = $('#' + currAudioId, audioHolder);
				
				if (existing.length > 0) {
				
					if (existing.attr('id') == audioId) {
						// we are trying to play the same sound - leave it alone
						if (options.debug)
						{ console.log('playAudio() - same id request - leaving it'); }
						existing.get(0).volume = 1;
						return;
					}
					else {
						// fade out and remove the playing audio
						if (options.debug)
						{ console.log('playAudio() - new id is different so removing existing', existing.attr('id')); }
						existing.hide();
						TweenMax
						.to(existing, 1, {
								volume: 0
							,	onComplete: removeAudio
							,	onCompleteParams: [existing]
						});
					}
					
				}
				
				currAudioId = audioId;
				currAudioSrc = audioSrc;
				
				// now append a new audio element
				audio = $('<audio id="' + audioId + '" preload="auto" controls="controls" poster="chapter"><source src="' + audioSrc + '" /></audio>').appendTo(audioHolder);
				if (audio.length > 0) {
					audio.get(0).load();
					audio.get(0).volume = 1;
					audio.get(0).play();
					TweenMax.to(audio, 1, { volume: 1 });
					if (options.debug)
					{ console.log('playAudio() - %s should be playing', audioId); }
				}
			}
			
		}
		
		function addMediaElement( obj, el ) {
		
			switch (obj.type) {
				case 'AUDIO':
						
					if (options.debug)
					{ console.log('loaded audio', obj.name); }
					mediaSources[obj.name] = obj.source;

					break;
					
				case 'VIDEO':
				
					// find the video in the 
					if (options.debug)
					{ console.log('loaded video', obj.name); }
					mediaSources[obj.name] = obj.source;
				
					break;
			}
			
		}
				// Preload the first audio and video track and insert as they are ready.
		// When the loader is complete (whether it work or not), add them to the page, and 
		// start the scroll to the first scene which will try and play them if they are there
		
		function pageStartComplete() {
		
			if (options.debug)
			{ console.log('loaded initial files - starting remaining'); }
			
			remainderPreload = $.html5Loader({
	
				filesToLoad:'assets/html5/preload-2.json',
				debugMode: false,
				onElementLoaded: addMediaElement
		
			});
			
			// we got the opening track - cue it by scrolling in the opening scene
			setTimeout(function() {
				if (options.debug)
				{ console.log('fade in article'); }
				// fade in the article
				TweenMax.to('article, ul.nav', 2, {autoAlpha: 1});
				// scroll into current screen
				openScene();
			}, 1000);
			
		}
		

		// Handle scrolling into scene on nav clicks
		$('nav a').on('click', openScene);
		
		// Begin! hide the article
		TweenMax.to('article, ul.nav', 0, {autoAlpha: 0});
		
		// create the audio holder
		audioHolder = $('<div id="audio-holder"></div>').appendTo(body);

		// Preload chapter 1 media
		chapter1Preload = $.html5Loader({
		
			filesToLoad:'assets/html5/preload-1.json',
			debugMode: false,
			onComplete: pageStartComplete,
			onElementLoaded: addMediaElement
			
		});
		
		
		
		return ret;

		
	}

})(jQuery);