(function($){

	$.fn.sequence = function(_options) {
		
		// call this once per page. multiple invocations will result in a bad time.
		
		// console.log('defining sequence');
		
		var defaultOptions = {
				controller: new ScrollMagic()
			,	contentWidth: 920
			,	contentHeight: 518
			,	breakPoint: 768			// window width above which scrollmagic kicks in
			,	sizerId: '#sizer'		// abs positioned div
			,	debug: false
			,	logLevel: 2
			, onSceneStart: function() {}
			}
		,	options = $.extend({}, defaultOptions, _options)
		,	body = $('body')
		,	bodyDims = {}
		,	win = $(window)
		,	header = $('body > header')
		,	windowDims = {}
		,	sizer = $('#sizer')
		,	scrollDirection = 'FORWARD'
		,	scrollState = 'BEFORE'
		,	section = null
		,	sequences = null
		,	sequence = null
		,	panels = null
		,	panel = null
		,	lastWindowWidth = 0
		,	destroyed = true
		,	audioHolder = null
		,	loopAudio = true
		,	currAudioId = null
		,	currAudioSrc = null
		,	chapter1Preload = null
		,	remainderPreload = null
		,	mediaSources = []
		,	retryCount = []
		,	retryMax = 10 // will retry this many times to reload
		,	startTime = new Date()
		;
		
		function highlightNav(sectionId) {
			
			if (options.debug)
			{ console.log('highlightNav()', sectionId); }
			
			$('nav a').removeClass('active');
			$('nav a[href="#' + sectionId + '"]').addClass('active');
			
		}

		
		function openSection(sectionId, speed) {

			if (options.debug)
			{ console.log('openSection()', sectionId, speed) }
			
			var scrollPos = $(sectionId);
			speed = speed || 500;
			if (scrollPos.length && $('.sequence', scrollPos).length > 0) {
				$('html, body').delay(500).animate({
					scrollTop: scrollPos.offset().top + win.height()
				}, speed);
			}
			
		}
		
		// handle nav link clicks and scroll in the scene
		function handleNav(e) {
			
			if (!destroyed) {
				setTimeout(openSection, 500, $(e.currentTarget).attr('href'));
			}
		}
		
		// grab width and height of viewport
		function getWindowDims() {
			
			windowDims.w = sizer.width();
			windowDims.h = sizer.height();
			windowDims.navH = header.height();
			windowDims.aspectRatio = windowDims.w / windowDims.h;
			windowDims.ratio16x9 = 16/9;
			windowDims.horizBoxing = windowDims.aspectRatio > windowDims.ratio16x9;
			return windowDims;
			
		}
		
		// calculates letterboxing considering the nav height
		function calculateConstraints() {
				
				d = getWindowDims();
				
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
				
				return { toWidth: constrW, toHeight: constrH };
		}
		
		// update height, top, left, widths of position:fixed viewport filling elements
		function fixDims() {
		
			// console.log('fixDims');
		
			// adjust sequence elements to the dims of the window
			// adjust position of elements constrained to page width (atmos, image) - cw
			// adjust position of elements constrained to viewport (text, content video, page) - cw/ch
			
			allSequences = $('.sequence');				// window w,h
			allAtmosPanels = $('.atmos');					// letterboxed to width
			allImagePanels = $('.image');					// letterboxed
			allVideoPanels = $('.video');					// letterboxed
			allTextPanels = $('.text-wrapper');	// constrained to window w, window h
			allContentVideos = $('div.video video');	// contrained
			
			// these only exist if scrollmagic hasn't been destroyed - no condition to check.
			
			// reset all to starting values
			var resetCss = { height: 'initial', width: 'intitial', marginTop: 'initial', marginLeft: 'initial' };
			allSequences.css(resetCss);
			allSequences.css(resetCss);
			allAtmosPanels.css(resetCss);
			allImagePanels.css(resetCss);
			allTextPanels.css(resetCss);
			allContentVideos.css(resetCss);
			
			d = getWindowDims();
			$('.scrollmagic-pin-spacer').css({ width: d.w, minWidth: d.w });
			
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
				
				constraints = calculateConstraints();
				
				// console.log('constrW: %o', constrW);
				// console.log('constrH: %o', constrH);

				// fit the constrained elems to the window regardless of whether we have scrollmagic
				
				// letterbox left and right - fix the left and width
				// letterbox top and bottom - fix the top and height
				allContentVideos.css(d.horizBoxing ? constraints.toHeight : constraints.toWidth);
				allImagePanels.css(d.horizBoxing ? constraints.toHeight : constraints.toWidth);
				allAtmosPanels.css(d.horizBoxing ? constraints.toHeight : constraints.toWidth);
				
				// sequences are made to fit the viewport
				if (!destroyed) {
					// console.log('fixing atmos, image', allAtmosPanels[0])
					allSequences.css({width: d.w, height: d.h});
					constraints.toHeight.height += 1;
					constraints.toWidth.height += 1;
					allTextPanels.css(d.horizBoxing ? constraints.toHeight : constraints.toWidth);
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
		
		// undo scrollmagic 
		function destroyScenes() {
		
			if (options.debug)
			{ console.log('destroyScenes()'); }
			
			allSequences = $('.sequence');
			
			// enhanced class is used in css for elements with enhanced functionality
			$('.panel', allSequences).removeClass('enhanced');
			
			$.each(allSequences, function(ix, sequence) {
			
				sequence = $(sequence);
				
				sequenceScene = sequence.data('scene');
				
				if (typeof(sequenceScene) !== 'undefined') {
					if (options.debug)
					{ console.log('die'); }
					sequenceScene.removeTween(true);
					sequenceScene.remove();
					sequenceScene.destroy(true);
					sequence.css({position:'relative'})
				}
				
			});
			
			// reset the tween opacities - destroy is not removing the tweens properly
			$('.panel, .text-wrapper, .caption').css({'opacity': 'initial', 'visibility': 'initial'});
			
			// re-add video controls
			$('div.video video').attr('controls','controls');
			
			destroyed = true;
			
		}
		
		function contentHandler(sceneNumber, timelineString, panel) {
			if (options.debug)
			{ console.log('content timeline %i %s', sceneNumber, timelineString); }
		}
		
		function panelHandler(sceneNumber, timelineString, panel) {
			if (options.debug)
			{ console.log('panel timeline %i %s %s %s',  sceneNumber, timelineString, scrollDirection, scrollState); }
			
			var section = panel.parents('section')
			,	sectionId = section.attr('id')
			;
			
			highlightNav(sectionId);
			
		}
		
		function contentTweenHandler(sceneNumber, timelineString, panel) {
			if (options.debug)
			{ console.log('content tween %i %s', sceneNumber, timelineString); }
		}
		
		function panelTweenHandler(sceneNumber, timelineString, panel) {
			if (options.debug)
			{ console.log('panel tween %i %s', sceneNumber, timelineString); }
			
			contentVideo = $('.video video', panel);
			atmosVideo = $('.atmos video', panel);
			audioIn = panel.hasClass('audio-in') ? panel.data('audio') : false;
			audioOut = panel.hasClass('audio-out');
			audioLoop = panel.hasClass('audio-in') ? panel.data('audio-loop') : false;
			
			
			// we are entering the panel in the forward direction
			if (timelineString == 'FADEINSTART') {
				if (audioIn) {
					playAudio(audioIn, audioLoop);
				}
				if (atmosVideo.length) {
					playAtmosVideo(atmosVideo.attr('id'));
				}
			}
			
			// we have entered the panel in the forward direction
			if (timelineString == 'FADEINCOMPLETE') {
				if (contentVideo.length) {
					playContentVideo(contentVideo.attr('id'));
				}
			}
			
			
			// we are leaving the panel in the forward direction
			if (timelineString == 'FADEOUTSTART') {
				if (contentVideo.length) {
					stopContentVideo(contentVideo.attr('id'));
				}
				if (audioOut) {
					stopAudio();
				}
				// stop any doco that is playing
				stopDocoVideo();
			}
			
			// we have left the panel in the forward direction
			if (timelineString == 'FADEOUTCOMPLETE') {
				if (atmosVideo.length) {
					stopAtmosVideo(atmosVideo.attr('id'));
				}
			}
			
			// we have entered the panel in the reverse direction
			if (timelineString == 'FADEOUTREVERSECOMPLETE') {
				if (contentVideo.length) {
					stopContentVideo(contentVideo.attr('id'));
				}
				// stop any doco that is playing
				stopDocoVideo();
			}
			
			// we have left the panel in the reverse direction
			if (timelineString == 'FADEINREVERSECOMPLETE') {
				if (atmosVideo.length) {
					stopAtmosVideo(atmosVideo.attr('id'));
				}
				if (contentVideo.length) {
					stopContentVideo(contentVideo.attr('id'));
				}
				if (audioIn) {
					stopAudio();
				}
				// stop any doco that is playing
				stopDocoVideo();
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
			
			// enhanced class is used in css for elements with enhanced functionality
			$('.panel', sequences).addClass('enhanced');
			
			$.each(sequences, function(sequenceNumber, sequence) {
			
				sequence = $(sequence); 
				
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
				totalDuration = frameCount * frameHeight * 2 / 3;

				// Create a timeline for the fade tweens to happen on
				last_label = '0';
				timeline = new TimelineMax({paused: false, onUpdate: options.debug ? function() {
					new_label = parseInt(this.time(), 10);
					if (new_label != last_label) {
						console.log('sequence update',this.time(), this.currentLabel());
						last_label = new_label;
					}
				} : function(){} });
				
				// timeline.call(sectionHandler, [sequence, 'START']);

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
			
					contentCount = currContent.length > 0 ? currContent.length : 1;
			
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
					,	fadeInStartLabel)
					.call(panelHandler, [sceneNumber, 'FADEIN', panel]);
					
					if (options.debug) { console.log('fading out panel at %o, sceneNumber %o', fadeOutStartLabel, sceneNumber); }
					timeline
					.add(TweenMax
						.to(panel, 1, {
							autoAlpha: 0
						,	onStartParams: [sceneNumber, 'FADEOUTSTART', panel],	onStart: panelTweenHandler
						,	onCompleteParams: [sceneNumber, 'FADEOUTCOMPLETE', panel],	onComplete: panelTweenHandler
						,	onReverseCompleteParams: [sceneNumber, 'FADEOUTREVERSECOMPLETE', panel],	onReverseComplete: panelTweenHandler
						})
					, fadeOutStartLabel)
					.call(panelHandler, [sceneNumber, 'FADEOUT', panel]);
					
					for (var contentNumber = 0; contentNumber < contentCount; contentNumber++) {
					
						// work out which labels this content happens at
						scrollInStartLabel = 'seq-scene-' + ((sceneStartFrame + ((currMedia.length > 0) ? 1 : 0)) + (contentNumber * framesPerScene) - (contentNumber * frameOverlap));
						scrollOutStartLabel = 'seq-scene-' + ((sceneStartFrame + ((currMedia.length > 0) ? 4 : 5)) + (contentNumber * framesPerScene) - (contentNumber * frameOverlap));
						
						content = $(currContent[contentNumber]);
						
						sceneNumber++;
						
						if (options.debug) { console.log('fading in content at label %o, sceneNumber %o', scrollInStartLabel, sceneNumber); }
						timeline.add(TweenMax.from(content, 1, { autoAlpha: 0 }),	scrollInStartLabel);

						if (options.debug) { console.log('fading out content at %o, sceneNumber %o', scrollOutStartLabel, sceneNumber); }
						timeline.add(TweenMax.to(content, 1, { autoAlpha: 0 }),	scrollOutStartLabel);
			
					}
					
				}
				
				// timeline.call(sectionHandler, [sequence, 'END']);

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
		
		/*
		
		audio mp3, atmos videos, content videos:
		strategy: replace images in atmos with video tags. no source.
		
		*/
		
		function playDocoVideo(e) {
		
			// if (options.debug)
			{ console.log('playDocoVideo()', this); }
			
			var origVideoEl = $(this).data('orig-video');

			// fade out the text panel holding the menu
			TweenMax.to($('.doco .text'), 1, { autoAlpha: 0 });
			
			// fade in a video element
			var videoEl = $(origVideoEl).appendTo($('.doco'));
			if (videoEl.length > 0) {
				$(videoEl).get(0).volume = 0;
				$(videoEl).get(0).play();
				TweenMax
				.to(videoEl, 1
				,	{
						autoAlpha: 1
					,	volume: 1
				});
				TweenMax.to('#doco-closer', 1, { autoAlpha: 1 });
			}
		}
		
		function stopDocoVideo() {
			
			if (options.debug)
			{ console.log('stopDocoVideo'); }
			
			TweenMax.to('.doco .text', 1, { autoAlpha: 1 });
			TweenMax.to('#doco-closer', 1, { autoAlpha: 0 });

			// stop the video, fade out, and remove from dom when complete.
			videoEl = $('.doco video');
			TweenMax.to(videoEl, 1
			,	{
					volume: 0
				,	autoAlpha: 0
				,	overwrite: 'all'
				,	onComplete: function(vid) {
						var videoEl = $(vid);
						if (videoEl.length > 0) {
							videoEl.get(0).pause();
						}
						$(vid).remove();
					}
				,	onCompleteParams: videoEl
			});

		}
		
		function setupDocos() {
			
			// replace the existing videos with images
			// attach click events to the images to setup and play
			
			var docoPanel = $('.doco')
			,	vidEls = $('video', docoPanel)
			// Create and disappear the closer button.
			,	closer = $('<div id="doco-closer" title="Close Video">&times;</div>')
			.on('click', stopDocoVideo)
			.prependTo(docoPanel);
			TweenMax.to(closer, 0, {autoAlpha: 0});
			
			vidEls.each(function(ix, el) {
				
				var vidEl = $(el)
				,	vidId = vidEl.attr('id')
				,	sources = $('source', el)
				;
				
				// Disappear the video
				TweenMax.to(vidEl, 0, {autoAlpha: 0});
				
				// Replace it with an image with a click event.
				thumbSrc = 'assets/stills/placeholder/sb-thumb-' + (ix + 1) + '.png';
				vidImg = $('<img src="' + thumbSrc + '" />').data('orig-video', vidEl);
				vidEl.parent().append(vidImg);
				// clear the poster to stop flash.
				vidEl.attr('poster', '');
				vidImg.on('click', playDocoVideo);
				vidEl.remove();
				
			});
			
		}
		
		function playContentVideo(id) {
		
			var videoEl = $('#' + id);
			if (options.debug)
			{ console.log('playContentVideo()', videoEl); }

			if (videoEl.length > 0) {
				try {
					videoEl.get(0).volume = 0;
					videoEl.get(0).play();
					TweenMax.to(videoEl, 1,	{ volume: 1 });
				}
				catch (ex) {
					// leave it
				}
			}
			
		}
		
		function stopContentVideo(id) {
			// pause video and remove src attr from source tags
			var videoEl = $('#' + id);
			if (options.debug)
			{ console.log('stopContentVideo()', videoEl); }
			
			if (videoEl.length > 0) {
				TweenMax.to(videoEl, 1
				,	{
						volume: 0
					,	onComplete: function(vid) {
							var videoEl = $(vid);
							try {
								videoEl.get(0).volume = 1;
								videoEl.get(0).pause();
								videoEl.get(0).load();
							}
							catch (ex) {}
						}
					,	onCompleteParams: videoEl
				});
			}
			
		}
		
		function removeAudio(_audio) {
		
			var victim = $('#' + _audio.attr('id'));
			
			if (victim.length > 0) {
				if (options.debug)
				{ console.log('removeAudio()', victim); }
				victim.get(0).pause();
				sources = $("source", victim);
				sources.each(function(sx, src) {
					src.setAttribute('src', '');
				});
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
		
		function playAudio(audioId, audioLoop) {
			
			if (location.search.match(/audio=(off|no|nils)/)) {
				return;
			}
			
			if (typeof retryCount[audioId] == 'undefined') {
				retryCount[audioId] = 0;
			}
			audioSrc = mediaSources[audioId];
			
			if (typeof(audioSrc) == 'undefined') {
				// it hasn't loaded yet - can't play.
				// if (options.debug)
				{ console.log('playAudio() cannot play %s - retrying #%i', audioId, retryCount[audioId] + 1); }
				// retry a max of ten times
				retryCount[audioId] += 1;
				if (retryCount[audioId] < retryMax) {
					setTimeout(playAudio, 1000, audioId, audioLoop);
				}
				
			}
			else {
				
				if (options.debug)
				{ console.log('playAudio() - trying to play audio#%s, current audio#%s, loop: %o', audioId, currAudioId, audioLoop, typeof audioLoop); }
				
				// we're want to play a new one - fade out the current audio element
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
						// fade out and remove the playing audio element
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
				audio = $('<audio id="' + audioId + '" preload="auto"' + (audioLoop ? ' loop="loop"' : '') + ' controls="controls" poster="chapter"><source src="' + audioSrc + '" /></audio>').appendTo(audioHolder);
				
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
		
		function stopAtmosVideo(videoId) {
		
			if (options.debug)
			{ console.log('stopAtmosVideo()', videoId); }
			
			var atmosVideoEl = $('video#' + videoId)
			;
			
			atmosVideoEl.get(0).pause();
			atmosVideoEl.get(0).load();
			$('source', atmosVideoEl).remove();
// 			if (navigator.userAgent.indexOf('Chrome') > -1) {
// 				$('source', atmosVideoEl).each(function(ix,el){
// 					$(el).attr('src','');
// 				});
// 			}
		
		}
		
		function playAtmosVideo(videoId) {
			
			// mediaSources[videoId] is set by onElementLoaded
			var videoSrc = mediaSources[videoId]
			,	atmosVideoEl = $('#' + videoId)
			;
			
			if (typeof retryCount[videoId] == 'undefined') {
				retryCount[videoId] = 0;
			}
			
			if (typeof(videoSrc) == 'undefined') {
				// it hasn't loaded yet - can't play.
				if (options.debug)
				{ console.log('playAtmosVideo() cannot play %s - retrying #%i', videoId, retryCount[videoId]); }
				// retry a max of ten times
				retryCount[videoId] += 1;
				if (retryCount[videoId] < retryMax) {
					setTimeout(playAtmosVideo, 1000, videoId);
				}
			}
			else
			{
				
				if (options.debug)
				{ console.log('playAtmosVideo() - trying to play video #%s with src %o ', videoId, atmosVideoEl); }

				if (atmosVideoEl.length > 0) {
					atmosVideoEl.append('<source src="' + mediaSources[videoId] + '" />');
					atmosVideoEl.get(0).load();
					atmosVideoEl.get(0).play();
					TweenMax.from(atmosVideoEl, 1, { autoAlpha: 0 });
					if (options.debug)
					{ console.log('playAtmosVideo() - %s should be playing', videoId); }
				}

			}
		}
		
		function setupAtmosVideo(obj, el) {
		
			if (location.search.match(/atmos=(off|no|nils)/)) {
				return;
			}
			
			// find the atmos panel from the obj.name == dom#id
			var atmosPanel = $('#' + obj.name)
			,	atmosPosterImg = $('img', atmosPanel)
			,	mediaType = $(el).attr('type')
			,	vidEl = null
			;
			
			if (options.debug)
			{ console.log('setupAtmosVideo(): loaded %s %s @ %o', obj.type, obj.name, new Date() - startTime); }
			
			mediaSources['vid-' + obj.name] = obj.source;
			
			if (atmosPanel.length) {
				// create vid elem with our specs
				vidEl = $('<video id="vid-' + obj.name + '" preload="auto" loop poster="assets/stills/placeholder/' + atmosPanel.data('video') + '.jpg"></video>');
				// remove the atmos panel placeholder image
				atmosPosterImg.remove();
				// add video elem with type but no src
				atmosPanel.append(vidEl);
			}
			
		}
		
		function preloadAtmosVideos() {
			
			// setup a preloader for each atmos video
			
			$('.atmos').each(function(ix, atmosEl) {
			
				var atmosEl = $(atmosEl)
				,	vidId = atmosEl.attr('id')
				,	vidSrc = atmosEl.data('video');
				
				if (options.debug)
				{ console.log('preloadAtmosVideos()', vidId, vidSrc); }
				
				$.html5Loader({
					filesToLoad: {
						'files': [ {  'type': 'VIDEO', 'name': vidId,
								'sources': {
									'webm': {
										'size': 2000, 'source': 'http://videocdn.sbs.com.au/u/video/operation-rimau/video/' +  vidSrc+ '-med.webm'
									},
									'h264': {
										'size': 2000, 'source': 'http://videocdn.sbs.com.au/u/video/operation-rimau/video/' +  vidSrc+ '-med.mp4'
									}
								}
							}
						]
					}
					, onElementLoaded: setupAtmosVideo
				});
			
			});
			
			// replace out the content video poster with the src based on the video filename
			// source has
			$('.video video').each(function(x, vidEl) {
			
				vidEl = $(vidEl);
				if (vidEl.data('first-frame') != 'undefined') {
					vidEl.prop('poster', vidEl.data('first-frame'));
				}
				
			});
			
		}
		
		function addMediaElement( obj, el ) {
		
			if (options.debug)
			{ console.log('loaded %s %s @ %o', obj.type, obj.name, new Date() - startTime); }
			
			mediaSources[obj.name] = obj.source;
			
		}
		
		// When the loader is complete (whether it work or not), fade out the intro and 
		// fade in the article and start the scroll to the first scene
		
		function pageStartComplete() {
		
			if (options.debug)
			{ console.log('loaded initial files - starting remaining'); }
			
			// load the audio assets - nothing need be done with them
			setTimeout(function(){
				$.html5Loader({
	
					filesToLoad:'assets/html5/preload-2.json'
				,	debugMode: false
				,	onElementLoaded: addMediaElement
				,	onComplete: preloadAtmosVideos
			
				});
			}, 3000);
			
			// return;
			
			// we got the opening track - cue it by scrolling in the opening scene
			
			if (options.debug)
			{ console.log('fade in article'); }
			// fade out loading message
			TweenMax.to('#loading', 1, { autoAlpha: 0, delay: 1 });
			// fade in the instruction message
			TweenMax.to('#instruction', 1,
			{
				autoAlpha: 1
			,	delay: 1
			,	onComplete: function(){
					$('#loading').addClass('hide');
					// fade out the instruction
					TweenMax.to('#instruction', 1, {autoAlpha: 0, delay: 1, onComplete: function(){
						$('#instruction').addClass('hide');
						
						$('article').removeClass('hide');
						TweenMax.to('article, ul.nav', 1, {autoAlpha: 1, onComplete: function(){
							location.hash = location.hash;
							openSection((location.hash == '' || location.hash == '#') ? '#the-mission' : location.hash, 2000);
						}});
						
					}});
				}
			});
				
			// setup the documentaries
			setupDocos();
			
		}
		
		function updateCounter(perc, total, loaded) {
			var counter = $('#load-counter')
			counter.html(perc + '%' + (options.debug ? "<br>(" + loaded.toFixed(0) + "/" + total.toFixed(0) + ")" : ''));
			if (perc == 100) {
				TweenMax.to(counter, 1, {autoAlpha: 0});
			}
		}





		// Setup the resize handlers to fix geometry of panels in the sequence
		
		// grab the window dimensions
		d = getWindowDims();
		// store for comparing on resize
		lastWindowWidth = d.w;
		
		// jquery plugin init this' elements
		ret = this;
		// only setup the sequence and timeline if over breakpoint width
		if (d.w > options.breakPoint) {

			// handle the resize event
			$(window).on('resize', fixDims);

			// setup the sequences inside each section
			ret = this.each(setupSequence);
			
			// fix the dimensions of the fixed elements and their children
			$(window).trigger('resize');

			// Handle scrolling into scene on nav clicks
			$('nav a, .return a').on('click', handleNav);
			
			// Hide the controls for videos
			$('.video video').removeProp('controls');

			// Begin! hide the article
			TweenMax.to('article, ul.nav', 0, {autoAlpha: 0});
			// take the article out of the flow so user cannot scroll
			$('article').addClass('hide');
			// setup visibility of loader and prompt
			TweenMax.to('#loading', 0, { autoAlpha: 1});
			TweenMax.to('#instruction', 0, { autoAlpha: 0});
			// make the loader and prompt layout enhanced (fixed 100%)
			$('.opening-panel').addClass('enhanced');

			// create the audio holder
			audioHolder = $('<div id="audio-holder"></div>').appendTo(body);

			// Preload chapter 1 media
			chapter1Preload = $.html5Loader({
					filesToLoad:'assets/html5/preload-1.json'
				,	debugMode: false
				,	onComplete: pageStartComplete
				,	onElementLoaded: addMediaElement
				,	onUpdate: updateCounter
			});
		
		}
		
		return ret;
			
		
	}

})(jQuery);