(function($){

	$.fn.trial = function(_options) {
	
		var body = $('body')
		,	win = $(window)
		,	windowDims = {}
		,	defaultOptions = {
				controller: new ScrollMagic()
			,	debug: false
			,	logLevel: 2
			}
		,	options = $.extend({}, defaultOptions, _options)
		;

		function getWindowDims() {
			windowDims = { w: body.width(), h: win.height() };
			return windowDims;
		}
		
		function setupTrial(trialIx, trial) {
		
			trial = $(trial);
			
			getWindowDims();
			qns = $('dt', trial);
			ans = $('dd', trial);
			
			timeline = new TimelineMax({
					onUpdate: options.debug ? function() {
					new_label = parseInt(this.time(), 10);
					if (new_label != last_label) {
						console.log('trial update',this.time(), this.currentLabel());
						last_label = new_label;
					}
				} : function(){}
			});
			
			sceneCount = qns.length; // the number of transitions
			framesPerScene = 3; // the number of frames in a scene
			frameOverlap = 0; // the number of frames which overlap between scenes
			frameHeight = (windowDims.h / 2); // the height of a 'scene' in pixels (half a window height)
	
			frameCount = (sceneCount * framesPerScene) + 1;
	
			totalDuration = frameCount *  frameHeight;
			
			if (options.debug) { console.log('got %i qns, duration: %i offset: %i, timeline: %o', qns.length, totalDuration, frameHeight, timeline); }
			
			timeline.add(TweenMax.from(trial, 1, {
					autoAlpha: 0
				, onStart: function(){ if (options.debug) { console.log('panel fade in start'); } }
				, onComplete: function(){ if (options.debug) { console.log('panel fade in complete'); } }
				}
			), "-=1");

			// Add a label (timestamp) for each sceneCount x framesPerScene - (sceneCount - 1) * frameOverlap	
			for (var ix = -1; ++ix <= frameCount;) {
				// labels offset from 0 - ie first is scene-0
				timeline.add('trial-scene-' + ix, ix);
			}

			for (var sceneNumber = 0; sceneNumber < sceneCount; sceneNumber++) {
				
				currQn = $(qns[sceneNumber]);
				currAn = $(ans[sceneNumber]);
				
				sceneStartFrame = (framesPerScene * sceneNumber);
				if (options.debug) { console.log('sceneNumber: %o sceneStartFrame: %o', sceneNumber, sceneStartFrame); }
	
				fadeQnStartLabel = 'trial-scene-' + (sceneStartFrame);
				fadeAnStartLabel = 'trial-scene-' + (sceneStartFrame + 1);
				
				timeline
// 				.add(TweenMax.set(currQn, {autoAlpha: 0}), 'trial-scene-0')
// 				.add(TweenMax.set(currAn, {autoAlpha: 0}), 'trial-scene-0')
				.add(TweenMax.from(currQn, 1, {
						autoAlpha: 0
					, onStartParams: [sceneNumber],	onStart: function(){ if (options.debug) { console.log('question ' +  arguments[0] + ' fade in start'); } }
					, onCompleteParams: [sceneNumber],	onComplete: function(){ if (options.debug) { console.log('question ' +  arguments[0] + ' fade in complete'); } }
					}), fadeQnStartLabel)
				.add(TweenMax.from(currAn, 1, {
						autoAlpha: 0
					, onStartParams: [sceneNumber],	onStart: function(){ if (options.debug) { console.log('answer ' +  arguments[0] + ' fade in start'); } }
					, onCompleteParams: [sceneNumber],	onComplete: function(){ if (options.debug) { console.log('answer ' +  arguments[0] + ' fade in complete'); } }
					}), fadeAnStartLabel)
					;
			}
			
			timeline.add(TweenMax.to(trial, 1, {
					autoAlpha: 0
				, onStart: function(){ if (options.debug) { console.log('panel fade out start'); } }
				, onComplete: function(){ if (options.debug) { console.log('panel fade out complete'); } }
				}), "+=2"
				);

			// Create a scroll scene
			scene = new ScrollScene({ duration: totalDuration, offset: frameHeight })
			.triggerElement(trial)
			.triggerHook('onCenter')
			.setPin(trial)
			.setTween(timeline)
			.addTo(options.controller)
			;
			if (options.debug) {
				scene.addIndicators({suffix: 'scene'});
			}
			
		}
		
		ret = this.each(setupTrial);
		
		return ret;

		
	}

})(jQuery);


// search children for data-text-replace and replace the contents of that element
// with an image whose src is the value data-text-replace
(function($){

	$.fn.replaceText = function() {
	
		function replace(ix, el) {
		
			var subject = $(el);
			
			filename = subject.data('text-replace');
			
			if (typeof filename !== 'undefined') {
				subject.addClass('text-replaced');
				title = subject.text().replace(/\s+/g, ' ').trim();
				newPath = 'assets/img/_opt/' + filename + '.png';
				newImg = $('<img id="repl-' + filename + '" src="' + newPath + '" title="' + title + '" class="replaced" />');
				['top','right','bottom','left','center','floor'].map(function(el,ix){ if (subject.hasClass(el)) { newImg.addClass(el); } });
				if (subject.hasClass('special')) {
					subject.parent().parent().append(newImg);
				}
				else {
					subject.parent().append(newImg);
				}
				//subject.remove();
				subject.empty();
			}
			
		}
		
		return this.each(replace);
		
	}
	
})(jQuery);

