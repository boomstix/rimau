(function($){

	$.fn.sequence = function(_options) {
		
		var body = $('body')
		,	bodyDims = {}
		,	win = $(window)
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
			}
		,	options = $.extend({}, defaultOptions, _options)
		,	section = null
		,	sequences = null
		,	sequence = null
		,	panels = null
		,	panel = null
		, lastWindowWidth = 0
		, destroyed = true;
		;

		function openScene(e) {
			// e.preventDefault();
			if (!destroyed) {
				setTimeout(function() {
					scrollPos = (location.hash == '' || location.hash == '#') ? '#the-mission' : location.hash;
					scrollPos = $(scrollPos);
					if (scrollPos.length && $('.sequence', scrollPos).length > 0) {
						$('html, body').animate({
							scrollTop: scrollPos.offset().top + $(window).height() * 2
						}, 500);
					}
				}, 500);
			}
		}
		
		function getWindowDims() {
			windowDims = { w: body.width(), h: win.height() };
			return windowDims;
		}
		
		function fixDims() {
		
			// console.log('fixDims');
		
			// adjust the letterbox-ed position of the letter-boxing elements
			// adjust the sequence frame to the dims of the window
			d = getWindowDims();
			allSequences = $('.sequence');
			allAtmosPanels = $('.atmos');
			allTextPanels = $('.text-wrapper');
			allImagePanels = $('.image');
			allVideoPanels = $('.video');
			allContentVideos = $('.video video');
			
			$('.scrollmagic-pin-spacer').css({ width: d.w, minWidth: d.w });
				
			if (d.w > options.breakPoint) {
			
				// console.log('setting dims');
				newHeight = d.w * 9 / 16;
				newTop = (d.h - newHeight) / 2;
				
				// fit the videos to the midpoint if over video max-width (920px)
				allContentVideos.css({
					marginLeft: (d.w > options.contentWidth) ? (d.w - options.contentWidth) / 2 : 0
				,	marginTop: (!destroyed) ? (d.h - options.contentHeight) / 2 : 0
				})
				
				// sequences are made to fit the viewport
				if (!destroyed) {
					// atmos panels are letterboxed - fitting the width of the viewport
					// and forcing the height to maintain 16x9, moving its top pos
					// above or below the containing panel's top to compensate.
					allAtmosPanels.css({height: newHeight, top: newTop });
					allImagePanels.css({height: newHeight, top: newTop });
					allTextPanels.css({height: newHeight + 1, top: newTop });
					allSequences.css({width: d.w, height: d.h});
				}
				allSequences.css({left: 0});
				
			}
			else {
			
				// console.log('un-setting dims');
				allAtmosPanels.css({height: 'initial', top: 'initial' });
				allImagePanels.css({height: 'initial', top: 'initial' });
				allTextPanels.css({height: 'initial', top: '' });
				allSequences.css({width: 'initial', height: 'initial'});
				allContentVideos.css({marginTop: 'initial', marginLeft: 'initial'});

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
		
		function playVideo() {
			// atmos
			// if have not yet encountered vid, preload the video and 
			// then call addSource when the element is loaded
			// else add source tags to video tags
		}
		
		function stopVideo() {
			// remove source tags from video tag
		}
		
		function contentHandler() {
			if (options.debug)
			{ console.log('content timeline %i %s', arguments[0], arguments[1]); }
		}
		
		function panelHandler() {
			// if (options.debug)
			{ console.log('panel timeline %i %s',  arguments[0], arguments[1]); }
		}
		
		function contentTweenHandler() {
			if (options.debug)
			{ console.log('content tween %i %s', arguments[0], arguments[1]); }
		}
		
		function panelTweenHandler() {
			if (options.debug)
			{ console.log('panel tween %i %s',  arguments[0], arguments[1]); }
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
						})
					,	fadeInStartLabel
					).call(panelHandler, [sceneNumber, 'FADEOUT', panel], null, fadeInStartLabel);
					
					if (options.debug) { console.log('fading out panel at %o, sceneNumber %o', fadeOutStartLabel, sceneNumber); }
					timeline
					.add(TweenMax
						.to(panel, 1, {
							autoAlpha: 0
						,	onStartParams: [sceneNumber, 'FADEOUTSTART', panel],	onStart: panelTweenHandler
						,	onCompleteParams: [sceneNumber, 'FADEOUTCOMPLETE', panel],	onComplete: panelTweenHandler
						})
					, fadeOutStartLabel
					).call(panelHandler, [sceneNumber, 'FADEOUT', panel], null, fadeOutStartLabel);
					
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
						).call(contentHandler, [sceneNumber, 'FADEIN', content], null, scrollInStartLabel);

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
						).call(contentHandler, [sceneNumber, 'FADEOUT', content], null, scrollOutStartLabel);
			
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
		
		// grab the window dimensions and store for comparing on resize
		d = getWindowDims();
		lastWindowWidth = d.w;
		
		// fix the dimensions of the fixed elements and their children
		$(window).on('resize', fixDims);
		$(window).trigger('resize');
		
		ret = this;
			// setup the sequence and timeline if over breakpoint width
		if (d.w > options.breakPoint) {
			ret = this.each(setupSequence);
		}
		
		$(window).trigger('resize');
		
		// handle scrolling into scene on nav clicks
		$('nav a').on('click', openScene);
		// scroll into current screen
		openScene();
		
		return ret;

		
	}

})(jQuery);